package br.com.nutrimente.api.appointment;

import static br.com.nutrimente.api.appointment.ScheduleService.toInstant;
import static br.com.nutrimente.api.appointment.ScheduleService.toUtc;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.appointment.AppointmentDtos.AppointmentResponse;
import br.com.nutrimente.api.appointment.AppointmentDtos.BookRequest;
import br.com.nutrimente.api.appointment.AppointmentDtos.Person;
import br.com.nutrimente.api.appointment.AppointmentDtos.ProfessionalSummary;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.common.event.AppointmentBookedEvent;
import br.com.nutrimente.api.common.event.AppointmentCancelledEvent;
import br.com.nutrimente.api.common.event.AppointmentCompletedEvent;
import br.com.nutrimente.api.common.event.AppointmentConfirmedEvent;
import br.com.nutrimente.api.common.event.AppointmentRescheduledEvent;
import br.com.nutrimente.api.config.AppProperties;
import br.com.nutrimente.api.review.ReviewRepository;
import br.com.nutrimente.api.screening.ScreeningService;
import br.com.nutrimente.api.user.Patient;
import br.com.nutrimente.api.user.PatientRepository;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.User;

/**
 * Consultas: agendar, listar, cancelar, remarcar, confirmar e concluir.
 *
 * Regra de ouro (segurança): o id de quem age vem SEMPRE do token. Uma
 * consulta só é vista ou alterada por quem participa dela; para os outros,
 * ela "não existe" (404), para não revelar consultas de terceiros.
 */
@Service
public class AppointmentService {

	/** Quantas consultas no máximo por lista (próximas ou histórico) */
	private static final int LIST_LIMIT = 100;

