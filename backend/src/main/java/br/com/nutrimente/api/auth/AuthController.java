package br.com.nutrimente.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.auth.AuthDtos.EmailRequest;
import br.com.nutrimente.api.auth.AuthDtos.LoginRequest;
import br.com.nutrimente.api.auth.AuthDtos.LoginResponse;
import br.com.nutrimente.api.auth.AuthDtos.MessageResponse;
import br.com.nutrimente.api.auth.AuthDtos.RegisterPatientRequest;
import br.com.nutrimente.api.auth.AuthDtos.RegisterProfessionalRequest;
import br.com.nutrimente.api.auth.AuthDtos.ResetPasswordRequest;
import br.com.nutrimente.api.auth.AuthDtos.TokenRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

/**
 * Rotas públicas de autenticação (não exigem login).
 *
 * Controller = "porta de entrada": recebe a requisição, valida o formato
 * (@Valid) e repassa para o service, onde ficam as regras.
 *
 * <pre>
 * POST /api/auth/register/patient       cadastro de cliente
 * POST /api/auth/register/professional  cadastro de profissional
 * POST /api/auth/login                  login -> token JWT
 * POST /api/auth/verify-email           confirma o e-mail (token do link)
 * POST /api/auth/resend-verification    reenvia o e-mail de confirmação
 * POST /api/auth/forgot-password        envia o link de redefinição
 * POST /api/auth/reset-password         define a nova senha (token do link)
 * </pre>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

	/** Mesma resposta exista a conta ou não (não revela e-mails cadastrados) */
	private static final MessageResponse IF_EXISTS = new MessageResponse(
			"Se houver uma conta com este e-mail, você receberá uma mensagem em instantes.");

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register/patient")
	@ResponseStatus(HttpStatus.CREATED)
	public MessageResponse registerPatient(@Valid @RequestBody RegisterPatientRequest request,
			HttpServletRequest http) {
		authService.registerPatient(request, clientIp(http));
		return new MessageResponse("Cadastro realizado! Enviamos um link de confirmação para o seu e-mail.");
	}

	@PostMapping("/register/professional")
	@ResponseStatus(HttpStatus.CREATED)
	public MessageResponse registerProfessional(@Valid @RequestBody RegisterProfessionalRequest request,
			HttpServletRequest http) {
		authService.registerProfessional(request, clientIp(http));
		return new MessageResponse("Cadastro realizado! Confirme seu e-mail; depois, nossa equipe vai verificar "
				+ "seu registro profissional.");
	}

	@PostMapping("/login")
	public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
		return authService.login(request, clientIp(http));
	}

	@PostMapping("/verify-email")
	public MessageResponse verifyEmail(@Valid @RequestBody TokenRequest request) {
		authService.verifyEmail(request.token());
		return new MessageResponse("E-mail confirmado! Você já pode entrar.");
	}

	@PostMapping("/resend-verification")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public MessageResponse resendVerification(@Valid @RequestBody EmailRequest request) {
		authService.resendVerification(request.email());
		return IF_EXISTS;
	}

	@PostMapping("/forgot-password")
	@ResponseStatus(HttpStatus.ACCEPTED)
	public MessageResponse forgotPassword(@Valid @RequestBody EmailRequest request, HttpServletRequest http) {
		authService.requestPasswordReset(request.email(), clientIp(http));
		return IF_EXISTS;
	}

	@PostMapping("/reset-password")
	public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest http) {
		authService.resetPassword(request.token(), request.password(), clientIp(http));
		return new MessageResponse("Senha alterada! Entre com a nova senha.");
	}

	/**
	 * IP de quem fez a requisição. O front (Next.js) repassa o IP original no
	 * header X-Forwarded-For, porque para a API quem chama é o servidor do Next.
	 */
	static String clientIp(HttpServletRequest request) {
		String forwarded = request.getHeader("X-Forwarded-For");
		if (forwarded != null && !forwarded.isBlank()) {
			return forwarded.split(",")[0].strip();
		}
		return request.getRemoteAddr();
	}
}
