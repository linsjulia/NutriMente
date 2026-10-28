package br.com.nutrimente.api.professional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
	private final List<SearchResultFilter> postFilters;

	public ProfessionalSearchService(ProfessionalRepository professionals, List<SearchResultFilter> postFilters) {
		this.professionals = professionals;
		this.postFilters = postFilters;
	}

	/**
	 * Strategy Pattern: filtros pós-consulta são aplicados por implementações
	 * de {@link SearchResultFilter}, injetadas automaticamente pelo Spring.
	 * Para adicionar um novo filtro, crie um {@code @Component} que implemente
	 * a interface — o serviço de busca não precisa mudar.
	 */
	@Transactional(readOnly = true)
	public Page<Professional> search(Filters f, Pageable pageable) {
		boolean hasPostFilters = postFilters.stream().anyMatch(pf -> pf.supports(f));
		Page<Professional> found = query(f, hasPostFilters ? Pageable.unpaged(pageable.getSort()) : pageable);
		if (!hasPostFilters) {
			return found;
		}
		List<Professional> filtered = found.getContent();
		for (SearchResultFilter pf : postFilters) {
			if (pf.supports(f)) {
				filtered = pf.apply(filtered, f);
			}
		}
		int start = (int) Math.min((long) pageable.getPageNumber() * pageable.getPageSize(), filtered.size());
		int end = Math.min(start + pageable.getPageSize(), filtered.size());
		return new PageImpl<>(filtered.subList(start, end), PageRequest.of(pageable.getPageNumber(),
				pageable.getPageSize(), pageable.getSort()), filtered.size());
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
