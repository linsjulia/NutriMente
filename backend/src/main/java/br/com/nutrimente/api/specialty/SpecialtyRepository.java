package br.com.nutrimente.api.specialty;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import br.com.nutrimente.api.user.ProfessionalType;

/**
 * Acesso à tabela "specialties". O Spring Data cria as consultas a partir
 * do NOME do método (ex.: findByTypeOrderByName = WHERE type = ? ORDER BY name).
 */
public interface SpecialtyRepository extends JpaRepository<Specialty, Integer> {

	List<Specialty> findAllByOrderByTypeAscNameAsc();

	List<Specialty> findByTypeOrderByNameAsc(ProfessionalType type);

	boolean existsByTypeAndNameIgnoreCase(ProfessionalType type, String name);
}
