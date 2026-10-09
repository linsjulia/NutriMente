package br.com.nutrimente.api.auth;

import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.auth.AuthDtos.LoginRequest;
import br.com.nutrimente.api.auth.AuthDtos.LoginResponse;
import br.com.nutrimente.api.auth.AuthDtos.RegisterPatientRequest;
import br.com.nutrimente.api.auth.AuthDtos.RegisterProfessionalRequest;
import br.com.nutrimente.api.auth.AuthDtos.SessionUser;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.common.validation.Names;
import br.com.nutrimente.api.config.JwtService;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.notification.EmailService;
import br.com.nutrimente.api.record.RecordCipher;
import br.com.nutrimente.api.user.CouncilNumber;
import br.com.nutrimente.api.user.Patient;
import br.com.nutrimente.api.user.PatientRepository;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.Role;
import br.com.nutrimente.api.user.User;
import br.com.nutrimente.api.user.UserRepository;

/**
 * Regras de cadastro, login, confirmação de e-mail e redefinição de senha.
 *
 * @Transactional: tudo dentro do método é gravado junto ou nada é gravado.
 * Ex.: se salvar o usuário der certo e salvar o paciente falhar, o usuário
 * também é desfeito (não fica um "meio cadastro" no banco).
 */
@Service
public class AuthService {

	/**
	 * Hash de uma senha qualquer. Quando o e-mail não existe, comparamos a
	 * senha com ele mesmo assim: o login demora o mesmo tempo com e sem conta,
	 * e ninguém descobre quais e-mails estão cadastrados medindo o tempo.
	 */
	private final String dummyHash;

	private final UserRepository users;
	private final PatientRepository patients;
	private final ProfessionalRepository professionals;
	private final UserTokenRepository tokens;
	private final LgpdConsentRepository consents;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final EmailService emailService;
	private final LogClient logClient;
	private final RecordCipher cipher;

	public AuthService(UserRepository users, PatientRepository patients, ProfessionalRepository professionals,
			UserTokenRepository tokens, LgpdConsentRepository consents, PasswordEncoder passwordEncoder,
			JwtService jwtService, EmailService emailService, LogClient logClient, RecordCipher cipher) {
		this.users = users;
		this.cipher = cipher;
		this.patients = patients;
		this.professionals = professionals;
		this.tokens = tokens;
		this.consents = consents;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.emailService = emailService;
		this.logClient = logClient;
		this.dummyHash = passwordEncoder.encode("senha-que-nao-existe");
	}

	// =========================================================
	// Cadastro
	// =========================================================

	@Transactional
	public void registerPatient(RegisterPatientRequest request, String ip) {
		String email = normalizeEmail(request.email());
		String cpf = Digits.only(request.cpf());
		String cpfHash = cipher.blindIndex(cpf);
		ensureUnique(email, cpfHash);

		User user = users.save(User.withPersonalData(Names.normalize(request.name()), email,
				passwordEncoder.encode(request.password()), Role.PATIENT, cpf, cpfHash, request.birthDate(),
				Digits.only(request.telephone()), request.gender()));
		patients.save(new Patient(user));

		saveConsents(user, ip, true);
		afterRegister(user);
	}

