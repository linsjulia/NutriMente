package br.com.nutrimente.api.auth;

import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/**
 * Prova de que a pessoa aceitou os termos (LGPD, art. 8º: o consentimento
 * precisa poder ser demonstrado). Guarda qual versão do termo e quando.
 */
@Entity
@Table(name = "lgpd_consents")
public class LgpdConsent {

	/** Versão atual dos termos. Mude quando o texto dos termos mudar. */
	public static final String TERMS_VERSION = "2026-09";

	public enum Type {
		TERMOS_DE_USO, POLITICA_PRIVACIDADE, DADOS_SENSIVEIS_SAUDE, MARKETING
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(name = "consent_type", nullable = false)
	private Type type;

	@Column(name = "terms_version", nullable = false)
	private String termsVersion = TERMS_VERSION;

	@Column(nullable = false)
	private boolean accepted = true;

	@Column(name = "ip_address")
	private String ipAddress;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt = Clock.now();

	protected LgpdConsent() {
	}

	public LgpdConsent(User user, Type type, String ipAddress) {
		this.user = user;
		this.type = type;
		this.ipAddress = ipAddress;
	}
}
