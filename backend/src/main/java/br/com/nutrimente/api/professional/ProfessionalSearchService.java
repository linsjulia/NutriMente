package br.com.nutrimente.api.professional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.appointment.ScheduleService;
import br.com.nutrimente.api.appointment.ScheduleService.DayPeriod;
import br.com.nutrimente.api.user.Audience;
import br.com.nutrimente.api.user.Gender;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.ProfessionalType;

/**
 * Busca pública de profissionais com os filtros da página de busca.
 *
 * Quase tudo é filtrado no banco. A disponibilidade (hoje, amanhã, manhã,
 * tarde, noite) depende da agenda e das consultas já marcadas, então é
 * calculada com o ScheduleService para cada candidato, e a página é montada
 * depois. Funciona bem para o tamanho do projeto (dezenas de profissionais);
 * com milhares, seria preciso guardar os próximos horários livres numa tabela.
 */
@Service
public class ProfessionalSearchService {

	/** Faixas de duração da consulta (podem ser combinadas) */
	public enum DurationRange {
		UP_TO_30, UP_TO_60, OVER_60
	}

	/** Dia com horário livre */
	public enum AvailableDay {
		TODAY, TOMORROW
	}

	/** Sem dia escolhido, o filtro de período olha as próximas duas semanas */
	static final int PERIOD_ONLY_DAYS = 14;

	public record Filters(ProfessionalType type, Set<Integer> specialtyIds, BigDecimal minPrice, BigDecimal maxPrice,
			boolean online, Set<Audience> audiences, Set<Gender> genders, Set<DurationRange> durations,
			Set<AvailableDay> days, Set<DayPeriod> periods) {
	}

	private final ProfessionalRepository professionals;
	private final ScheduleService schedule;

	public ProfessionalSearchService(ProfessionalRepository professionals, ScheduleService schedule) {
		this.professionals = professionals;
		this.schedule = schedule;
	}

	@Transactional(readOnly = true)
	public Page<Professional> search(Filters f, Pageable pageable) {
		boolean byAvailability = !f.days().isEmpty() || !f.periods().isEmpty();
		Page<Professional> found = query(f, byAvailability ? Pageable.unpaged(pageable.getSort()) : pageable);
		if (!byAvailability) {
			return found;
		}
		LocalDate today = LocalDate.now(schedule.zone());
		LocalDate from = f.days().contains(AvailableDay.TODAY) || f.days().isEmpty() ? today : today.plusDays(1);
		int span = f.days().isEmpty() ? PERIOD_ONLY_DAYS
				: f.days().containsAll(EnumSet.allOf(AvailableDay.class)) ? 2 : 1;
		List<Professional> available = found.getContent().stream()
				.filter(p -> schedule.hasFreeSlot(p, from, span, f.periods()))
				.toList();
		int start = (int) Math.min((long) pageable.getPageNumber() * pageable.getPageSize(), available.size());
		int end = Math.min(start + pageable.getPageSize(), available.size());
		return new PageImpl<>(available.subList(start, end), PageRequest.of(pageable.getPageNumber(),
				pageable.getPageSize(), pageable.getSort()), available.size());
	}

	private Page<Professional> query(Filters f, Pageable pageable) {
		// IN com lista vazia não é válido: quando o filtro está desligado, vai um valor qualquer
		return professionals.findPublic(f.type(),
				!f.specialtyIds().isEmpty(), f.specialtyIds().isEmpty() ? Set.of(-1) : f.specialtyIds(),
				f.minPrice(), f.maxPrice(), f.online(),
				!f.audiences().isEmpty(), f.audiences().isEmpty() ? Set.of(Audience.ADULTO) : f.audiences(),
				!f.genders().isEmpty(), f.genders().isEmpty() ? Set.of(Gender.FEMALE) : f.genders(),
				!f.durations().isEmpty(), f.durations().contains(DurationRange.UP_TO_30),
				f.durations().contains(DurationRange.UP_TO_60), f.durations().contains(DurationRange.OVER_60),
				pageable);
	}
}
