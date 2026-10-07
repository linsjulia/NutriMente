package br.com.nutrimente.api.appointment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import br.com.nutrimente.api.user.ProfessionalType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * JSON de entrada e saída da agenda.
 *
 * Datas e horas de consultas usam Instant: no JSON viram texto ISO com "Z"
 * (UTC), ex.: "2026-10-20T12:00:00Z". O JavaScript entende direto:
 * new Date("2026-10-20T12:00:00Z") já mostra no fuso de quem está vendo.
 */
public final class AppointmentDtos {

	private AppointmentDtos() {
	}

	// ---------------- Horários de atendimento (profissional) ----------------

	/** Uma janela: { "dayOfWeek": 1, "startTime": "08:00", "endTime": "12:00" } (1 = segunda) */
	public record AvailabilityWindow(
			@NotNull(message = "Informe o dia da semana")
			@Min(value = 0, message = "Dia inválido (0 = domingo ... 6 = sábado)")
			@Max(value = 6, message = "Dia inválido (0 = domingo ... 6 = sábado)")
			Integer dayOfWeek,

			@NotNull(message = "Informe o horário de início") LocalTime startTime,

			@NotNull(message = "Informe o horário de término") LocalTime endTime) {

		static AvailabilityWindow of(Availability a) {
			return new AvailabilityWindow(a.getDayOfWeek(), a.getStartTime(), a.getEndTime());
		}
	}

	/** Substitui a agenda semanal inteira. Lista vazia = sem horários (some da agenda) */
	public record AvailabilityRequest(
			@NotNull(message = "Informe as janelas de atendimento")
			@Size(max = 40, message = "Use no máximo 40 janelas")
			List<@Valid AvailabilityWindow> windows) {
	}

	// ---------------- Horários livres (público) ----------------

	/** Um horário que dá para agendar. "time" é o horário local, pronto para mostrar ("09:00") */
	public record Slot(Instant startsAt, Instant endsAt, String time) {
	}

	/** Horários livres de um dia. "weekday" já vem em português ("segunda-feira") */
	public record SlotDay(LocalDate date, String weekday, List<Slot> slots) {
	}

	// ---------------- Consultas ----------------

	public record BookRequest(
			@NotNull(message = "Escolha o profissional") Long professionalId,

			@NotNull(message = "Escolha um horário") Instant startsAt,

			/** ONLINE (padrão, com link de videochamada) ou PRESENCIAL */
			Modality modality,

			@Size(max = 1000, message = "A observação pode ter até 1000 caracteres") String notes) {
	}

	public record CancelRequest(
			@Size(max = 500, message = "O motivo pode ter até 500 caracteres") String reason) {
	}

	public record RescheduleRequest(@NotNull(message = "Escolha o novo horário") Instant startsAt) {
	}

	public record Person(Long id, String name) {
	}

	public record ProfessionalSummary(Long id, String name, ProfessionalType type) {
	}

	/**
	 * Uma consulta como aparece para quem está logado.
	 * canCancel / canReschedule / canConfirm / canComplete: o que ESTA pessoa
	 * pode fazer agora (a tela só mostra os botões que valem; a API confere de novo).
	 */
	public record AppointmentResponse(
			Long id,
			Instant startsAt,
			Instant endsAt,
			AppointmentStatus status,
			Modality modality,
			String videoUrl,
			BigDecimal price,
			String notes,
			String cancellationReason,
			Long rescheduledFromId,
			Person patient,
			ProfessionalSummary professional,
			boolean canCancel,
			boolean canReschedule,
			boolean canConfirm,
			boolean canComplete) {
	}
}
