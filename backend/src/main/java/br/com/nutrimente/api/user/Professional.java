package br.com.nutrimente.api.user;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
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

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

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

	/** Decisão do admin sobre o cadastro */
	public void review(VerificationStatus status) {
		this.verificationStatus = status;
		this.verifiedAt = Clock.now();
	}

	/** Parte da exclusão de conta (LGPD): libera o número do conselho e apaga a bio */
	public void anonymize() {
		this.bio = null;
		this.document = "REMOVIDO-" + id;
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
}
