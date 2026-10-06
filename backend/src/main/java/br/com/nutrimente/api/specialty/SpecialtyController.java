package br.com.nutrimente.api.specialty;

import java.util.List;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.user.ProfessionalType;

/**
 * Lista PÚBLICA de especialidades (não exige login): usada no filtro da
 * busca e no formulário do perfil profissional.
 *
 * <pre>
 * GET /api/specialties                      todas
 * GET /api/specialties?type=PSICOLOGO       só de uma profissão
 * </pre>
 */
@RestController
@RequestMapping("/api/specialties")
public class SpecialtyController {

	private final SpecialtyRepository specialties;

	public SpecialtyController(SpecialtyRepository specialties) {
		this.specialties = specialties;
	}

	@GetMapping
	@Transactional(readOnly = true)
	public List<SpecialtyDto> list(@RequestParam(required = false) ProfessionalType type) {
		List<Specialty> result = type == null ? specialties.findAllByOrderByTypeAscNameAsc()
				: specialties.findByTypeOrderByNameAsc(type);
		return result.stream().map(SpecialtyDto::of).toList();
	}
}