	@Transactional
	public void registerProfessional(RegisterProfessionalRequest request, String ip) {
		String email = normalizeEmail(request.email());
		String cpf = Digits.only(request.cpf());
		String document = CouncilNumber.normalize(request.professionalType(), request.documentProfessional())
				.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
						"Revise os campos destacados.",
						Map.of("documentProfessional", CouncilNumber.errorMessage(request.professionalType()))));
		String cpfHash = cipher.blindIndex(cpf);
		ensureUnique(email, cpfHash);
		if (professionals.existsByTypeAndDocument(request.professionalType(), document)) {
			throw ApiException.conflict("documentProfessional",
					"Este " + request.professionalType().council() + " já está cadastrado");
		}

		User user = users.save(User.withPersonalData(Names.normalize(request.name()), email,
				passwordEncoder.encode(request.password()), Role.PROFESSIONAL, cpf, cpfHash, request.birthDate(),
				Digits.only(request.telephone()), request.gender()));
		professionals.save(new Professional(user, request.professionalType(), document, Digits.trimToNull(request.bio())));

		saveConsents(user, ip, false);
		afterRegister(user);
	}

	private void ensureUnique(String email, String cpfHash) {
		if (users.existsByEmail(email)) {
			throw ApiException.conflict("email", "Este e-mail já está cadastrado");
		}
		if (users.existsByCpfHash(cpfHash)) {
			throw ApiException.conflict("cpf", "Este CPF já está cadastrado");
		}
	}

	private void saveConsents(User user, String ip, boolean healthData) {
		consents.save(new LgpdConsent(user, LgpdConsent.Type.TERMOS_DE_USO, ip));
		consents.save(new LgpdConsent(user, LgpdConsent.Type.POLITICA_PRIVACIDADE, ip));
		if (healthData) {
			consents.save(new LgpdConsent(user, LgpdConsent.Type.DADOS_SENSIVEIS_SAUDE, ip));
		}
	}

	private void afterRegister(User user) {
		String token = createToken(user, TokenPurpose.EMAIL_VERIFICATION);
		AfterCommit.run(() -> {
			emailService.sendEmailVerification(user.getEmail(), user.getName(), token);
			logClient.audit(user.getId(), user.getRole().name(), "CREATE", "users", user.getId(), user.getId());
		});
	}

	// =========================================================
	// Login
	// =========================================================

	/**
	 * noRollbackFor: mesmo quando o login falha (e lança erro), o contador
	 * de senhas erradas PRECISA ser gravado, senão o bloqueio nunca acontece.
	 */
	@Transactional(noRollbackFor = ApiException.class)
	public LoginResponse login(LoginRequest request, String ip) {
		String email = normalizeEmail(request.email());
		User user = users.findByEmail(email).filter(u -> u.canLogin()).orElse(null);

		if (user == null) {
			passwordEncoder.matches(request.password(), dummyHash); // mesmo tempo de resposta
			logClient.access("LOGIN", false, null, email, ip, "UNKNOWN_USER");
			throw invalidCredentials();
		}
		if (user.isLocked()) {
			logClient.access("LOGIN", false, user.getId(), email, ip, "LOCKED");
			throw new ApiException(HttpStatus.LOCKED, "ACCOUNT_LOCKED",
					"Muitas tentativas incorretas. Tente novamente em " + User.LOCK_MINUTES
							+ " minutos ou redefina sua senha.");
		}
		if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
			user.registerFailedLogin();
			logClient.access("LOGIN", false, user.getId(), email, ip, "WRONG_PASSWORD");
			throw invalidCredentials();
		}
		// A senha está certa: só agora dizemos que falta confirmar o e-mail
		// (antes disso, qualquer um descobriria se o e-mail está cadastrado)
		if (!user.isEmailVerified()) {
			throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED",
					"Confirme seu e-mail para entrar. Procure a mensagem que enviamos para " + user.getEmail() + ".");
		}

		user.registerSuccessfulLogin();
		logClient.access("LOGIN", true, user.getId(), email, ip, null);
		JwtService.IssuedToken token = jwtService.issue(user);
		return new LoginResponse(token.value(), token.expiresAt(),
				new SessionUser(user.getId(), user.getName(), user.getRole()));
	}

	private static ApiException invalidCredentials() {
		// Mensagem genérica de propósito: não revela se o erro foi no e-mail ou na senha
		return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
	}

	// =========================================================
	// Confirmação de e-mail
	// =========================================================

	@Transactional
	public void verifyEmail(String rawToken) {
		UserToken token = consume(rawToken, TokenPurpose.EMAIL_VERIFICATION);
		token.getUser().verifyEmail();
	}

	/**
	 * Sempre responde "enviamos, se o e-mail existir" (no controller), exista
	 * a conta ou não: não dá para usar esta rota para descobrir e-mails.
	 */
	@Transactional
	public void resendVerification(String email) {
		users.findByEmail(normalizeEmail(email))
				.filter(user -> user.canLogin() && !user.isEmailVerified())
				.ifPresent(user -> {
					String token = createToken(user, TokenPurpose.EMAIL_VERIFICATION);
					AfterCommit.run(() -> emailService.sendEmailVerification(user.getEmail(), user.getName(), token));
				});
	}

	// =========================================================
	// Esqueci minha senha
	// =========================================================

	@Transactional
	public void requestPasswordReset(String email, String ip) {
		users.findByEmail(normalizeEmail(email)).filter(u -> u.canLogin()).ifPresent(user -> {
			String token = createToken(user, TokenPurpose.PASSWORD_RESET);
			AfterCommit.run(() -> {
				emailService.sendPasswordReset(user.getEmail(), user.getName(), token);
				logClient.access("PASSWORD_RESET_REQUEST", true, user.getId(), user.getEmail(), ip, null);
			});
		});
	}

	@Transactional
	public void resetPassword(String rawToken, String newPassword, String ip) {
		UserToken token = consume(rawToken, TokenPurpose.PASSWORD_RESET);
		User user = token.getUser();
		user.changePassword(passwordEncoder.encode(newPassword));
		// Quem recebeu o link no e-mail provou que é dono dele
		user.verifyEmail();
		tokens.invalidateAll(user, TokenPurpose.PASSWORD_RESET);
		AfterCommit.run(() -> logClient.access("PASSWORD_RESET", true, user.getId(), user.getEmail(), ip, null));
	}

	// =========================================================
	// Tokens de e-mail
	// =========================================================

	/** Cria um token novo (invalidando os anteriores) e devolve o valor para o link */
	private String createToken(User user, TokenPurpose purpose) {
		tokens.invalidateAll(user, purpose);
		String raw = SecureTokens.generate();
		tokens.save(new UserToken(user, purpose, SecureTokens.hash(raw)));
		return raw;
	}

	/** Confere o token do link e marca como usado (não funciona duas vezes) */
	private UserToken consume(String rawToken, TokenPurpose purpose) {
		UserToken token = tokens.findByHash(SecureTokens.hash(rawToken), purpose)
				.filter(t -> t.isUsable())
				.filter(t -> t.getUser().canLogin())
				.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TOKEN",
						"Este link é inválido ou expirou. Peça um novo."));
		token.markUsed();
		return token;
	}

	/** E-mails são comparados sempre em minúsculas e sem espaços */
	static String normalizeEmail(String email) {
		return email.strip().toLowerCase(Locale.ROOT);
	}
}
