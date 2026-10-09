package br.com.nutrimente.api.account;

import java.time.LocalDate;
import java.util.Map;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.account.AccountDtos.ChangePasswordRequest;
import br.com.nutrimente.api.account.AccountDtos.DeleteAccountRequest;
import br.com.nutrimente.api.account.AccountDtos.MeResponse;
import br.com.nutrimente.api.account.AccountDtos.UpdateProfessionalProfileRequest;
import br.com.nutrimente.api.account.AccountDtos.UpdateProfileRequest;
import br.com.nutrimente.api.config.CurrentUser;
import jakarta.validation.Valid;

/**
 * "Minha conta" (exige login, qualquer papel).
 *
 * <pre>
 * GET    /api/me                       meus dados
 * PUT    /api/me                       editar nome, celular e gênero
 * PUT    /api/me/professional-profile  editar bio e valor (só PROFESSIONAL)
 * PUT    /api/me/password              trocar a senha
 * GET    /api/me/export                baixar todos os meus dados em JSON (LGPD)
 * DELETE /api/me                       excluir a conta (LGPD)
 * </pre>
 *
 * @AuthenticationPrincipal Jwt jwt: o Spring entrega o token já conferido.
 */
@RestController
@RequestMapping("/api/me")
public class AccountController {

	private final AccountService accountService;
	private final DataExportService dataExport;

	public AccountController(AccountService accountService, DataExportService dataExport) {
		this.accountService = accountService;
		this.dataExport = dataExport;
	}

	/**
	 * "Baixar meus dados" (LGPD, art. 18). O cabeçalho Content-Disposition faz
	 * o navegador salvar como arquivo (nutrimente-meus-dados-2026-10-09.json).
	 */
	@GetMapping("/export")
	public ResponseEntity<Map<String, Object>> export(@AuthenticationPrincipal Jwt jwt) {
		String filename = "nutrimente-meus-dados-" + LocalDate.now() + ".json";
		return ResponseEntity.ok()
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
				.body(dataExport.export(CurrentUser.id(jwt)));
	}

	@GetMapping
	public MeResponse me(@AuthenticationPrincipal Jwt jwt) {
		return accountService.me(CurrentUser.id(jwt));
	}

	@PutMapping
	public MeResponse update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateProfileRequest request) {
		return accountService.updateProfile(CurrentUser.id(jwt), request);
	}

	/** Exemplo de permissão por papel: paciente recebe 403 aqui */
	@PutMapping("/professional-profile")
	@PreAuthorize("hasRole('PROFESSIONAL')")
	public MeResponse updateProfessionalProfile(@AuthenticationPrincipal Jwt jwt,
			@Valid @RequestBody UpdateProfessionalProfileRequest request) {
		return accountService.updateProfessionalProfile(CurrentUser.id(jwt), request);
	}

	@PutMapping("/password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void changePassword(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody ChangePasswordRequest request) {
		accountService.changePassword(CurrentUser.id(jwt), request.currentPassword(), request.newPassword());
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody DeleteAccountRequest request) {
		accountService.deleteAccount(CurrentUser.id(jwt), request.password());
	}
}
