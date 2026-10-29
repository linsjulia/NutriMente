package br.com.nutrimente.api.professional;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;

import org.springframework.stereotype.Component;

import br.com.nutrimente.api.appointment.ScheduleService;
import br.com.nutrimente.api.professional.ProfessionalSearchService.AvailableDay;
import br.com.nutrimente.api.professional.ProfessionalSearchService.Filters;
import br.com.nutrimente.api.user.Professional;

/**
 * Strategy: filtra profissionais pela disponibilidade na agenda.
 *
 * Depende da agenda e das consultas já marcadas, então não é possível
 * filtrar direto no banco — este filtro roda sobre os candidatos já
 * selecionados pela query JPQL.
 */
@Component
public class AvailabilitySearchFilter implements SearchResultFilter {

	private final ScheduleService schedule;

	public AvailabilitySearchFilter(ScheduleService schedule) {
		this.schedule = schedule;
	}

	@Override
	public boolean supports(Filters filters) {
		return !filters.days().isEmpty() || !filters.periods().isEmpty();
	}

	@Override
	public List<Professional> apply(List<Professional> candidates, Filters filters) {
		LocalDate today = LocalDate.now(schedule.zone());
		LocalDate from = filters.days().contains(AvailableDay.TODAY) || filters.days().isEmpty()
				? today : today.plusDays(1);
		int span = filters.days().isEmpty() ? ProfessionalSearchService.PERIOD_ONLY_DAYS
				: filters.days().containsAll(EnumSet.allOf(AvailableDay.class)) ? 2 : 1;
		return candidates.stream()
				.filter(p -> schedule.hasFreeSlot(p, from, span, filters.periods()))
				.toList();
	}
}
