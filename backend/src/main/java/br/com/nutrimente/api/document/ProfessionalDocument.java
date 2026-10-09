package br.com.nutrimente.api.document;

import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.user.VerificationStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Documento enviado pelo profissional para o admin conferir (tabela
 * professional_documents). O arquivo fica cifrado na pasta da API
 * (EncryptedFileStorage); file_url guarda só o nome aleatório.
 */
@Entity
@Table(name = "professional_documents")
public class ProfessionalDocument {

	public enum DocumentType {
		/** Carteira ou certidão do CRN / CRP */
		REGISTRO_CONSELHO,
		DIPLOMA,
		IDENTIDADE,
		OUTRO
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "professional_id", nullable = false, updatable = false)
	private Long professionalId;

	@Enumerated(EnumType.STRING)
	@Column(name = "document_type", nullable = false)
	private DocumentType documentType;

	@Column(name = "file_url", nullable = false)
	private String file;

	@Column(name = "content_type")
	private String contentType;

	/** Mesmos valores da verificação do profissional: PENDING, APPROVED, REJECTED */
	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private VerificationStatus status = VerificationStatus.PENDING;

	@Column(name = "reviewed_by")
	private Long reviewedBy;

	@Column(name = "review_notes")
	private String reviewNotes;

	@Column(name = "reviewed_at")
	private LocalDateTime reviewedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected ProfessionalDocument() {
	}

	ProfessionalDocument(Long professionalId, DocumentType documentType, String file, String contentType) {
		this.professionalId = professionalId;
		this.documentType = documentType;
		this.file = file;
		this.contentType = contentType;
	}

	@PrePersist
	void onCreate() {
		createdAt = Clock.now();
	}

	void review(Long adminId, VerificationStatus decision, String notes) {
		this.status = decision;
		this.reviewedBy = adminId;
		this.reviewNotes = notes;
		this.reviewedAt = Clock.now();
	}

	Long getId() {
		return id;
	}

	Long getProfessionalId() {
		return professionalId;
	}

	DocumentType getDocumentType() {
		return documentType;
	}

	String getFile() {
		return file;
	}

	String getContentType() {
		return contentType;
	}

	VerificationStatus getStatus() {
		return status;
	}

	String getReviewNotes() {
		return reviewNotes;
	}

	LocalDateTime getReviewedAt() {
		return reviewedAt;
	}

	LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
