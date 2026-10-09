package br.com.nutrimente.api.account;

import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.account.AccountDtos.MeResponse;
import br.com.nutrimente.api.account.AccountDtos.UpdateProfessionalProfileRequest;
import br.com.nutrimente.api.account.AccountDtos.UpdateProfileRequest;
import br.com.nutrimente.api.auth.AuthDtos.LoginResponse;
import br.com.nutrimente.api.auth.AuthDtos.SessionUser;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.common.validation.Names;
import br.com.nutrimente.api.config.JwtService;
import br.com.nutrimente.api.document.DocumentService;
import br.com.nutrimente.api.intake.PatientIntakeRepository;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.meal.MealLogService;
import br.com.nutrimente.api.specialty.Specialty;
import br.com.nutrimente.api.specialty.SpecialtyRepository;
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
	private final SpecialtyRepository specialties;
	private final PasswordEncoder passwordEncoder;
	private final LogClient logClient;
	private final JwtService jwtService;
	private final PatientIntakeRepository intakes;
	private final MealLogService mealLogs;
	private final DocumentService documents;

	public AccountService(UserRepository users, ProfessionalRepository professionals,
			SpecialtyRepository specialties, PasswordEncoder passwordEncoder, LogClient logClient,
			JwtService jwtService, PatientIntakeRepository intakes, MealLogService mealLogs,
			DocumentService documents) {
		this.documents = documents;
		this.jwtService = jwtService;
		this.mealLogs = mealLogs;
		this.intakes = intakes;
		this.users = users;
		this.professionals = professionals;
		this.specialties = specialties;
		this.passwordEncoder = passwordEncoder;
		this.logClient = logClient;
	}

	/** readOnly: só leitura, o banco pode otimizar */
	@Transactional(readOnly = true)
	public MeResponse me(Long userId) {
		User user = activeUser(userId);
		return meResponse(user, professionalOf(user));
	}

	@Transactional
	public MeResponse updateProfile(Long userId, UpdateProfileRequest request) {
		User user = activeUser(userId);
		user.updateProfile(Names.normalize(request.name()), Digits.only(request.telephone()), request.gender());
		audit(user, "UPDATE", "users");
		return meResponse(user, professionalOf(user));
	}

	@Transactional
	public MeResponse updateProfessionalProfile(Long userId, UpdateProfessionalProfileRequest request) {
		User user = activeUser(userId);
		Professional professional = professionals.findById(userId)
				.orElseThrow(() -> ApiException.notFound("Perfil profissional não encontrado."));
		professional.updateProfile(Digits.trimToNull(request.bio()), request.consultationPrice());
		if (request.specialtyIds() != null) {
			professional.replaceSpecialties(specialtiesFor(professional, request.specialtyIds()));
		}
		if (request.telehealthRegistered() != null) {
			professional.declareTelehealth(request.telehealthRegistered());
		}
		updateOffice(professional, request);
		audit(user, "UPDATE", "professionals");
		return meResponse(user, professional);
	}

	@Transactional
	/**
	 * Troca a senha e encerra TODAS as sessões abertas (outros aparelhos e um
	 * eventual invasor). Devolve um token novo para quem trocou continuar logado.
	 */
	public LoginResponse changePassword(Long userId, String currentPassword, String newPassword) {
		User user = activeUser(userId);
		checkPassword(user, currentPassword, "currentPassword");
		if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "SAME_PASSWORD", "A nova senha precisa ser diferente da atual.",
					Map.of("newPassword", "A nova senha precisa ser diferente da atual"));
		}
		user.changePassword(passwordEncoder.encode(newPassword));
		audit(user, "UPDATE", "users.password");
		JwtService.IssuedToken token = jwtService.issue(user);
		return new LoginResponse(token.value(), token.expiresAt(),
				new SessionUser(user.getId(), user.getName(), user.getRole()));
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
		// Dados de saúde que são só do paciente (sem obrigação de guarda) são APAGADOS.
		// Prontuário e triagem ficam: fazem parte do histórico clínico (CFP/CFN).
		if (user.getRole() == Role.PATIENT) {
			mealLogs.deleteAllOf(userId);
			intakes.findById(userId).ifPresent(intakes::delete);
		}
		// Documentos do profissional (identidade, diploma...) também não ficam guardados
		if (user.getRole() == Role.PROFESSIONAL) {
			documents.deleteAllOf(userId);
		}
		user.anonymize();
		audit(user, "ANONYMIZE", "users");
	}

	private User activeUser(Long userId) {
		// Conta excluída depois do login: o token ainda é válido, mas a conta não
		return users.findById(userId).filter(user -> user.canLogin())
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "SESSION_INVALID",
						"Sua sessão não é mais válida. Entre novamente."));
	}

	/**
	 * Confere os ids enviados: todos precisam existir e ser da MESMA profissão
	 * do profissional (um psicólogo não marca "Nutrição Esportiva").
	 * Ids repetidos contam uma vez só.
	 */
	private HashSet<Specialty> specialtiesFor(Professional professional, List<Integer> ids) {
		List<Integer> uniqueIds = ids.stream().distinct().toList();
		List<Specialty> found = specialties.findAllById(uniqueIds);
		boolean allValid = found.size() == uniqueIds.size()
				&& found.stream().allMatch(s -> s.getType() == professional.getType());
		if (!allValid) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Revise as especialidades escolhidas.",
					Map.of("specialtyIds", "Escolha especialidades da lista da sua profissão"));
		}
		return new HashSet<>(found);
	}

	/**
	 * Endereço do consultório: só muda se algum dos três campos vier no JSON.
	 * Vazios = apagar. Preenchidos = os três obrigatórios (endereço pela metade não serve).
	 */
	private static void updateOffice(Professional professional, UpdateProfessionalProfileRequest request) {
		if (request.officeAddress() == null && request.officeCity() == null && request.officeState() == null) {
			return;
		}
		String address = Digits.trimToNull(request.officeAddress());
		String city = Digits.trimToNull(request.officeCity());
		String state = Digits.trimToNull(request.officeState());
		if (address == null && city == null && state == null) {
			professional.updateOffice(null, null, null);
			return;
		}
		Map<String, String> missing = new LinkedHashMap<>();
		if (address == null) {
			missing.put("officeAddress", "Informe o endereço do consultório");
		}
		if (city == null) {
			missing.put("officeCity", "Informe a cidade");
		}
		if (state == null) {
			missing.put("officeState", "Escolha a UF");
		}
		if (!missing.isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Revise os campos destacados.", missing);
		}
		professional.updateOffice(address, Names.normalize(city), state);
	}

	/** intakeCompleted só faz sentido para pacientes (null para os outros papéis) */
	private MeResponse meResponse(User user, Professional professional) {
		Boolean intakeCompleted = user.getRole() == Role.PATIENT ? intakes.existsById(user.getId()) : null;
		return MeResponse.of(user, professional, intakeCompleted);
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
