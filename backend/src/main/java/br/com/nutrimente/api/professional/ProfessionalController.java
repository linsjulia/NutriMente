package br.com.nutrimente.api.professional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.NullHandling;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.appointment.ScheduleService.DayPeriod;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.professional.ProfessionalSearchService.AvailableDay;
import br.com.nutrimente.api.professional.ProfessionalSearchService.DurationRange;
import br.com.nutrimente.api.specialty.SpecialtyDto;
import br.com.nutrimente.api.user.Audience;
import br.com.nutrimente.api.user.Gender;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.ProfessionalType;

/**
 * Lista PÚBLICA de profissionais aprovados (não exige login).
 * Só dados profissionais: nada de CPF, e-mail ou telefone.
 *
 * <pre>
 * GET /api/professionals?type=PSICOLOGO&page=0&size=12
 * GET /api/professionals?specialty=3          só quem marcou a especialidade 3
 * GET /api/professionals?online=true         só quem atende online
 * GET /api/professionals?minPrice=100&maxPrice=200&sort=PRICE_ASC
 *     faixa de preço (em reais) e ordenação: RELEVANCE (padrão: melhor
 *     avaliados primeiro), PRICE_ASC, PRICE_DESC ou NAME
 * Filtros da página de busca (listas aceitam "a,b" ou o parâmetro repetido):
 *   specialties=3,8        quem tem pelo menos um dos temas (ids)
 *   duration=UP_TO_30,UP_TO_60,OVER_60   faixas de duração da consulta
 *   audience=CRIANCA,ADOLESCENTE,ADULTO,IDOSO
 *   gender=FEMALE,MALE
 *   available=TODAY,TOMORROW            tem horário livre nesse dia
 *   period=MORNING,AFTERNOON,EVENING    num desses períodos (sem dia: próximas 2 semanas)
 * GET /api/professionals/{id}
 * </pre>
 */
@RestController
@RequestMapping("/api/professionals")
public class ProfessionalController {

	private static final int MAX_PAGE_SIZE = 50;

	private final ProfessionalRepository professionals;
	private final ProfessionalSearchService search;

	public ProfessionalController(ProfessionalRepository professionals, ProfessionalSearchService search) {
		this.professionals = professionals;
		this.search = search;
	}

	@GetMapping
	@Transactional(readOnly = true)
	public PageResponse<PublicProfessional> list(
			@RequestParam(required = false) ProfessionalType type,
			@RequestParam(required = false) Integer specialty,
			@RequestParam(required = false) List<Integer> specialties,
			@RequestParam(required = false) BigDecimal minPrice,
			@RequestParam(required = false) BigDecimal maxPrice,
			@RequestParam(defaultValue = "false") boolean online,
			@RequestParam(required = false) List<DurationRange> duration,
			@RequestParam(required = false) List<Audience> audience,
			@RequestParam(required = false) List<Gender> gender,
			@RequestParam(required = false) List<AvailableDay> available,
			@RequestParam(required = false) List<DayPeriod> period,
			@RequestParam(defaultValue = "RELEVANCE") SortOption sort,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "12") int size) {
		validatePriceRange(minPrice, maxPrice);
		// Limites: ninguém pede a página -1 ou 10 mil itens de uma vez
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE), sort.toSort());
		Set<Integer> specialtyIds = new HashSet<>(orEmpty(specialties));
		if (specialty != null) {
			specialtyIds.add(specialty);
		}
		var filters = new ProfessionalSearchService.Filters(type, specialtyIds, minPrice, maxPrice, online,
				Set.copyOf(orEmpty(audience)), Set.copyOf(orEmpty(gender)), Set.copyOf(orEmpty(duration)),
				Set.copyOf(orEmpty(available)), Set.copyOf(orEmpty(period)));
		return PageResponse.of(search.search(filters, pageable).map(PublicProfessional::of));
	}

	private static <T> List<T> orEmpty(List<T> list) {
		return list == null ? List.of() : list.stream().filter(java.util.Objects::nonNull).toList();
	}

	private static void validatePriceRange(BigDecimal minPrice, BigDecimal maxPrice) {
		if ((minPrice != null && minPrice.signum() < 0) || (maxPrice != null && maxPrice.signum() < 0)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "O valor não pode ser negativo.",
					Map.of("minPrice", "O valor não pode ser negativo"));
		}
		if (minPrice != null && maxPrice != null && minPrice.compareTo(maxPrice) > 0) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
					"O valor mínimo é maior que o máximo.",
					Map.of("minPrice", "O valor mínimo precisa ser menor ou igual ao máximo"));
		}
	}

	/**
	 * Ordenações da busca. Quem deixou "valor a combinar" (preço vazio) vai
	 * para o FIM nas ordenações por preço (NullHandling.NULLS_LAST).
	 * O nome entra sempre como desempate, para a ordem ser estável entre páginas.
	 */
	public enum SortOption {
		RELEVANCE, PRICE_ASC, PRICE_DESC, NAME;

		Sort toSort() {
			Sort.Order byName = Sort.Order.asc("user.name");
			return switch (this) {
				case RELEVANCE -> Sort.by(Sort.Order.desc("ratingAverage"), byName);
				case PRICE_ASC -> Sort.by(Sort.Order.asc("consultationPrice").with(NullHandling.NULLS_LAST), byName);
				case PRICE_DESC -> Sort.by(Sort.Order.desc("consultationPrice").with(NullHandling.NULLS_LAST), byName);
				case NAME -> Sort.by(byName);
			};
		}
	}

	@GetMapping("/{id}")
	@Transactional(readOnly = true)
	public PublicProfessional get(@PathVariable Long id) {
		return professionals.findPublicById(id).map(PublicProfessional::of)
				.orElseThrow(() -> ApiException.notFound("Profissional não encontrado."));
	}

	public record PublicProfessional(Long id, String name, String photoUrl, ProfessionalType type, String document,
			String bio,
			BigDecimal consultationPrice, BigDecimal ratingAverage, int ratingCount, List<SpecialtyDto> specialties,
			/** Atende por videochamada (declarou e-Psi / e-Nutricionista) */
			boolean offersOnline,
			/** Atende presencialmente (informou o consultório). O endereço completo só aparece na consulta */
			boolean offersInPerson,
			String officeCity,
			String officeState,
			/** Duração de cada consulta, em minutos */
			int consultationMinutes,
			/** Público atendido (criança, adolescente, adulto, idoso) */
			List<Audience> audiences) {

		static PublicProfessional of(Professional p) {
			return new PublicProfessional(p.getId(), p.getUser().getName(), p.getUser().getPhotoUrl(), p.getType(),
					p.getDocument(), p.getBio(),
					p.getConsultationPrice(), p.getRatingAverage(), p.getRatingCount(),
					p.getSpecialties().stream().map(SpecialtyDto::of).toList(), p.offersOnline(), p.offersInPerson(),
					p.getOfficeCity(), p.getOfficeState(), p.getConsultationMinutes(),
					p.getAudiences().stream().sorted().toList());
		}
	}

	/** Formato de página estável (não expõe a classe Page do Spring no JSON) */
	public record PageResponse<T>(List<T> items, int page, int size, long totalItems, int totalPages) {

		public static <T> PageResponse<T> of(Page<T> page) {
			return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
					page.getTotalPages());
		}
	}
}
