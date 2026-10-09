package br.com.nutrimente.api.document;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.EncryptedFileStorage;
import br.com.nutrimente.api.common.FileType;
import br.com.nutrimente.api.document.ProfessionalDocument.DocumentType;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.notification.EmailService;
import br.com.nutrimente.api.notification.Notification;
import br.com.nutrimente.api.notification.NotificationLinks;
import br.com.nutrimente.api.notification.NotificationService;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.VerificationStatus;

/**
 * Documentos do profissional (carteira do conselho, diploma, identidade),
 * para o admin conferir o registro.
 *
 * Regras:
 * - o PROFISSIONAL envia (JPG, PNG, WebP ou PDF, até 5 MB; no máximo 10),
 *   vê os seus e apaga os que ainda não foram aprovados;
 * - o ADMIN lista os documentos de um profissional, abre o arquivo e
 *   aprova ou recusa (com motivo); o profissional é avisado;
 * - arquivos cifrados (EncryptedFileStorage); excluir a conta apaga tudo.
 */
@Service
public class DocumentService {

	static final int MAX_DOCUMENTS = 10;

	private final ProfessionalDocumentRepository documents;
	private final ProfessionalRepository professionals;
	private final EncryptedFileStorage files;
	private final NotificationService notifications;
	private final EmailService emailService;
	private final LogClient logClient;

	public DocumentService(ProfessionalDocumentRepository documents, ProfessionalRepository professionals,
			EncryptedFileStorage files, NotificationService notifications, EmailService emailService,
			LogClient logClient) {
		this.documents = documents;
		this.professionals = professionals;
		this.files = files;
		this.notifications = notifications;
		this.emailService = emailService;
		this.logClient = logClient;
	}

	// ---------------- Profissional ----------------

	@Transactional(readOnly = true)
	public List<DocumentView> mine(Long professionalId) {
		return documents.findByProfessionalIdOrderByCreatedAtDescIdDesc(professionalId).stream()
				.map(d -> DocumentView.of(d, "/api/me/documents/" + d.getId() + "/file")).toList();
	}

