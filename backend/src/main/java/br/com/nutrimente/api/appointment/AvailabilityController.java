package br.com.nutrimente.api.appointment;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.appointment.AppointmentDtos.AvailabilityRequest;
import br.com.nutrimente.api.appointment.AppointmentDtos.AvailabilityWindow;
import br.com.nutrimente.api.config.CurrentUser;
import jakarta.validation.Valid;

/**
 * Horários de atendimento do PRÓPRIO profissional (só PROFESSIONAL).
 *
 * <pre>
 * GET /api/me/availability   janelas atuais
 * PUT /api/me/availability   { "windows": [ { "dayOfWeek": 1, "startTime": "08:00", "endTime": "12:00" } ] }
 * </pre>
 */
@RestController
@RequestMapping("/api/me/availability")
@PreAuthorize("hasRole('PROFESSIONAL')")
public class AvailabilityController {

	private final ScheduleService schedule;

	public AvailabilityController(ScheduleService schedule) {
		this.schedule = schedule;
	}

	@GetMapping
	public List<AvailabilityWindow> get(@AuthenticationPrincipal Jwt jwt) {
		return schedule.windowsOf(CurrentUser.id(jwt));
	}

	@PutMapping
	public List<AvailabilityWindow> replace(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody AvailabilityRequest request) {
		return schedule.replaceWindows(CurrentUser.id(jwt), request.windows());
	}
}
