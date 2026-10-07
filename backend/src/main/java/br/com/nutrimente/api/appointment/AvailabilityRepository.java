package br.com.nutrimente.api.appointment;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AvailabilityRepository extends JpaRepository<Availability, Long> {

	List<Availability> findByProfessionalIdAndActiveTrueOrderByDayOfWeekAscStartTimeAsc(Long professionalId);

	/** Apaga todas as janelas do profissional numa consulta só (usado ao salvar a agenda inteira) */
	@Modifying
	@Query("DELETE FROM Availability a WHERE a.professionalId = :professionalId")
	void deleteAllOf(@Param("professionalId") Long professionalId);
}
