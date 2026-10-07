package br.com.nutrimente.api.review;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.appointment.Appointment;
import br.com.nutrimente.api.appointment.AppointmentRepository;
import br.com.nutrimente.api.appointment.AppointmentStatus;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.professional.ProfessionalController.PageResponse;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.User;

/**
 * Avaliações: o paciente avalia uma consulta REALIZADA, uma vez só, e a nota
 * média do profissional é recalculada na mesma transação (assim a busca já
 * mostra a nota nova na hora).
 */
@Service
public class ReviewService {

	private static final int MAX_PAGE_SIZE = 50;

	private final ReviewRepository reviews;
	private final AppointmentRepository appointments;
	private final ProfessionalRepository professionals;
	private final LogClient logClient;

	public ReviewService(ReviewRepository reviews, AppointmentRepository appointments,
			ProfessionalRepository professionals, LogClient logClient) {
		this.reviews = reviews;
		this.appointments = appointments;
		this.professionals = professionals;
		this.logClient = logClient;
	}

	@Transactional
	public PublicReview review(Long patientId, Long appointmentId, int rating, String comment) {
		// Só quem foi o PACIENTE da consulta avalia; para os outros ela "não existe"
		Appointment appointment = appointments.findWithPeople(appointmentId)
				.filter(a -> a.hasParticipant(patientId))
				.orElseThrow(() -> ApiException.notFound("Consulta não encontrada."));
		if (!appointment.getPatient().getId().equals(patientId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só o paciente avalia a consulta.");
		}
		if (appointment.getStatus() != AppointmentStatus.COMPLETED) {
			throw new ApiException(HttpStatus.CONFLICT, "NOT_COMPLETED",
					"Só dá para avaliar depois que a consulta for realizada.");
		}
		if (reviews.existsByAppointmentId(appointmentId)) {
			throw alreadyReviewed();
		}

		Review review;
		try {
			review = reviews.saveAndFlush(new Review(appointment, rating, Digits.trimToNull(comment)));
		} catch (DataIntegrityViolationException e) {
			throw alreadyReviewed(); // dois cliques ao mesmo tempo: o UNIQUE do banco segura
		}
		recalculateRating(appointment.getProfessional());

		Long reviewId = review.getId();
		AfterCommit.run(() -> logClient.audit(patientId, "PATIENT", "CREATE", "reviews", reviewId, patientId));
		return PublicReview.of(review);
	}

	@Transactional(readOnly = true)
	public PageResponse<PublicReview> listPublic(Long professionalId, int page, int size) {
		professionals.findPublicById(professionalId)
				.orElseThrow(() -> ApiException.notFound("Profissional não encontrado."));
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
		return PageResponse.of(reviews.findByProfessional(professionalId, pageable).map(PublicReview::of));
	}

	/** Recalcula a partir de TODAS as avaliações (não acumula erro de arredondamento) */
	private void recalculateRating(Professional professional) {
		Object[] summary = reviews.ratingSummary(professional.getId()).getFirst();
		double average = summary[0] == null ? 0 : ((Number) summary[0]).doubleValue();
		int count = ((Number) summary[1]).intValue();
		professional.updateRating(BigDecimal.valueOf(average).setScale(2, RoundingMode.HALF_UP), count);
	}

	private static ApiException alreadyReviewed() {
		return new ApiException(HttpStatus.CONFLICT, "ALREADY_REVIEWED", "Você já avaliou esta consulta.");
	}

	/**
	 * Avaliação como aparece no perfil público. O nome do paciente vai
	 * ABREVIADO ("Ana S."): dá credibilidade sem expor quem se consulta
	 * com quem (dado de saúde, LGPD).
	 */
	public record PublicReview(Long id, int rating, String comment, String patientName, Instant createdAt) {

		static PublicReview of(Review r) {
			return new PublicReview(r.getId(), r.getRating(), r.getComment(), shortName(r.getPatient().getUser()),
					r.getCreatedAt().toInstant(ZoneOffset.UTC));
		}

		/** "Ana Souza" -> "Ana S."; conta excluída -> "Paciente" */
		static String shortName(User user) {
			if (!user.canLogin()) {
				return "Paciente";
			}
			List<String> parts = List.of(user.getName().trim().split("\\s+"));
			if (parts.size() == 1) {
				return parts.getFirst();
			}
			return parts.getFirst() + " " + parts.getLast().charAt(0) + ".";
		}
	}
}
