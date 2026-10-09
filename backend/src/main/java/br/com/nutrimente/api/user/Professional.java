package br.com.nutrimente.api.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.hibernate.annotations.BatchSize;

import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.specialty.Specialty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Perfil de profissional (nutricionista ou psicólogo). Mesmo id do usuário. */
@Entity
@Table(name = "professionals")
public class Professional {

	@Id
	@Column(name = "user_id")
	private Long id;

	@MapsId
	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(name = "professional_type", nullable = false)
	private ProfessionalType type;

	/** Número do CRN ou CRP */
	@Column(name = "document_professional", nullable = false)
	private String document;

	private String bio;

	@Column(name = "consultation_price")
	private BigDecimal consultationPrice;

	@Enumerated(EnumType.STRING)
	@Column(name = "verification_status", nullable = false)
	private VerificationStatus verificationStatus = VerificationStatus.PENDING;

	@Column(name = "verified_at")
	private LocalDateTime verifiedAt;

	@Column(name = "rating_average", nullable = false)
	private BigDecimal ratingAverage = BigDecimal.ZERO;

	@Column(name = "rating_count", nullable = false)
	private int ratingCount;

	/**
	 * Declarou ter cadastro no e-Psi (CFP 11/2018) ou no e-Nutricionista
	 * (CFN 666/2020), exigido para atender online. Sem isso, só presencial.
	 */
	@Column(name = "telehealth_registered", nullable = false)
	private boolean telehealthRegistered;

	/** Quando declarou (registro de quando o profissional afirmou ter o cadastro) */
	@Column(name = "telehealth_declared_at")
	private LocalDateTime telehealthDeclaredAt;

	/** Endereço do consultório (V009). Sem ele, não atende presencialmente */
	@Column(name = "office_address")
	private String officeAddress;

	@Column(name = "office_city")
	private String officeCity;

	/** UF, ex.: "SP" */
	@Column(name = "office_state")
	private String officeState;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	/**
	 * Especialidades marcadas pelo profissional (relação N:N pela tabela
	 * professional_specialties). LAZY: só são lidas quando alguém usa.
	 * BatchSize: numa lista de 12 profissionais, busca as especialidades de
	 * todos numa consulta só, em vez de uma por profissional ("N+1").
	 */
	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(name = "professional_specialties",
			joinColumns = @JoinColumn(name = "professional_id"),
			inverseJoinColumns = @JoinColumn(name = "specialty_id"))
	@BatchSize(size = 50)
	private Set<Specialty> specialties = new HashSet<>();

	protected Professional() {
	}

	public Professional(User user, ProfessionalType type, String document, String bio) {
		this.user = user;
		this.type = type;
		this.document = document;
		this.bio = bio;
	}

	@PrePersist
	void onCreate() {
		createdAt = Clock.now();
	}

	public void updateProfile(String bio, BigDecimal consultationPrice) {
		this.bio = bio;
		this.consultationPrice = consultationPrice;
	}

	/**
	 * Liga ou desliga o atendimento online. A data só muda quando passa de
	 * "não" para "sim": salvar o perfil de novo não apaga quando ele declarou.
	 */
	public void declareTelehealth(boolean registered) {
		if (registered && !telehealthRegistered) {
			telehealthDeclaredAt = Clock.now();
		} else if (!registered) {
			telehealthDeclaredAt = null;
		}
		telehealthRegistered = registered;
	}

	/** Pode receber consulta ONLINE */
	public boolean offersOnline() {
		return telehealthRegistered;
	}

	public LocalDateTime getTelehealthDeclaredAt() {
		return telehealthDeclaredAt;
	}

	/** Endereço do consultório: os três juntos, ou os três null (não atende presencialmente) */
	public void updateOffice(String address, String city, String state) {
		this.officeAddress = address;
		this.officeCity = city;
		this.officeState = state;
	}

	/** Pode receber consulta PRESENCIAL (informou onde atende) */
	public boolean offersInPerson() {
		return officeAddress != null;
	}

	public String getOfficeAddress() {
		return officeAddress;
	}

	public String getOfficeCity() {
		return officeCity;
	}

	public String getOfficeState() {
		return officeState;
	}

	/** "Rua A, 10 - Centro, São Paulo/SP", ou null */
	public String fullOfficeAddress() {
		return officeAddress == null ? null : "%s, %s/%s".formatted(officeAddress, officeCity, officeState);
	}

	/** Nota média e quantidade de avaliações (recalculadas a cada avaliação nova) */
	public void updateRating(BigDecimal average, int count) {
		this.ratingAverage = average;
		this.ratingCount = count;
	}

	/** Troca todas as especialidades de uma vez (as regras ficam no AccountService) */
	public void replaceSpecialties(Set<Specialty> newSpecialties) {
		specialties.clear();
		specialties.addAll(newSpecialties);
	}

	/** Decisão do admin sobre o cadastro */
	public void review(VerificationStatus status) {
		this.verificationStatus = status;
		this.verifiedAt = Clock.now();
	}

	/** Parte da exclusão de conta (LGPD): libera o número do conselho e apaga a bio */
	public void anonymize() {
		this.bio = null;
		this.specialties.clear();
		this.document = "REMOVIDO-" + id;
		updateOffice(null, null, null);
		this.verificationStatus = VerificationStatus.REJECTED;
	}

	public Long getId() {
		return id;
	}

	public User getUser() {
		return user;
	}

	public ProfessionalType getType() {
		return type;
	}

	public String getDocument() {
		return document;
	}

	public String getBio() {
		return bio;
	}

	public BigDecimal getConsultationPrice() {
		return consultationPrice;
	}

	public VerificationStatus getVerificationStatus() {
		return verificationStatus;
	}

	public BigDecimal getRatingAverage() {
		return ratingAverage;
	}

	public int getRatingCount() {
		return ratingCount;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	/** Em ordem alfabética, para a tela mostrar sempre igual */
	public List<Specialty> getSpecialties() {
		return specialties.stream().sorted(Comparator.comparing(s -> s.getName())).toList();
	}
}
