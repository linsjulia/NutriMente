package br.com.nutrimente.api.appointment;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.appointment.AppointmentDtos.AvailabilityWindow;
import br.com.nutrimente.api.appointment.AppointmentDtos.Slot;
import br.com.nutrimente.api.appointment.AppointmentDtos.SlotDay;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.config.AppProperties;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;

/**
 * Agenda do profissional: janelas semanais de atendimento e o cálculo dos
 * horários LIVRES que o paciente pode escolher.
 *
 * Como um horário livre é calculado:
 * 1. Para cada dia do período, pega as janelas daquele dia da semana
 *    (ex.: segunda 08:00-12:00).
 * 2. Dentro de cada janela, gera um horário a cada "slotInterval" (1 h), desde
 *    que a consulta inteira ("duration", 50 min) caiba antes do fim da janela:
 *    08:00, 09:00, 10:00 e 11:00 (11:00 + 50 min = 11:50, cabe).
 * 3. Tira os que já passaram ou estão perto demais ("minNotice", 2 h).
 * 4. Tira os que batem com uma consulta já marcada.
 */
@Service
public class ScheduleService {

	static final Locale PT_BR = Locale.of("pt", "BR");
	private static final DateTimeFormatter HOUR = DateTimeFormatter.ofPattern("HH:mm");

	private final AvailabilityRepository availability;
	private final AppointmentRepository appointments;
	private final ProfessionalRepository professionals;
	private final AppProperties.Appointments rules;

	public ScheduleService(AvailabilityRepository availability, AppointmentRepository appointments,
			ProfessionalRepository professionals, AppProperties properties) {
		this.availability = availability;
		this.appointments = appointments;
		this.professionals = professionals;
		this.rules = properties.appointments();
	}

	ZoneId zone() {
		return ZoneId.of(rules.timezone());
	}

	// ---------------- Janelas de atendimento ----------------

	@Transactional(readOnly = true)
	public List<AvailabilityWindow> windowsOf(Long professionalId) {
		return availability.findByProfessionalIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(professionalId).stream()
				.map(AvailabilityWindow::of).toList();
	}

	/** Troca a agenda semanal inteira de uma vez (mais simples para a tela do que editar janela por janela) */
	@Transactional
	public List<AvailabilityWindow> replaceWindows(Long professionalId, List<AvailabilityWindow> windows) {
		validate(windows);
		availability.deleteAllOf(professionalId);
		availability.saveAll(windows.stream()
				.map(w -> new Availability(professionalId, w.dayOfWeek(), w.startTime(), w.endTime()))
				.toList());
		return windowsOf(professionalId);
	}

	private void validate(List<AvailabilityWindow> windows) {
		for (AvailabilityWindow w : windows) {
			if (!w.endTime().isAfter(w.startTime())) {
				throw invalidWindows("O horário de término precisa ser depois do início (%s, %s às %s)."
						.formatted(weekday(w.dayOfWeek()), w.startTime().format(HOUR), w.endTime().format(HOUR)));
			}
			if (Duration.between(w.startTime(), w.endTime()).compareTo(rules.duration()) < 0) {
				throw invalidWindows("A janela precisa ter pelo menos %d minutos, a duração de uma consulta (%s, %s às %s)."
						.formatted(rules.duration().toMinutes(), weekday(w.dayOfWeek()), w.startTime().format(HOUR),
								w.endTime().format(HOUR)));
			}
		}
		// Duas janelas no mesmo dia não podem se sobrepor (08-12 e 11-14, por exemplo)
		Map<Integer, List<AvailabilityWindow>> byDay = windows.stream()
				.collect(Collectors.groupingBy(w -> w.dayOfWeek()));
		byDay.forEach((day, list) -> {
			List<AvailabilityWindow> sorted = list.stream().sorted(Comparator.comparing(w -> w.startTime()))
					.toList();
			for (int i = 1; i < sorted.size(); i++) {
				if (sorted.get(i).startTime().isBefore(sorted.get(i - 1).endTime())) {
					throw invalidWindows("Há horários sobrepostos na %s.".formatted(weekday(day)));
				}
			}
		});
	}

