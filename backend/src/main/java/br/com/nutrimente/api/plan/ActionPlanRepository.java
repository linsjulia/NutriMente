package br.com.nutrimente.api.plan;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Planos de ação. O id do paciente e do profissional é o mesmo id do usuário,
 * então "meus planos" é uma consulta só para os dois papéis.
 * (metas, refeições e checklist vêm depois, em lote, pelo @BatchSize)
 */
public interface ActionPlanRepository extends JpaRepository<ActionPlan, Long> {

	@Query("""
			SELECT p FROM ActionPlan p
			  JOIN FETCH p.patient pa JOIN FETCH pa.user
			  JOIN FETCH p.professional pr JOIN FETCH pr.user
			WHERE pa.id = :userId OR pr.id = :userId
			ORDER BY p.startDate DESC, p.id DESC
			""")
	List<ActionPlan> findAllOf(@Param("userId") Long userId);

	@Query("""
			SELECT p FROM ActionPlan p
			  JOIN FETCH p.patient pa JOIN FETCH pa.user
			  JOIN FETCH p.professional pr JOIN FETCH pr.user
			WHERE p.id = :id
			""")
	Optional<ActionPlan> findWithPeople(@Param("id") Long id);
}
