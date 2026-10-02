package br.com.nutrimente.api.specialty;

import br.com.nutrimente.api.user.ProfessionalType;

/** Especialidade no JSON de resposta: { "id": 1, "name": "...", "type": "NUTRICIONISTA" } */
public record SpecialtyDto(Integer id, String name, ProfessionalType type) {

	public static SpecialtyDto of(Specialty specialty) {
		return new SpecialtyDto(specialty.getId(), specialty.getName(), specialty.getType());
	}
}