	private static ApiException invalidWindows(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, Map.of("windows", message));
	}

	// ---------------- Horários livres ----------------

	/**
	 * Horários livres de um profissional APROVADO, a partir de "from", por "days" dias.
	 * Profissional sem valor de consulta definido ainda não aceita agendamento:
	 * devolve lista vazia (o agendamento também é recusado).
	 */
	@Transactional(readOnly = true)
	public List<SlotDay> freeSlots(Long professionalId, LocalDate from, int days) {
		Professional professional = professionals.findPublicById(professionalId)
				.orElseThrow(() -> ApiException.notFound("Profissional não encontrado."));
		if (professional.getConsultationPrice() == null) {
			return List.of();
		}
		return compute(professionalId, from, days);
	}

	/** O horário escolhido é um dos livres? (usado ao agendar e remarcar) */
	@Transactional(readOnly = true)
	public boolean isFree(Long professionalId, Instant startsAt) {
		LocalDate day = startsAt.atZone(zone()).toLocalDate();
		return compute(professionalId, day, 1).stream()
				.flatMap(d -> d.slots().stream())
				.anyMatch(slot -> slot.startsAt().equals(startsAt));
	}

	private List<SlotDay> compute(Long professionalId, LocalDate from, int days) {
		ZoneId zone = zone();
		LocalDate today = LocalDate.now(zone);
		LocalDate first = from == null || from.isBefore(today) ? today : from;
		LocalDate lastAllowed = today.plusDays(rules.bookingWindowDays());
		LocalDate end = first.plusDays(days);
		if (end.isAfter(lastAllowed)) {
			end = lastAllowed.plusDays(1);
		}
		if (!first.isBefore(end)) {
			return List.of();
		}

		Map<Integer, List<Availability>> windowsByDay = availability
				.findByProfessionalIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(professionalId).stream()
				.collect(Collectors.groupingBy(a -> a.getDayOfWeek()));
		if (windowsByDay.isEmpty()) {
			return List.of();
		}

		List<Appointment> busy = appointments.findOccupying(professionalId, toUtc(first.atStartOfDay(zone).toInstant()),
				toUtc(end.atStartOfDay(zone).toInstant()), AppointmentStatus.OCCUPYING);
		Instant earliest = Instant.now().plus(rules.minNotice());

		List<SlotDay> result = new ArrayList<>();
		for (LocalDate date = first; date.isBefore(end); date = date.plusDays(1)) {
			// Java: segunda = 1 ... domingo = 7. Banco: domingo = 0 ... sábado = 6
			int dayOfWeek = date.getDayOfWeek().getValue() % 7;
			List<Slot> slots = new ArrayList<>();
			for (Availability window : windowsByDay.getOrDefault(dayOfWeek, List.of())) {
				for (LocalTime time = window.getStartTime();
						!time.plus(rules.duration()).isAfter(window.getEndTime());
						time = time.plus(rules.slotInterval())) {
					Instant startsAt = date.atTime(time).atZone(zone).toInstant();
					Instant endsAt = startsAt.plus(rules.duration());
					if (!startsAt.isBefore(earliest) && busy.stream().noneMatch(a -> overlaps(a, startsAt, endsAt))) {
						slots.add(new Slot(startsAt, endsAt, time.format(HOUR)));
					}
					// Evita laço infinito se a janela for até perto da meia-noite (o LocalTime "dá a volta")
					if (time.plus(rules.slotInterval()).isBefore(time)) {
						break;
					}
				}
			}
			if (!slots.isEmpty()) {
				slots.sort(Comparator.comparing(s -> s.startsAt()));
				result.add(new SlotDay(date, weekdayOf(date), slots));
			}
		}
		return result;
	}

	private static boolean overlaps(Appointment a, Instant startsAt, Instant endsAt) {
		return toInstant(a.getStartsAt()).isBefore(endsAt) && toInstant(a.getEndsAt()).isAfter(startsAt);
	}

	// ---------------- Conversões ----------------

	/** O banco guarda LocalDateTime em UTC; a API fala Instant (com "Z") */
	static LocalDateTime toUtc(Instant instant) {
		return LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
	}

	static Instant toInstant(LocalDateTime utc) {
		return utc.toInstant(ZoneOffset.UTC);
	}

	private static String weekdayOf(LocalDate date) {
		return date.getDayOfWeek().getDisplayName(TextStyle.FULL, PT_BR);
	}

	/** 0 = domingo ... 6 = sábado -> "domingo" ... "sábado" */
	private static String weekday(int dayOfWeek) {
		return java.time.DayOfWeek.of(dayOfWeek == 0 ? 7 : dayOfWeek).getDisplayName(TextStyle.FULL, PT_BR);
	}
}