	@Transactional
	public DocumentView upload(Long professionalId, DocumentType type, MultipartFile file) {
		if (!professionals.existsById(professionalId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só profissionais enviam documentos.");
		}
		if (type == null) {
			throw fieldError("documentType", "Escolha o tipo do documento");
		}
		if (file == null || file.isEmpty()) {
			throw fieldError("file", "Escolha o arquivo");
		}
		if (documents.countByProfessionalId(professionalId) >= MAX_DOCUMENTS) {
			throw new ApiException(HttpStatus.CONFLICT, "TOO_MANY_DOCUMENTS",
					"Você já enviou " + MAX_DOCUMENTS + " documentos. Apague um que não precisa mais.");
		}
		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
		String contentType = FileType.detect(bytes)
				.orElseThrow(() -> fieldError("file", "Envie o documento em PDF, JPG, PNG ou WebP"));
		ProfessionalDocument document = documents.saveAndFlush(
				new ProfessionalDocument(professionalId, type, files.save(bytes), contentType));
		Long id = document.getId();
		AfterCommit.run(() -> logClient.audit(professionalId, "PROFESSIONAL", "CREATE", "professional_documents", id,
				professionalId));
		return DocumentView.of(document, "/api/me/documents/" + id + "/file");
	}

	@Transactional
	public void delete(Long professionalId, Long id) {
		ProfessionalDocument document = documents.findByIdAndProfessionalId(id, professionalId)
				.orElseThrow(() -> ApiException.notFound("Documento não encontrado."));
		if (document.getStatus() == VerificationStatus.APPROVED) {
			throw new ApiException(HttpStatus.CONFLICT, "DOCUMENT_APPROVED",
					"Documentos já aprovados não podem ser apagados.");
		}
		String file = document.getFile();
		documents.delete(document);
		AfterCommit.run(() -> files.delete(file));
	}

	@Transactional(readOnly = true)
	public StoredFile myFile(Long professionalId, Long id) {
		return read(documents.findByIdAndProfessionalId(id, professionalId)
				.orElseThrow(() -> ApiException.notFound("Documento não encontrado.")));
	}

	/** Exclusão de conta (LGPD): documentos de identidade não ficam guardados */
	@Transactional
	public void deleteAllOf(Long professionalId) {
		List<ProfessionalDocument> all = documents.findByProfessionalIdOrderByCreatedAtDescIdDesc(professionalId);
		List<String> stored = all.stream().map(d -> d.getFile()).toList();
		documents.deleteAll(all);
		AfterCommit.run(() -> stored.forEach(files::delete));
	}

	// ---------------- Admin ----------------

	@Transactional(readOnly = true)
	public List<DocumentView> ofProfessional(Long professionalId) {
		return documents.findByProfessionalIdOrderByCreatedAtDescIdDesc(professionalId).stream()
				.map(d -> DocumentView.of(d, "/api/admin/documents/" + d.getId() + "/file")).toList();
	}

	@Transactional(readOnly = true)
	public StoredFile adminFile(Long adminId, Long id) {
		ProfessionalDocument document = documents.findById(id)
				.orElseThrow(() -> ApiException.notFound("Documento não encontrado."));
		Long professionalId = document.getProfessionalId();
		AfterCommit.run(() -> logClient.audit(adminId, "ADMIN", "READ", "professional_documents", id, professionalId));
		return read(document);
	}

	@Transactional
	public DocumentView review(Long adminId, Long id, VerificationStatus decision, String notes) {
		if (decision == null || decision == VerificationStatus.PENDING) {
			throw fieldError("status", "Use APPROVED ou REJECTED");
		}
		String cleanNotes = notes == null || notes.isBlank() ? null : notes.strip();
		if (decision == VerificationStatus.REJECTED && cleanNotes == null) {
			throw fieldError("notes", "Informe o motivo da recusa");
		}
		ProfessionalDocument document = documents.findById(id)
				.orElseThrow(() -> ApiException.notFound("Documento não encontrado."));
		document.review(adminId, decision, cleanNotes);
		documents.flush();

		boolean approved = decision == VerificationStatus.APPROVED;
		String title = approved ? "Documento aprovado" : "Documento recusado";
		String body = approved ? "Conferimos o documento que você enviou."
				: "Não conseguimos aceitar o documento enviado. Motivo: " + cleanNotes;
		Long professionalId = document.getProfessionalId();
		notifications.notify(professionalId, Notification.Type.SYSTEM, title, body, NotificationLinks.dashboard());
		Professional professional = professionals.findById(professionalId).orElseThrow();
		String email = professional.getUser().getEmail();
		String name = professional.getUser().getName();
		AfterCommit.run(() -> {
			emailService.sendAccountNotice(email, name, title, body,
					approved ? "Obrigado por manter seu cadastro em dia." : "Você pode enviar um novo arquivo pela sua área.");
			logClient.audit(adminId, "ADMIN", "UPDATE", "professional_documents", id, professionalId);
		});
		return DocumentView.of(document, "/api/admin/documents/" + id + "/file");
	}

	private StoredFile read(ProfessionalDocument d) {
		return new StoredFile(files.read(d.getFile()), d.getContentType());
	}

	private static ApiException fieldError(String field, String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, Map.of(field, message));
	}

	public record StoredFile(byte[] bytes, String contentType) {
	}

	public record DocumentView(Long id, DocumentType documentType, String contentType, VerificationStatus status,
			String reviewNotes, Instant reviewedAt, Instant createdAt,
			/** Rota do arquivo (exige login) */
			String fileUrl) {

		static DocumentView of(ProfessionalDocument d, String fileUrl) {
			return new DocumentView(d.getId(), d.getDocumentType(), d.getContentType(), d.getStatus(),
					d.getReviewNotes(), toInstant(d.getReviewedAt()), toInstant(d.getCreatedAt()), fileUrl);
		}

		private static Instant toInstant(LocalDateTime utc) {
			return utc == null ? null : utc.toInstant(ZoneOffset.UTC);
		}
	}
}
