package br.com.nutrimente.api.professional;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.specialty.SpecialtyDto;
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
 * GET /api/professionals/{id}
 * </pre>
 */
@RestController
@RequestMapping("/api/professionals")
public class ProfessionalController {

	private static final int MAX_PAGE_SIZE = 50;

	private final ProfessionalRepository professionals;

	public ProfessionalController(ProfessionalRepository professionals) {
		this.professionals = professionals;
	}

	@GetMapping
	@Transactional(readOnly = true)
	public PageResponse<PublicProfessional> list(
			@RequestParam(required = false) ProfessionalType type,
			@RequestParam(required = false) Integer specialty,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "12") int size) {
		// Limites: ninguém pede a página -1 ou 10 mil itens de uma vez
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE),
				Sort.by(Sort.Order.desc("ratingAverage"), Sort.Order.asc("user.name")));
		return PageResponse.of(professionals.findPublic(type, specialty, pageable).map(PublicProfessional::of));
	}

	@GetMapping("/{id}")
	@Transactional(readOnly = true)
	public PublicProfessional get(@PathVariable Long id) {
		return professionals.findPublicById(id).map(PublicProfessional::of)
				.orElseThrow(() -> ApiException.notFound("Profissional não encontrado."));
	}

	public record PublicProfessional(Long id, String name, ProfessionalType type, String document, String bio,
			BigDecimal consultationPrice, BigDecimal ratingAverage, int ratingCount, List<SpecialtyDto> specialties) {

		static PublicProfessional of(Professional p) {
			return new PublicProfessional(p.getId(), p.getUser().getName(), p.getType(), p.getDocument(), p.getBio(),
					p.getConsultationPrice(), p.getRatingAverage(), p.getRatingCount(),
					p.getSpecialties().stream().map(SpecialtyDto::of).toList());
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
