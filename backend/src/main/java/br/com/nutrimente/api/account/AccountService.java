package br.com.nutrimente.api.account;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.account.AccountDtos.MeResponse;
import br.com.nutrimente.api.account.AccountDtos.UpdateProfessionalProfileRequest;
import br.com.nutrimente.api.account.AccountDtos.UpdateProfileRequest;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.common.validation.Names;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.user.Professional;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.Role;
import br.com.nutrimente.api.user.User;
import br.com.nutrimente.api.user.UserRepository;

/** Ler, editar e excluir a PRÓPRIA conta (o id vem sempre do token). */
@Service
public class AccountService {

	private final UserRepository users;
	private final ProfessionalRepository professionals;
	private final PasswordEncoder passwordEncoder;
	private final LogClient logClient;

	public AccountService(UserRepository users, ProfessionalRepository professionals,
			PasswordEncoder passwordEncoder, LogClient logClient) {
		this.users = users;
		this.professionals = professionals;
		this.passwordEncoder = passwordEncoder;
		this.logClient = logClient;
	}

	/** readOnly: só leitura, o banco pode otimizar */
	@Transactional(readOnly = true)
	public MeResponse me(Long userId) {
		User user = activeUser(userId);
		return MeResponse.of(user, professionalOf(user));
	}

	@Transactional
	public MeResponse updateProfile(Long userId, UpdateProfileRequest request) {
		User user = activeUser(userId);
		user.updateProfile(Names.normalize(request.name()), Digits.only(request.telephone()), request.gender());
		audit(user, "UPDATE", "users");
		return MeResponse.of(user, professionalOf(user));
	}

	@Transactional
	public MeResponse updateProfessionalProfile(Long userId, UpdateProfessionalProfileRequest request) {
		User user = activeUser(userId);
		Professional professional = professionals.findById(userId)
				.orElseThrow(() -> ApiException.notFound("Perfil profissional não encontrado."));
		professional.updateProfile(Digits.trimToNull(request.bio()), request.consultationPrice());
		audit(user, "UPDATE", "professionals");
		return MeResponse.of(user, professional);
	}

	@Transactional
	public void changePassword(Long userId, String currentPassword, String newPassword) {
		User user = activeUser(userId);
		checkPassword(user, currentPassword, "currentPassword");
		if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "SAME_PASSWORD", "A nova senha precisa ser diferente da atual.",
					Map.of("newPassword", "A nova senha precisa ser diferente da atual"));
		}
		user.changePassword(passwordEncoder.encode(newPassword));
		audit(user, "UPDATE", "users.password");
	}

	/**
	 * Exclusão da conta (LGPD, art. 18): anonimiza os dados pessoais.
	 * O administrador não pode se excluir por aqui (evita ficar sem nenhum admin).
	 */
	@Transactional
	public void deleteAccount(Long userId, String password) {
		User user = activeUser(userId);
		if (user.getRole() == Role.ADMIN) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Contas de administrador não podem ser excluídas por aqui.");
		}
		checkPassword(user, password, "password");
		professionals.findById(userId).ifPresent(professional -> professional.anonymize());
		user.anonymize();
		audit(user, "ANONYMIZE", "users");
	}

	private User activeUser(Long userId) {
		// Conta excluída depois do login: o token ainda é válido, mas a conta não
		return users.findById(userId).filter(user -> user.canLogin())
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_INVALID",
						"Sua sessão não é mais válida. Entre novamente."));
	}

	private Professional professionalOf(User user) {
		return user.getRole() == Role.PROFESSIONAL ? professionals.findById(user.getId()).orElse(null) : null;
	}

	private void checkPassword(User user, String password, String field) {
		if (!passwordEncoder.matches(password, user.getPasswordHash())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "WRONG_PASSWORD", "Senha incorreta.",
					Map.of(field, "Senha incorreta"));
		}
	}

	private void audit(User user, String action, String entity) {
		Long id = user.getId();
		String role = user.getRole().name();
		AfterCommit.run(() -> logClient.audit(id, role, action, entity, id, id));
	}
}
