package br.com.nutrimente.api.review;

import java.util.Collection;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {

	boolean existsByAppointmentId(Long appointmentId);

	/** Das consultas da lista, quais já foram avaliadas (uma consulta só ao banco) */
	@Query("SELECT r.appointment.id FROM Review r WHERE r.appointment.id IN :appointmentIds")
	List<Long> findReviewedAppointmentIds(@Param("appointmentIds") Collection<Long> appointmentIds);

	/** Avaliações públicas de um profissional, das mais recentes para as mais antigas */
	@Query(value = """
			SELECT r FROM Review r JOIN FETCH r.patient pa JOIN FETCH pa.user
			WHERE r.professional.id = :professionalId
			ORDER BY r.createdAt DESC, r.id DESC
			""", countQuery = "SELECT COUNT(r) FROM Review r WHERE r.professional.id = :professionalId")
	Page<Review> findByProfessional(@Param("professionalId") Long professionalId, Pageable pageable);

	/** [média, quantidade] das notas de um profissional */
	@Query("SELECT AVG(r.rating * 1.0), COUNT(r) FROM Review r WHERE r.professional.id = :professionalId")
	List<Object[]> ratingSummary(@Param("professionalId") Long professionalId);
}
