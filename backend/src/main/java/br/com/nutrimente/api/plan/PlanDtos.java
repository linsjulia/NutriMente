package br.com.nutrimente.api.plan;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import br.com.nutrimente.api.appointment.AppointmentDtos.Person;
import br.com.nutrimente.api.appointment.AppointmentDtos.ProfessionalSummary;
import br.com.nutrimente.api.plan.PlanEnums.Frequency;
import br.com.nutrimente.api.plan.PlanEnums.MealType;
import br.com.nutrimente.api.plan.PlanEnums.PlanStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** JSON de entrada e saída do plano de ação. */
public final class PlanDtos {

	private PlanDtos() {
	}

	// ---------------- Entrada (profissional monta o plano) ----------------

	/**
	 * Plano inteiro num envio só (um formulário na tela). Na edição (PUT), as
	 * listas substituem as atuais: metas e itens do checklist com "id" são
	 * atualizados, sem "id" são criados, e os que sumiram da lista saem do
	 * plano (itens do checklist são só desativados, para não perder o histórico).
	 */
	public record PlanRequest(
			/** Só na criação: para quem é o plano */
			Long patientId,

			@NotBlank(message = "Dê um título ao plano")
			@Size(min = 3, max = 150, message = "O título precisa ter de 3 a 150 caracteres")
			String title,

			@Size(max = 2000, message = "A descrição pode ter até 2000 caracteres")
			String description,

			@NotNull(message = "Informe a data de início") LocalDate startDate,

			LocalDate endDate,

			@Size(max = 20, message = "Use no máximo 20 metas") List<@Valid GoalInput> goals,

			@Size(max = 50, message = "Use no máximo 50 refeições") List<@Valid MealInput> meals,

			@Size(max = 30, message = "Use no máximo 30 itens no checklist") List<@Valid ChecklistInput> checklist) {
	}

	public record GoalInput(
			Long id,
			@NotBlank(message = "Descreva a meta") @Size(max = 500, message = "A meta pode ter até 500 caracteres")
			String description,
			@DecimalMin(value = "0", message = "O valor não pode ser negativo") BigDecimal targetValue,
			@Size(max = 20, message = "A unidade pode ter até 20 caracteres") String unit,
			LocalDate dueDate) {
	}

	public record MealInput(
			@NotNull(message = "Escolha a refeição") MealType mealType,
			LocalTime mealTime,
			@Min(value = 0, message = "Dia inválido") @Max(value = 6, message = "Dia inválido") Integer dayOfWeek,
			@NotBlank(message = "Descreva a refeição")
			@Size(max = 1000, message = "A descrição pode ter até 1000 caracteres")
			String description) {
	}

	public record ChecklistInput(
			Long id,
			@NotBlank(message = "Descreva o item") @Size(max = 300, message = "O item pode ter até 300 caracteres")
			String description,
			/** DAILY (padrão), WEEKLY ou ONCE */
			Frequency frequency) {
	}

	public record StatusRequest(@NotNull(message = "Escolha a situação") PlanStatus status) {
	}

	/** Marcar/desmarcar: { "completed": true } */
	public record CompletedRequest(@NotNull(message = "Informe completed (true ou false)") Boolean completed) {
	}

	public record ProgressRequest(
			/** Padrão: hoje */
			LocalDate recordDate,
			@DecimalMin(value = "1", message = "Peso inválido") @DecimalMax(value = "500", message = "Peso inválido")
			BigDecimal weightKg,
			@Min(value = 1, message = "Escolha de 1 a 5") @Max(value = 5, message = "Escolha de 1 a 5") Integer moodScore,
			@Size(max = 2000, message = "As observações podem ter até 2000 caracteres") String notes) {
	}

	// ---------------- Saída ----------------

	/**
	 * Resumo para listas e painéis.
	 * - checklistDoneToday / checklistTotalToday: itens do checklist feitos
	 *   "hoje" (diários: hoje; semanais: nesta semana; únicos: alguma vez)
	 * - adherence7d: % dos itens DIÁRIOS cumpridos nos últimos 7 dias
	 *   (null se o plano não tem itens diários)
	 */
	public record PlanSummary(
			Long id,
			String title,
			PlanStatus status,
			LocalDate startDate,
			LocalDate endDate,
			Person patient,
			ProfessionalSummary professional,
			int goalsCompleted,
			int goalsTotal,
			int checklistDoneToday,
			int checklistTotalToday,
			Integer adherence7d,
			Instant updatedAt) {
	}

	public record GoalView(Long id, String description, BigDecimal targetValue, String unit, LocalDate dueDate,
			boolean completed, Instant completedAt) {
	}

	/** mealLabel já vem em português ("Café da manhã"); dayOfWeek null = todos os dias */
	public record MealView(Long id, MealType mealType, String mealLabel, LocalTime mealTime, Integer dayOfWeek,
			String description) {
	}

	public record DayMark(LocalDate date, boolean completed) {
	}

	/** history: os últimos 7 dias, do mais antigo até hoje (para desenhar os quadradinhos) */
	public record ChecklistView(Long id, String description, Frequency frequency, boolean doneToday,
			List<DayMark> history) {
	}

	public record ProgressView(Long id, LocalDate recordDate, BigDecimal weightKg, Integer moodScore, String notes,
			String recordedBy) {
	}

	/**
	 * Plano completo. canEdit: o profissional dono pode editar. canCheck: o
	 * paciente pode marcar o checklist (plano ACTIVE).
	 */
	public record PlanDetail(
			PlanSummary summary,
			String description,
			LocalDate today,
			List<GoalView> goals,
			List<MealView> meals,
			List<ChecklistView> checklist,
			List<ProgressView> progress,
			boolean canEdit,
			boolean canCheck) {
	}

	/** Paciente que o profissional atende (para escolher ao criar um plano) */
	public record MyPatient(Long id, String name, String photoUrl, Instant lastAppointmentAt) {
	}
}
