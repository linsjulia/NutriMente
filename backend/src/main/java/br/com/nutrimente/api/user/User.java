package br.com.nutrimente.api.user;

import java.time.LocalDate;
import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Tabela "users": todas as pessoas que fazem login, de qualquer papel.
 * Dados específicos de cada papel ficam em {@link Patient} e {@link Professional}.
 *
 * Entidade JPA = classe Java que representa uma linha da tabela. O Hibernate
 * transforma leituras/alterações nestes objetos em SQL automaticamente.
 */
@Entity
@Table(name = "users")
public class User {

	/** Depois de tantas senhas erradas seguidas, a conta é bloqueada */
	public static final int MAX_FAILED_LOGINS = 5;
	public static final int LOCK_MINUTES = 15;

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY) // o SQL Server gera o id (IDENTITY)
	private Long id;

	@Column(nullable = false, length = 150)
	private String name;

	@Column(nullable = false, length = 255)
	private String email;

	/** Hash BCrypt. A senha em si nunca é gravada. */
	@Column(name = "password_hash")
	private String passwordHash;

	/** Cifrado no banco (V007); aqui, só os dígitos */
	@Convert(converter = EncryptedStringConverter.class)
	private String telephone;

	/**
	 * Endereço da foto de perfil. Por enquanto, um caminho de arquivo do site
	 * (ex.: "/doctor/pfp.png", em public/); o envio de foto pela tela vem depois.
	 */
	@Column(name = "photo_url")
	private String photoUrl;

	/** Somente os 11 dígitos. Cifrado no banco (V007) */
	@Convert(converter = EncryptedStringConverter.class)
	private String cpf;

	/**
	 * "Índice cego" do CPF (HMAC, ver RecordCipher.blindIndex): é por ele que
	 * o banco garante CPF único, já que o CPF cifrado muda a cada gravação.
	 */
	@Column(name = "cpf_hash")
	private String cpfHash;

	/** Cifrada no banco (V007) */
	@Column(name = "birth_date")
	@Convert(converter = EncryptedDateConverter.class)
	private LocalDate birthDate;

	@Enumerated(EnumType.STRING) // grava o nome ("FEMALE"), não a posição (0)
	private Gender gender;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Role role;

	@Column(name = "is_active", nullable = false)
	private boolean active = true;

	/**
	 * Versão da sessão (V004). Vai dentro do token; trocar a senha soma 1 e
	 * derruba os tokens antigos (ver config/SessionValidator).
	 */
	@Column(name = "session_version", nullable = false)
	private int sessionVersion;

	@Column(name = "email_verified", nullable = false)
	private boolean emailVerified;

	@Column(name = "last_login_at")
	private LocalDateTime lastLoginAt;

	@Column(name = "failed_login_attempts", nullable = false)
	private int failedLoginAttempts;

	@Column(name = "locked_until")
	private LocalDateTime lockedUntil;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@Column(name = "deleted_at")
	private LocalDateTime deletedAt;

	protected User() {
		// exigido pelo JPA
	}

	public User(String name, String email, String passwordHash, Role role) {
		this.name = name;
		this.email = email;
		this.passwordHash = passwordHash;
		this.role = role;
	}

	@PrePersist
	void onCreate() {
		createdAt = Clock.now();
		updatedAt = createdAt;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Clock.now();
	}

	// ---------------- Regras de negócio ----------------

	/** Conta excluída ou desativada não pode entrar */
	public int getSessionVersion() {
		return sessionVersion;
	}

	public boolean canLogin() {
		return active && deletedAt == null && passwordHash != null;
	}

	public boolean isLocked() {
		return lockedUntil != null && lockedUntil.isAfter(Clock.now());
	}

	/** Conta uma senha errada; na 5ª seguida, bloqueia por 15 minutos */
	public void registerFailedLogin() {
		failedLoginAttempts++;
		if (failedLoginAttempts >= MAX_FAILED_LOGINS) {
			lockedUntil = Clock.now().plusMinutes(LOCK_MINUTES);
			failedLoginAttempts = 0;
		}
	}

	public void registerSuccessfulLogin() {
		failedLoginAttempts = 0;
		lockedUntil = null;
		lastLoginAt = Clock.now();
	}

	/** Troca a senha e encerra todas as sessões abertas (em todos os aparelhos) */
	public void changePassword(String newPasswordHash) {
		this.passwordHash = newPasswordHash;
		this.sessionVersion++;
		this.failedLoginAttempts = 0;
		this.lockedUntil = null;
	}

	public void verifyEmail() {
		this.emailVerified = true;
	}

	/**
	 * Exclusão de conta (LGPD, art. 18, VI): em vez de apagar a linha (o que
	 * quebraria o histórico de consultas e pagamentos), removemos todos os
	 * dados pessoais. O que sobra não identifica mais a pessoa.
	 */
	public void anonymize() {
		this.name = "Usuário removido";
		this.email = "removido-" + id + "@nutrimente.invalid";
		this.passwordHash = null;
		this.telephone = null;
		this.photoUrl = null;
		this.cpf = null;
		this.cpfHash = null;
		this.birthDate = null;
		this.gender = null;
		this.active = false;
		this.deletedAt = Clock.now();
	}

	public void updateProfile(String name, String telephone, Gender gender) {
		this.name = name;
		this.telephone = telephone;
		this.gender = gender;
	}

	void setPersonalData(String cpf, String cpfHash, LocalDate birthDate, String telephone, Gender gender) {
		this.cpf = cpf;
		this.cpfHash = cpfHash;
		this.birthDate = birthDate;
		this.telephone = telephone;
		this.gender = gender;
	}

	/** Usado só pelo cadastro. cpfHash = RecordCipher.blindIndex(cpf) */
	public static User withPersonalData(String name, String email, String passwordHash, Role role,
			String cpf, String cpfHash, LocalDate birthDate, String telephone, Gender gender) {
		User user = new User(name, email, passwordHash, role);
		user.setPersonalData(cpf, cpfHash, birthDate, telephone, gender);
		return user;
	}

	// ---------------- Getters ----------------

	public Long getId() {
		return id;
	}

	public String getPhotoUrl() {
		return photoUrl;
	}

	public String getName() {
		return name;
	}

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public String getTelephone() {
		return telephone;
	}

	public String getCpf() {
		return cpf;
	}

	public LocalDate getBirthDate() {
		return birthDate;
	}

	public Gender getGender() {
		return gender;
	}

	public Role getRole() {
		return role;
	}

	public boolean isEmailVerified() {
		return emailVerified;
	}

	public LocalDateTime getLockedUntil() {
		return lockedUntil;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
