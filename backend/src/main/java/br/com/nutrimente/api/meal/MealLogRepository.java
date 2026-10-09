package br.com.nutrimente.api.meal;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MealLogRepository extends JpaRepository<MealLog, Long> {

	/** Diário do paciente, do mais recente para o mais antigo */
	Page<MealLog> findByPatientIdOrderByEatenAtDescIdDesc(Long patientId, Pageable pageable);

	Optional<MealLog> findByIdAndPatientId(Long id, Long patientId);

	List<MealLog> findByPatientId(Long patientId);
}
