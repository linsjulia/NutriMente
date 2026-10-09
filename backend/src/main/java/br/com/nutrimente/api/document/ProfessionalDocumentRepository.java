package br.com.nutrimente.api.document;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfessionalDocumentRepository extends JpaRepository<ProfessionalDocument, Long> {

	List<ProfessionalDocument> findByProfessionalIdOrderByCreatedAtDescIdDesc(Long professionalId);

	Optional<ProfessionalDocument> findByIdAndProfessionalId(Long id, Long professionalId);

	long countByProfessionalId(Long professionalId);
}
