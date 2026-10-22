package br.com.nutrimente.api.user;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProfessionalRepository extends JpaRepository<Professional, Long> {

	boolean existsByTypeAndDocument(ProfessionalType type, String document);

	/**
	 * Busca pública. Cada filtro desligado (any* = false) não restringe nada;
	 * as listas vêm com um valor qualquer nesse caso (o IN vazio não é válido).
	 * - specialtyIds: quem marcou PELO MENOS UMA das especialidades (temas)
	 * - audiences: quem atende pelo menos um dos públicos
	 * - genders: gênero informado no cadastro
	 * - upTo30/upTo60/over60: faixas de duração da consulta (somam entre si)
	 * Com faixa de preço, quem deixou "valor a combinar" (preço vazio) não aparece.
	 */
	@Query(value = """
			SELECT p FROM Professional p JOIN FETCH p.user u
			WHERE p.verificationStatus = br.com.nutrimente.api.user.VerificationStatus.APPROVED
			  AND u.active = true AND u.emailVerified = true
			  AND (:type IS NULL OR p.type = :type)
			  AND (:anySpecialty = false OR EXISTS (SELECT 1 FROM p.specialties s WHERE s.id IN :specialtyIds))
			  AND (:minPrice IS NULL OR p.consultationPrice >= :minPrice)
			  AND (:maxPrice IS NULL OR p.consultationPrice <= :maxPrice)
			  AND (:onlineOnly = false OR p.telehealthRegistered = true)
			  AND (:anyAudience = false OR EXISTS (SELECT 1 FROM p.audiences a WHERE a IN :audiences))
			  AND (:anyGender = false OR u.gender IN :genders)
			  AND (:anyDuration = false
			       OR (:upTo30 = true AND p.consultationMinutes <= 30)
			       OR (:upTo60 = true AND p.consultationMinutes <= 60)
			       OR (:over60 = true AND p.consultationMinutes > 60))
			""", countQuery = """
			SELECT COUNT(p) FROM Professional p JOIN p.user u
			WHERE p.verificationStatus = br.com.nutrimente.api.user.VerificationStatus.APPROVED
			  AND u.active = true AND u.emailVerified = true
			  AND (:type IS NULL OR p.type = :type)
			  AND (:anySpecialty = false OR EXISTS (SELECT 1 FROM p.specialties s WHERE s.id IN :specialtyIds))
			  AND (:minPrice IS NULL OR p.consultationPrice >= :minPrice)
			  AND (:maxPrice IS NULL OR p.consultationPrice <= :maxPrice)
			  AND (:onlineOnly = false OR p.telehealthRegistered = true)
			  AND (:anyAudience = false OR EXISTS (SELECT 1 FROM p.audiences a WHERE a IN :audiences))
			  AND (:anyGender = false OR u.gender IN :genders)
			  AND (:anyDuration = false
			       OR (:upTo30 = true AND p.consultationMinutes <= 30)
			       OR (:upTo60 = true AND p.consultationMinutes <= 60)
			       OR (:over60 = true AND p.consultationMinutes > 60))
			""")
	Page<Professional> findPublic(@Param("type") ProfessionalType type,
			@Param("anySpecialty") boolean anySpecialty, @Param("specialtyIds") Collection<Integer> specialtyIds,
			@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice,
			@Param("onlineOnly") boolean onlineOnly,
			@Param("anyAudience") boolean anyAudience, @Param("audiences") Collection<Audience> audiences,
			@Param("anyGender") boolean anyGender, @Param("genders") Collection<Gender> genders,
			@Param("anyDuration") boolean anyDuration, @Param("upTo30") boolean upTo30,
			@Param("upTo60") boolean upTo60, @Param("over60") boolean over60,
			Pageable pageable);

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
