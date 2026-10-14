package br.com.nutrimente.api.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import br.com.nutrimente.api.auth.AuthDtos.RegisterResponse;
import br.com.nutrimente.api.auth.AuthDtos.ResetPasswordRequest;
import br.com.nutrimente.api.auth.AuthDtos.TicketRequest;
import br.com.nutrimente.api.auth.AuthDtos.TokenRequest;
import br.com.nutrimente.api.auth.AuthDtos.VerifyEmailResponse;
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
 * POST /api/auth/verify-email           confirma o e-mail (token do link) e já abre a sessão
 * POST /api/auth/registration-session   troca o ticket do cadastro por uma sessão, depois da confirmação
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
	public RegisterResponse registerPatient(@Valid @RequestBody RegisterPatientRequest request,
			HttpServletRequest http) {
		String ticket = authService.registerPatient(request, clientIp(http));
		return new RegisterResponse("Cadastro realizado! Enviamos um link de confirmação para o seu e-mail.", ticket);
	}

	@PostMapping("/register/professional")
	@ResponseStatus(HttpStatus.CREATED)
	public RegisterResponse registerProfessional(@Valid @RequestBody RegisterProfessionalRequest request,
			HttpServletRequest http) {
		String ticket = authService.registerProfessional(request, clientIp(http));
		return new RegisterResponse("Cadastro realizado! Confirme seu e-mail; depois, nossa equipe vai verificar "
				+ "seu registro profissional.", ticket);
	}

	@PostMapping("/login")
	public LoginResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
		return authService.login(request, clientIp(http));
	}

	@PostMapping("/verify-email")
	public VerifyEmailResponse verifyEmail(@Valid @RequestBody TokenRequest request, HttpServletRequest http) {
		LoginResponse session = authService.verifyEmail(request.token(), clientIp(http));
		return new VerifyEmailResponse("E-mail confirmado! Bem-vindo ao NutriMente.", session.accessToken(),
				session.expiresAt(), session.user());
	}

	/**
	 * 200 com a sessão quando o e-mail já foi confirmado; 204 enquanto não foi
	 * (a tela pergunta de novo em alguns segundos).
	 */
	@PostMapping("/registration-session")
	public ResponseEntity<LoginResponse> registrationSession(@Valid @RequestBody TicketRequest request,
			HttpServletRequest http) {
		return authService.registrationSession(request.ticket(), clientIp(http))
				.map(ResponseEntity::ok)
				.orElseGet(() -> ResponseEntity.noContent().build());
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
	 * IP de quem fez a requisição. Antes lia o X-Forwarded-For na mão, e o
	 * visitante conseguia forjar o próprio IP (que vai para os logs e para os
	 * consentimentos da LGPD). Agora o Tomcat só aceita esse cabeçalho vindo da
	 * rede interna (server.forward-headers-strategy=native) e já entrega o IP
	 * certo em getRemoteAddr().
	 */
	static String clientIp(HttpServletRequest request) {
		return request.getRemoteAddr();
	}
}
