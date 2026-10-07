package br.com.nutrimente.api.appointment;

import java.time.LocalDate;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.appointment.AppointmentDtos.SlotDay;

/**
 * Horários livres de um profissional (PÚBLICO: dá para ver antes de entrar).
 *
 * <pre>
 * GET /api/professionals/{id}/slots                    próximos 7 dias
 * GET /api/professionals/{id}/slots?from=2026-10-20&days=14
 * </pre>
 *
 * Dias sem nenhum horário livre não aparecem na lista.
 */
@RestController
public class SlotController {

	private static final int MAX_DAYS = 31;

	private final ScheduleService schedule;

	public SlotController(ScheduleService schedule) {
		this.schedule = schedule;
	}

	@GetMapping("/api/professionals/{id}/slots")
	public List<SlotDay> slots(@PathVariable Long id,
			@RequestParam(required = false) LocalDate from,
			@RequestParam(defaultValue = "7") int days) {
		return schedule.freeSlots(id, from, Math.clamp(days, 1, MAX_DAYS));
	}
}
