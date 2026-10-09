package br.com.nutrimente.api.plan;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.appointment.Appointment;
import br.com.nutrimente.api.appointment.AppointmentDtos.Person;
import br.com.nutrimente.api.appointment.AppointmentDtos.ProfessionalSummary;
import br.com.nutrimente.api.appointment.AppointmentRepository;
import br.com.nutrimente.api.appointment.AppointmentStatus;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.config.AppProperties;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.notification.EmailService;
import br.com.nutrimente.api.notification.Notification;
import br.com.nutrimente.api.notification.NotificationLinks;
import br.com.nutrimente.api.notification.NotificationService;
import br.com.nutrimente.api.plan.PlanDtos.ChecklistInput;
import br.com.nutrimente.api.plan.PlanDtos.ChecklistView;
import br.com.nutrimente.api.plan.PlanDtos.DayMark;
import br.com.nutrimente.api.plan.PlanDtos.GoalInput;
import br.com.nutrimente.api.plan.PlanDtos.GoalView;
import br.com.nutrimente.api.plan.PlanDtos.MealInput;
import br.com.nutrimente.api.plan.PlanDtos.MealView;
import br.com.nutrimente.api.plan.PlanDtos.MyPatient;
import br.com.nutrimente.api.plan.PlanDtos.PlanDetail;
import br.com.nutrimente.api.plan.PlanDtos.PlanRequest;
import br.com.nutrimente.api.plan.PlanDtos.PlanSummary;
import br.com.nutrimente.api.plan.PlanDtos.ProgressRequest;
import br.com.nutrimente.api.plan.PlanDtos.ProgressView;
import br.com.nutrimente.api.plan.PlanEnums.Frequency;
import br.com.nutrimente.api.plan.PlanEnums.PlanStatus;
import br.com.nutrimente.api.user.Patient;
import br.com.nutrimente.api.user.PatientRepository;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.User;

/**
 * Plano de ação.
 *
 * Quem faz o quê:
 * - PROFISSIONAL: cria o plano (só para paciente que ele atende), edita e muda a situação.
 * - PACIENTE: marca o checklist do dia (e dos últimos 7 dias, para corrigir esquecimentos).
 * - OS DOIS: marcam metas como cumpridas e registram progresso (peso, humor, observações).
 * Para quem não participa do plano, ele "não existe" (404).
 *
 * "Hoje" é o dia no fuso da agenda (America/Sao_Paulo), não em UTC: às 22h
 * de segunda no Brasil ainda é segunda para o checklist.
 */
@Service
public class PlanService {

	/** Quantos dias para trás o paciente pode marcar (e quantos aparecem no histórico) */
	static final int CHECK_WINDOW_DAYS = 7;

	/** Consultas que ligam paciente e profissional: agendada, confirmada ou realizada */
	private static final Set<AppointmentStatus> LINKING = AppointmentStatus.LINKING;

	private final ActionPlanRepository plans;
	private final PatientRepository patients;
	private final ProfessionalRepository professionals;
	private final AppointmentRepository appointments;
	private final EmailService emailService;
	private final LogClient logClient;
	private final NotificationService notifications;
	private final ZoneId zone;

	public PlanService(ActionPlanRepository plans, PatientRepository patients, ProfessionalRepository professionals,
			AppointmentRepository appointments, EmailService emailService, LogClient logClient,
			NotificationService notifications, AppProperties properties) {
		this.plans = plans;
		this.patients = patients;
		this.professionals = professionals;
		this.appointments = appointments;
		this.emailService = emailService;
		this.logClient = logClient;
		this.notifications = notifications;
		this.zone = ZoneId.of(properties.appointments().timezone());
	}

	LocalDate today() {
		return LocalDate.now(zone);
	}

	// ---------------- Profissional ----------------

	@Transactional(readOnly = true)
	public List<MyPatient> myPatients(Long professionalId) {
		// A consulta já vem da mais recente para a mais antiga: a primeira de cada paciente é a última consulta
		Map<Long, Appointment> latest = new LinkedHashMap<>();
		appointments.findOfProfessional(professionalId, LINKING)
				.forEach(a -> latest.putIfAbsent(a.getPatient().getId(), a));
		return latest.values().stream()
				.filter(a -> a.getPatient().getUser().canLogin())
				.map(a -> new MyPatient(a.getPatient().getId(), a.getPatient().getUser().getName(),
						a.getPatient().getUser().getPhotoUrl(), a.getStartsAt().toInstant(ZoneOffset.UTC)))
				.sorted(Comparator.comparing(p -> p.name()))
				.toList();
	}

