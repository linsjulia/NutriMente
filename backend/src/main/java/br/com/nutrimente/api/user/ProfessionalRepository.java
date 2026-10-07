package br.com.nutrimente.api.user;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProfessionalRepository extends JpaRepository<Professional, Long> {

	boolean existsByTypeAndDocument(ProfessionalType type, String document);

	/**
	 * Lista pública: só profissionais APROVADOS, com e-mail confirmado e
	 * conta ativa. "JOIN FETCH" traz o usuário na mesma consulta (evita uma
	 * consulta extra por profissional, o famoso problema "N+1").
	 * type = null -> todas as profissões.
	 * specialtyId = null -> qualquer especialidade; senão, só quem a marcou
	 * (o EXISTS olha a tabela de ligação professional_specialties).
	 * minPrice/maxPrice = faixa de preço da consulta (null = sem limite).
	 * Com faixa de preço, quem deixou "valor a combinar" (preço vazio) não aparece.
	 */
	@Query(value = """
			SELECT p FROM Professional p JOIN FETCH p.user u
			WHERE p.verificationStatus = br.com.nutrimente.api.user.VerificationStatus.APPROVED
			  AND u.active = true AND u.emailVerified = true
			  AND (:type IS NULL OR p.type = :type)
			  AND (:specialtyId IS NULL OR EXISTS (SELECT 1 FROM p.specialties s WHERE s.id = :specialtyId))
			  AND (:minPrice IS NULL OR p.consultationPrice >= :minPrice)
			  AND (:maxPrice IS NULL OR p.consultationPrice <= :maxPrice)
			""", countQuery = """
			SELECT COUNT(p) FROM Professional p JOIN p.user u
			WHERE p.verificationStatus = br.com.nutrimente.api.user.VerificationStatus.APPROVED
			  AND u.active = true AND u.emailVerified = true
			  AND (:type IS NULL OR p.type = :type)
			  AND (:specialtyId IS NULL OR EXISTS (SELECT 1 FROM p.specialties s WHERE s.id = :specialtyId))
			  AND (:minPrice IS NULL OR p.consultationPrice >= :minPrice)
			  AND (:maxPrice IS NULL OR p.consultationPrice <= :maxPrice)
			""")
	Page<Professional> findPublic(@Param("type") ProfessionalType type, @Param("specialtyId") Integer specialtyId,
			@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice, Pageable pageable);

	@Query("""
			SELECT p FROM Professional p JOIN FETCH p.user u
			WHERE p.id = :id
			  AND p.verificationStatus = br.com.nutrimente.api.user.VerificationStatus.APPROVED
			  AND u.active = true AND u.emailVerified = true
			""")
	Optional<Professional> findPublicById(@Param("id") Long id);

	/** Fila do admin: cadastros com e-mail confirmado numa situação */
	@Query(value = """
			SELECT p FROM Professional p JOIN FETCH p.user u
			WHERE p.verificationStatus = :status AND u.active = true AND u.emailVerified = true
			""", countQuery = """
			SELECT COUNT(p) FROM Professional p JOIN p.user u
			WHERE p.verificationStatus = :status AND u.active = true AND u.emailVerified = true
			""")
	Page<Professional> findForReview(@Param("status") VerificationStatus status, Pageable pageable);
}