	static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEEE, dd/MM 'às' HH:mm",
			ScheduleService.PT_BR);

	private final AppointmentRepository appointments;
	private final PatientRepository patients;
	private final ProfessionalRepository professionals;
	private final ScheduleService schedule;
	private final ReviewRepository reviews;
	private final ScreeningService screenings;
	private final AppProperties.Appointments rules;
	private final ApplicationEventPublisher publisher;

	public AppointmentService(AppointmentRepository appointments, PatientRepository patients,
			ProfessionalRepository professionals, ScheduleService schedule,
			ReviewRepository reviews, AppProperties properties,
			ScreeningService screenings, ApplicationEventPublisher publisher) {
		this.screenings = screenings;
		this.appointments = appointments;
		this.patients = patients;
		this.professionals = professionals;
		this.schedule = schedule;
		this.reviews = reviews;
		this.rules = properties.appointments();
		this.publisher = publisher;
	}

	// ---------------- Agendar ----------------

	@Transactional
	public AppointmentResponse book(Long patientId, BookRequest request) {
		Patient patient = patients.findById(patientId)
				.filter(p -> p.getUser().canLogin())
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_INVALID",
						"Sua sessão não é mais válida. Entre novamente."));
		Professional professional = professionals.findPublicById(request.professionalId())
				.orElseThrow(() -> ApiException.notFound("Profissional não encontrado."));
		if (professional.getConsultationPrice() == null) {
			throw new ApiException(HttpStatus.CONFLICT, "PRICE_NOT_SET",
					"Este profissional ainda não definiu o valor da consulta.");
		}
		if (!schedule.isFree(professional.getId(), request.startsAt())) {
			throw slotUnavailable();
		}

		LocalDateTime startsAt = toUtc(request.startsAt());
		LocalDateTime endsAt = startsAt.plus(professional.consultationDuration());
		checkPatientFree(patientId, startsAt, endsAt);

		// Online só com quem declarou o cadastro no conselho (e-Psi / e-Nutricionista);
		// presencial só com quem informou o endereço do consultório.
		// Sem modalidade no pedido: online se o profissional atende online, senão presencial.
		Modality modality = request.modality() != null ? request.modality()
				: professional.offersOnline() ? Modality.ONLINE : Modality.PRESENCIAL;
		if (modality == Modality.ONLINE && !professional.offersOnline()) {
			throw new ApiException(HttpStatus.CONFLICT, "ONLINE_NOT_AVAILABLE",
					"Este profissional ainda não atende online. Escolha a consulta presencial.");
		}
		if (modality == Modality.PRESENCIAL && !professional.offersInPerson()) {
			throw new ApiException(HttpStatus.CONFLICT, "IN_PERSON_NOT_AVAILABLE",
					professional.offersOnline() ? "Este profissional ainda não atende presencialmente. Escolha a consulta online."
							: "Este profissional ainda não informou como atende.");
		}
		Appointment appointment = save(new Appointment(patient, professional, startsAt, endsAt, modality,
				videoUrlFor(modality), professional.getConsultationPrice(), Digits.trimToNull(request.notes()), null));
		if (request.screening() != null) {
			screenings.saveForNewAppointment(appointment.getId(), request.screening());
		}

		publisher.publishEvent(new AppointmentBookedEvent(
				appointment.getId(), patientId,
				patient.getUser().getName(), patient.getUser().getEmail(),
				professional.getId(), professional.getUser().getName(), professional.getUser().getEmail(),
				describe(appointment), modalityLabel(modality), cancelPolicy()));
		return toResponse(appointment, patientId);
	}

	// ---------------- Consultar ----------------

	public enum Scope {
		/** Ainda vão acontecer (agendadas ou confirmadas), da mais próxima para a mais distante */
		UPCOMING,
		/** Já passaram, foram canceladas ou remarcadas, da mais recente para a mais antiga */
		PAST
	}

	@Transactional(readOnly = true)
	public List<AppointmentResponse> list(Long userId, Scope scope) {
		LocalDateTime now = toUtc(Instant.now());
		PageRequest limit = PageRequest.of(0, LIST_LIMIT);
		List<Appointment> found = scope == Scope.PAST
				? appointments.findPast(userId, now, AppointmentStatus.UPCOMING, limit)
				: appointments.findUpcoming(userId, now, AppointmentStatus.UPCOMING, limit);
		// Quais já foram avaliadas: UMA consulta ao banco para a lista toda
		List<Long> completedIds = found.stream().filter(a -> a.getStatus() == AppointmentStatus.COMPLETED)
				.map(a -> a.getId()).toList();
		Set<Long> reviewed = completedIds.isEmpty() ? Set.of()
				: Set.copyOf(reviews.findReviewedAppointmentIds(completedIds));
		return found.stream().map(a -> toResponse(a, userId, reviewed.contains(a.getId()))).toList();
	}

	@Transactional(readOnly = true)
	public AppointmentResponse get(Long userId, Long id) {
		return toResponse(participantAppointment(userId, id), userId);
	}

	// ---------------- Cancelar e remarcar ----------------

	@Transactional
	public AppointmentResponse cancel(Long userId, Long id, String reason) {
		Appointment appointment = participantAppointment(userId, id);
		boolean byPatient = isPatient(appointment, userId);
		checkChangeable(appointment, byPatient, "cancelada");

		appointment.cancel(userId, Digits.trimToNull(reason));

		User canceller = byPatient ? appointment.getPatient().getUser() : appointment.getProfessional().getUser();
		User other = byPatient ? appointment.getProfessional().getUser() : appointment.getPatient().getUser();
		publisher.publishEvent(new AppointmentCancelledEvent(
				appointment.getId(), appointment.getPatient().getId(), userId, byPatient,
				other.getId(), other.getEmail(), other.getName(),
				canceller.getName(), describe(appointment), appointment.getCancellationReason()));
		return toResponse(appointment, userId);
	}

	/**
	 * Só o paciente remarca (o profissional cancela e o paciente agenda de novo).
	 * A consulta original vira RESCHEDULED e nasce uma nova, com o MESMO valor
	 * combinado, que guarda o id da original (rescheduled_from_id).
	 */
	@Transactional
	public AppointmentResponse reschedule(Long userId, Long id, Instant newStartsAt) {
		Appointment original = participantAppointment(userId, id);
		if (!isPatient(original, userId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN",
					"Só o paciente pode remarcar. Cancele a consulta para liberar o horário.");
		}
		checkChangeable(original, true, "remarcada");
		if (!schedule.isFree(original.getProfessional().getId(), newStartsAt)) {
			throw slotUnavailable();
		}

		// Libera o horário antigo ANTES de ocupar o novo (as regras de
		// "horário ocupado" olham só consultas ativas). Se algo der errado
		// abaixo, a transação desfaz tudo e a consulta original volta.
		original.markRescheduled(userId);
		appointments.flush();

		LocalDateTime startsAt = toUtc(newStartsAt);
		LocalDateTime endsAt = startsAt.plus(original.getProfessional().consultationDuration());
		checkPatientFree(userId, startsAt, endsAt);
		Appointment created = save(new Appointment(original.getPatient(), original.getProfessional(), startsAt, endsAt,
				original.getModality(), videoUrlFor(original.getModality()), original.getPrice(), original.getNotes(),
				original.getId()));
		screenings.copy(original.getId(), created.getId());

		publisher.publishEvent(new AppointmentRescheduledEvent(
				original.getId(), created.getId(), created.getPatient().getId(),
				created.getProfessional().getId(),
				created.getPatient().getUser().getName(), created.getPatient().getUser().getEmail(),
				created.getProfessional().getUser().getName(), created.getProfessional().getUser().getEmail(),
				describe(original), describe(created), cancelPolicy()));
		return toResponse(created, userId);
	}

	// ---------------- Ações do profissional ----------------

	@Transactional
	public AppointmentResponse confirm(Long userId, Long id) {
		Appointment appointment = professionalAppointment(userId, id);
		if (appointment.getStatus() != AppointmentStatus.SCHEDULED || !Instant.now().isBefore(endsAt(appointment))) {
			throw invalidStatus("Só dá para confirmar consultas agendadas que ainda não aconteceram.");
		}
		appointment.confirm();
		publisher.publishEvent(new AppointmentConfirmedEvent(
				appointment.getId(), appointment.getPatient().getId(), userId,
				appointment.getPatient().getUser().getEmail(), appointment.getPatient().getUser().getName(),
				appointment.getProfessional().getUser().getName(), describe(appointment),
				appointment.getVideoUrl(), cancelPolicy()));
		return toResponse(appointment, userId);
	}

	@Transactional
	public AppointmentResponse complete(Long userId, Long id) {
		Appointment appointment = professionalAppointment(userId, id);
		if (!appointment.getStatus().isChangeable() || Instant.now().isBefore(startsAt(appointment))) {
			throw invalidStatus("Só dá para concluir a consulta depois do horário de início.");
		}
		appointment.complete();
		publisher.publishEvent(new AppointmentCompletedEvent(
				appointment.getId(), appointment.getPatient().getId(), userId));
		return toResponse(appointment, userId);
	}

	// ---------------- Regras compartilhadas ----------------

	private Appointment participantAppointment(Long userId, Long id) {
		return appointments.findWithPeople(id)
				.filter(a -> a.hasParticipant(userId))
				.orElseThrow(() -> ApiException.notFound("Consulta não encontrada."));
	}

	private Appointment professionalAppointment(Long userId, Long id) {
		Appointment appointment = participantAppointment(userId, id);
		if (isPatient(appointment, userId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só o profissional pode fazer isso.");
		}
		return appointment;
	}

	/**
	 * Cancelar/remarcar: a consulta precisa estar agendada ou confirmada e
	 * ainda não ter começado. O paciente tem um prazo (24 h antes, por
	 * padrão); o profissional pode cancelar até o início.
	 */
	private void checkChangeable(Appointment appointment, boolean byPatient, String action) {
		Instant now = Instant.now();
		if (!appointment.getStatus().isChangeable() || !now.isBefore(startsAt(appointment))) {
			throw invalidStatus("Esta consulta não pode mais ser %s.".formatted(action));
		}
		if (byPatient && now.isAfter(startsAt(appointment).minus(rules.patientCancelLimit()))) {
			throw new ApiException(HttpStatus.CONFLICT, "TOO_LATE",
					"A consulta só pode ser %s até %d horas antes. Fale com o profissional."
							.formatted(action, rules.patientCancelLimit().toHours()));
		}
	}

	private void checkPatientFree(Long patientId, LocalDateTime startsAt, LocalDateTime endsAt) {
		if (appointments.patientBusy(patientId, startsAt, endsAt, AppointmentStatus.OCCUPYING)) {
			throw new ApiException(HttpStatus.CONFLICT, "PATIENT_BUSY", "Você já tem uma consulta nesse horário.",
					Map.of("startsAt", "Você já tem uma consulta nesse horário"));
		}
	}

	/**
	 * saveAndFlush grava na hora: se duas pessoas clicarem no mesmo horário ao
	 * mesmo tempo, o índice único do banco recusa a segunda, e respondemos 409.
	 */
	private Appointment save(Appointment appointment) {
		try {
			return appointments.saveAndFlush(appointment);
		} catch (DataIntegrityViolationException e) {
			throw slotUnavailable();
		}
	}

	private static ApiException slotUnavailable() {
		return new ApiException(HttpStatus.CONFLICT, "SLOT_UNAVAILABLE",
				"Este horário não está mais disponível. Escolha outro.",
				Map.of("startsAt", "Horário indisponível. Escolha outro"));
	}

	private static ApiException invalidStatus(String message) {
		return new ApiException(HttpStatus.CONFLICT, "INVALID_STATUS", message);
	}

	/**
	 * Link de videochamada para consultas online (Jitsi Meet, gratuito, abre no
	 * navegador, numa aba nova). O nome da sala é aleatório e difícil de
	 * adivinhar, e só os dois participantes o recebem.
	 *
	 * Regras do meet.jit.si público (desde 2023):
	 * - quem ABRE a sala (o primeiro a entrar) precisa entrar com uma conta
	 *   Google, GitHub ou Facebook e vira moderador; os demais entram sem
	 *   conta. Por isso o profissional deve entrar primeiro;
	 * - embutir a chamada dentro do site (iframe) derruba a ligação em 5 min.
	 *   Para isso seria preciso o JaaS (Jitsi as a Service) ou um Jitsi próprio.
	 *
	 * Nada da chamada é gravado nem passa pelo NutriMente: o sistema guarda
	 * só os dados da consulta (data, situação, link). A gravação de teleconsulta
	 * exige autorização expressa (CFN 666/2020) e não faz parte do projeto.
	 */
	private static String videoUrlFor(Modality modality) {
		if (modality != Modality.ONLINE) {
			return null;
		}
		return "https://meet.jit.si/NutriMente-" + UUID.randomUUID().toString().replace("-", "").substring(0, 20);
	}

	private static boolean isPatient(Appointment appointment, Long userId) {
		return appointment.getPatient().getId().equals(userId);
	}

	private static Instant startsAt(Appointment a) {
		return toInstant(a.getStartsAt());
	}

	private static Instant endsAt(Appointment a) {
		return toInstant(a.getEndsAt());
	}

	/** "terça-feira, 20/10 às 09:00", no fuso da agenda */
	private String describe(Appointment a) {
		return WHEN.format(startsAt(a).atZone(schedule.zone()));
	}

	static String modalityLabel(Modality modality) {
		return modality == Modality.ONLINE ? "online, por videochamada" : "presencial";
	}

	private String cancelPolicy() {
		return "Se precisar, você pode cancelar ou remarcar até %d horas antes pela sua área do NutriMente."
				.formatted(rules.patientCancelLimit().toHours());
	}

	private AppointmentResponse toResponse(Appointment a, Long viewerId) {
		boolean reviewed = a.getStatus() == AppointmentStatus.COMPLETED && reviews.existsByAppointmentId(a.getId());
		return toResponse(a, viewerId, reviewed);
	}

	private AppointmentResponse toResponse(Appointment a, Long viewerId, boolean reviewed) {
		Instant now = Instant.now();
		boolean viewerIsPatient = isPatient(a, viewerId);
		boolean beforeStart = now.isBefore(startsAt(a));
		boolean withinPatientLimit = !now.isAfter(startsAt(a).minus(rules.patientCancelLimit()));
		boolean changeable = a.getStatus().isChangeable() && beforeStart;
		Professional professional = a.getProfessional();
		return new AppointmentResponse(
				a.getId(),
				startsAt(a),
				endsAt(a),
				a.getStatus(),
				a.getModality(),
				a.getVideoUrl(),
				a.getPrice(),
				a.getNotes(),
				a.getCancellationReason(),
				a.getRescheduledFromId(),
				new Person(a.getPatient().getId(), a.getPatient().getUser().getName(),
						a.getPatient().getUser().getPhotoUrl()),
				new ProfessionalSummary(professional.getId(), professional.getUser().getName(),
						professional.getUser().getPhotoUrl(), professional.getType()),
				changeable && (!viewerIsPatient || withinPatientLimit),
				changeable && viewerIsPatient && withinPatientLimit,
				!viewerIsPatient && a.getStatus() == AppointmentStatus.SCHEDULED && now.isBefore(endsAt(a)),
				!viewerIsPatient && a.getStatus().isChangeable() && !beforeStart,
				viewerIsPatient && a.getStatus() == AppointmentStatus.COMPLETED && !reviewed,
				!viewerIsPatient && a.acceptsRecord(now),
				viewerIsPatient && a.acceptsScreening(now),
				a.getModality() == Modality.PRESENCIAL ? professional.fullOfficeAddress() : null);
	}
}