	@Transactional
	public PlanDetail create(Long professionalId, PlanRequest request) {
		if (request.patientId() == null) {
			throw fieldError("patientId", "Escolha o paciente");
		}
		Professional professional = professionals.findById(professionalId)
				.orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só profissionais criam planos."));
		Patient patient = patients.findById(request.patientId())
				.filter(p -> p.getUser().canLogin())
				.filter(p -> appointments.linked(p.getId(), professionalId, LINKING))
				.orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "NOT_YOUR_PATIENT",
						"Você só pode criar planos para pacientes que atende (com consulta marcada ou realizada).",
						Map.of("patientId", "Escolha um dos seus pacientes")));

		ActionPlan plan = new ActionPlan(patient, professional);
		apply(plan, request);
		plans.saveAndFlush(plan);

		User to = patient.getUser();
		String email = to.getEmail();
		String name = to.getName();
		String intro = "%s criou um plano de ação para você: \"%s\".".formatted(professional.getUser().getName(),
				plan.getTitle());
		notifications.notify(patient.getId(), Notification.Type.PLAN, "Novo plano de ação", intro,
				NotificationLinks.plan(plan.getId()));
		AfterCommit.run(() -> emailService.sendPlanNotice(email, name, "Novo plano de ação", intro));
		audit(professionalId, "PROFESSIONAL", "CREATE", plan);
		return detail(plan, professionalId);
	}

	@Transactional
	public PlanDetail update(Long professionalId, Long planId, PlanRequest request) {
		ActionPlan plan = ownedPlan(professionalId, planId);
		apply(plan, request);
		plans.flush(); // grava agora: metas e itens novos ganham id antes de montar a resposta
		notifications.notify(plan.getPatient().getId(), Notification.Type.PLAN, "Plano de ação atualizado",
				"%s atualizou o plano \"%s\".".formatted(plan.getProfessional().getUser().getName(), plan.getTitle()),
				NotificationLinks.plan(plan.getId()));
		audit(professionalId, "PROFESSIONAL", "UPDATE", plan);
		return detail(plan, professionalId);
	}

	@Transactional
	public PlanDetail changeStatus(Long professionalId, Long planId, PlanStatus status) {
		ActionPlan plan = ownedPlan(professionalId, planId);
		plan.changeStatus(status);
		audit(professionalId, "PROFESSIONAL", "UPDATE", plan);
		return detail(plan, professionalId);
	}

	/** Copia título, datas e listas do formulário para o plano (criação e edição) */
	private void apply(ActionPlan plan, PlanRequest request) {
		if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
			throw fieldError("endDate", "A data de término precisa ser depois do início");
		}
		plan.updateHeader(request.title().strip(), Digits.trimToNull(request.description()), request.startDate(),
				request.endDate());
		syncGoals(plan, orEmpty(request.goals()));
		syncMeals(plan, orEmpty(request.meals()));
		syncChecklist(plan, orEmpty(request.checklist()));
	}

	/** Metas: com id = atualiza; sem id = cria; as que não vieram saem (orphanRemoval) */
	private void syncGoals(ActionPlan plan, List<GoalInput> inputs) {
		Map<Long, PlanGoal> current = plan.getGoals().stream()
				.collect(Collectors.toMap(g -> g.getId(), Function.identity()));
		List<PlanGoal> result = new ArrayList<>();
		for (GoalInput in : inputs) {
			PlanGoal goal = in.id() == null ? null : current.get(in.id());
			if (in.id() != null && goal == null) {
				throw fieldError("goals", "Meta %d não pertence a este plano".formatted(in.id()));
			}
			if (goal == null) {
				goal = new PlanGoal(plan, in.description().strip(), in.targetValue(), Digits.trimToNull(in.unit()),
						in.dueDate());
			} else {
				goal.update(in.description().strip(), in.targetValue(), Digits.trimToNull(in.unit()), in.dueDate());
			}
			result.add(goal);
		}
		plan.getGoals().clear();
		plan.getGoals().addAll(result);
	}

	/** Refeições: a lista enviada substitui a anterior (não têm histórico) */
	private void syncMeals(ActionPlan plan, List<MealInput> inputs) {
		plan.getMeals().clear();
		for (MealInput in : inputs) {
			plan.getMeals().add(new MealRoutine(plan, in.mealType(), in.mealTime(), in.dayOfWeek(),
					in.description().strip()));
		}
	}

	/** Checklist: com id = atualiza (e reativa); sem id = cria; os que não vieram são DESATIVADOS */
	private void syncChecklist(ActionPlan plan, List<ChecklistInput> inputs) {
		Map<Long, ChecklistItem> current = plan.getChecklist().stream()
				.collect(Collectors.toMap(i -> i.getId(), Function.identity()));
		List<Long> kept = new ArrayList<>();
		for (ChecklistInput in : inputs) {
			if (in.id() == null) {
				plan.getChecklist().add(new ChecklistItem(plan, in.description().strip(), in.frequency()));
				continue;
			}
			ChecklistItem item = current.get(in.id());
			if (item == null) {
				throw fieldError("checklist", "Item %d não pertence a este plano".formatted(in.id()));
			}
			item.update(in.description().strip(), in.frequency());
			kept.add(item.getId());
		}
		current.values().stream().filter(i -> !kept.contains(i.getId())).forEach(i -> i.deactivate());
	}

	// ---------------- Paciente e os dois ----------------

	@Transactional(readOnly = true)
	public List<PlanSummary> list(Long userId) {
		LocalDate today = today();
		return plans.findAllOf(userId).stream().map(p -> summary(p, today)).toList();
	}

	@Transactional(readOnly = true)
	public PlanDetail get(Long userId, Long planId) {
		return detail(participantPlan(userId, planId), userId);
	}

	/** Paciente marca (ou desmarca) um item do checklist num dia */
	@Transactional
	public PlanDetail check(Long patientId, Long planId, Long itemId, LocalDate date, boolean completed) {
		ActionPlan plan = participantPlan(patientId, planId);
		if (!plan.isPatient(patientId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só o paciente marca o checklist.");
		}
		if (plan.getStatus() != PlanStatus.ACTIVE) {
			throw new ApiException(HttpStatus.CONFLICT, "PLAN_NOT_ACTIVE", "Este plano não está ativo.");
		}
		LocalDate today = today();
		LocalDate earliest = max(plan.getStartDate(), today.minusDays(CHECK_WINDOW_DAYS - 1));
		if (date.isAfter(today) || date.isBefore(earliest)) {
			throw fieldError("date", "Só dá para marcar de %s até hoje".formatted(earliest));
		}
		ChecklistItem item = plan.getChecklist().stream()
				.filter(i -> i.getId().equals(itemId) && i.isActive())
				.findFirst()
				.orElseThrow(() -> ApiException.notFound("Item do checklist não encontrado."));
		item.mark(date, completed);
		return detail(plan, patientId);
	}

	@Transactional
	public PlanDetail setGoal(Long userId, Long planId, Long goalId, boolean completed) {
		ActionPlan plan = participantPlan(userId, planId);
		PlanGoal goal = plan.getGoals().stream().filter(g -> g.getId().equals(goalId)).findFirst()
				.orElseThrow(() -> ApiException.notFound("Meta não encontrada."));
		goal.setCompleted(completed);
		return detail(plan, userId);
	}

	@Transactional
	public PlanDetail addProgress(Long userId, Long planId, ProgressRequest request) {
		ActionPlan plan = participantPlan(userId, planId);
		if (request.weightKg() == null && request.moodScore() == null && Digits.trimToNull(request.notes()) == null) {
			throw fieldError("notes", "Informe o peso, o humor ou uma observação");
		}
		LocalDate date = request.recordDate() == null ? today() : request.recordDate();
		if (date.isAfter(today())) {
			throw fieldError("recordDate", "A data não pode ser no futuro");
		}
		User author = plan.isPatient(userId) ? plan.getPatient().getUser() : plan.getProfessional().getUser();
		plan.getProgress().add(new ProgressRecord(plan, author, date, request.weightKg(), request.moodScore(),
				Digits.trimToNull(request.notes())));
		plans.flush(); // o registro novo ganha id antes de montar a resposta
		if (!plan.isPatient(userId) && request.notes() != null) {
			notifications.notify(plan.getPatient().getId(), Notification.Type.PLAN, "Nova observação no seu plano",
					"%s: %s".formatted(author.getName(), Digits.trimToNull(request.notes())),
					NotificationLinks.plan(plan.getId()));
		}
		return detail(plan, userId);
	}

	// ---------------- Regras compartilhadas ----------------

	private ActionPlan participantPlan(Long userId, Long planId) {
		return plans.findWithPeople(planId)
				.filter(p -> p.hasParticipant(userId))
				.orElseThrow(() -> ApiException.notFound("Plano não encontrado."));
	}

	private ActionPlan ownedPlan(Long professionalId, Long planId) {
		ActionPlan plan = participantPlan(professionalId, planId);
		if (plan.isPatient(professionalId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só o profissional edita o plano.");
		}
		return plan;
	}

	private static ApiException fieldError(String field, String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, Map.of(field, message));
	}

	private static <T> List<T> orEmpty(List<T> list) {
		return list == null ? List.of() : list;
	}

	private static LocalDate max(LocalDate a, LocalDate b) {
		return a.isAfter(b) ? a : b;
	}

	private void audit(Long actorId, String role, String action, ActionPlan plan) {
		Long id = plan.getId();
		Long patientId = plan.getPatient().getId();
		AfterCommit.run(() -> logClient.audit(actorId, role, action, "action_plans", id, patientId));
	}

	// ---------------- Montagem das respostas ----------------

	/** O item conta como feito "hoje"? Diário: hoje; semanal: nesta semana (seg a dom); único: alguma vez */
	private static boolean doneNow(ChecklistItem item, LocalDate today) {
		return switch (item.getFrequency()) {
			case DAILY -> item.doneOn(today);
			case WEEKLY -> {
				LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
				yield item.getEntries().stream().anyMatch(e -> e.isCompleted() && !e.getEntryDate().isBefore(monday)
						&& !e.getEntryDate().isAfter(today));
			}
			case ONCE -> item.getEntries().stream().anyMatch(e -> e.isCompleted());
		};
	}

	/** % dos itens diários cumpridos nos últimos 7 dias (contando só a partir do início do plano) */
	private static Integer adherence(ActionPlan plan, LocalDate today) {
		List<ChecklistItem> daily = plan.getChecklist().stream()
				.filter(i -> i.isActive() && i.getFrequency() == Frequency.DAILY).toList();
		LocalDate from = max(plan.getStartDate(), today.minusDays(CHECK_WINDOW_DAYS - 1));
		if (daily.isEmpty() || from.isAfter(today)) {
			return null;
		}
		long days = from.datesUntil(today.plusDays(1)).count();
		long done = daily.stream().mapToLong(i -> from.datesUntil(today.plusDays(1)).filter(d -> i.doneOn(d)).count()).sum();
		return (int) Math.round(100.0 * done / (days * daily.size()));
	}

	private PlanSummary summary(ActionPlan plan, LocalDate today) {
		List<ChecklistItem> active = plan.getChecklist().stream().filter(i -> i.isActive()).toList();
		User patient = plan.getPatient().getUser();
		Professional professional = plan.getProfessional();
		return new PlanSummary(
				plan.getId(),
				plan.getTitle(),
				plan.getStatus(),
				plan.getStartDate(),
				plan.getEndDate(),
				new Person(plan.getPatient().getId(), patient.getName(), patient.getPhotoUrl()),
				new ProfessionalSummary(professional.getId(), professional.getUser().getName(),
						professional.getUser().getPhotoUrl(), professional.getType()),
				(int) plan.getGoals().stream().filter(g -> g.getCompletedAt() != null).count(),
				plan.getGoals().size(),
				(int) active.stream().filter(i -> doneNow(i, today)).count(),
				active.size(),
				adherence(plan, today),
				plan.getUpdatedAt() == null ? null : plan.getUpdatedAt().toInstant(ZoneOffset.UTC));
	}

	private PlanDetail detail(ActionPlan plan, Long viewerId) {
		LocalDate today = today();
		List<LocalDate> window = today.minusDays(CHECK_WINDOW_DAYS - 1).datesUntil(today.plusDays(1)).toList();
		boolean viewerIsPatient = plan.isPatient(viewerId);
		return new PlanDetail(
				summary(plan, today),
				plan.getDescription(),
				today,
				plan.getGoals().stream()
						.map(g -> new GoalView(g.getId(), g.getDescription(), g.getTargetValue(), g.getUnit(),
								g.getDueDate(), g.getCompletedAt() != null, utc(g.getCompletedAt())))
						.toList(),
				plan.getMeals().stream()
						.sorted(Comparator.comparing((MealRoutine m) -> m.getMealType().ordinal())
								.thenComparing(m -> Objects.requireNonNullElse(m.getDayOfWeek(), -1)))
						.map(m -> new MealView(m.getId(), m.getMealType(), m.getMealType().label(), m.getMealTime(),
								m.getDayOfWeek(), m.getDescription()))
						.toList(),
				plan.getChecklist().stream().filter(i -> i.isActive())
						.map(i -> new ChecklistView(i.getId(), i.getDescription(), i.getFrequency(), doneNow(i, today),
								window.stream().map(d -> new DayMark(d, i.doneOn(d))).toList()))
						.toList(),
				plan.getProgress().stream()
						.sorted(Comparator.comparing((ProgressRecord p) -> p.getRecordDate()).reversed()
								.thenComparing(p -> p.getId(), Comparator.nullsFirst(Comparator.reverseOrder())))
						.map(p -> new ProgressView(p.getId(), p.getRecordDate(), p.getWeightKg(), p.getMoodScore(),
								p.getNotes(), p.getRecordedBy().getName()))
						.toList(),
				!viewerIsPatient,
				viewerIsPatient && plan.getStatus() == PlanStatus.ACTIVE);
	}

	private static Instant utc(LocalDateTime value) {
		return value == null ? null : value.toInstant(ZoneOffset.UTC);
	}
}
