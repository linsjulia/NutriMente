package br.com.nutrimente.api.document;

import java.util.List;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.document.DocumentService.DocumentView;
import br.com.nutrimente.api.document.DocumentService.StoredFile;
import br.com.nutrimente.api.document.ProfessionalDocument.DocumentType;
import br.com.nutrimente.api.user.VerificationStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;

/**
 * Documentos do profissional.
 *
 * <pre>
 * GET    /api/me/documents                       meus documentos (PROFESSIONAL)
 * POST   /api/me/documents?documentType=DIPLOMA  enviar (multipart, campo "file"; PDF/JPG/PNG/WebP até 5 MB)
 * DELETE /api/me/documents/{id}                  apagar (se ainda não aprovado)
 * GET    /api/me/documents/{id}/file             abrir o meu arquivo
 * GET    /api/admin/professionals/{id}/documents documentos de um profissional (ADMIN)
 * GET    /api/admin/documents/{id}/file          abrir o arquivo (ADMIN, auditado)
 * PATCH  /api/admin/documents/{id}               aprovar/recusar { "status": "REJECTED", "notes": "Ilegível" }
 * </pre>
 */
@RestController
public class DocumentController {

	private final DocumentService service;

	public DocumentController(DocumentService service) {
		this.service = service;
	}

	@GetMapping("/api/me/documents")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public List<DocumentView> mine(@AuthenticationPrincipal Jwt jwt) {
		return service.mine(CurrentUser.id(jwt));
	}

	@PostMapping(path = "/api/me/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public DocumentView upload(@AuthenticationPrincipal Jwt jwt,
			@RequestParam(required = false) DocumentType documentType,
			@RequestPart(name = "file", required = false) MultipartFile file) {
		return service.upload(CurrentUser.id(jwt), documentType, file);
	}

	@DeleteMapping("/api/me/documents/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		service.delete(CurrentUser.id(jwt), id);
	}

	@GetMapping("/api/me/documents/{id}/file")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public ResponseEntity<byte[]> myFile(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return asFile(service.myFile(CurrentUser.id(jwt), id));
	}

	@GetMapping("/api/admin/professionals/{id}/documents")
	@PreAuthorize("hasRole('ADMIN')")
	public List<DocumentView> ofProfessional(@PathVariable Long id) {
		return service.ofProfessional(id);
	}

	@GetMapping("/api/admin/documents/{id}/file")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<byte[]> adminFile(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return asFile(service.adminFile(CurrentUser.id(jwt), id));
	}

	@PatchMapping("/api/admin/documents/{id}")
	@PreAuthorize("hasRole('ADMIN')")
	public DocumentView review(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id,
			@Valid @RequestBody ReviewRequest request) {
		return service.review(CurrentUser.id(jwt), id, request.status(), request.notes());
	}

	public record ReviewRequest(VerificationStatus status,
			@Size(max = 500, message = "O motivo pode ter até 500 caracteres") String notes) {
	}

	/** Arquivo pessoal: sem cache compartilhado e sem o navegador "adivinhar" o tipo */
	private static ResponseEntity<byte[]> asFile(StoredFile file) {
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(file.contentType()))
				.cacheControl(CacheControl.noStore().cachePrivate())
				.header("X-Content-Type-Options", "nosniff")
				.body(file.bytes());
	}
}
