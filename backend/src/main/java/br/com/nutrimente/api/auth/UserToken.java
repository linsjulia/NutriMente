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
 * Token de uso único enviado por e-mail (tabela user_tokens).
 * Só o HASH fica no banco; o token "de verdade" só existe no link do e-mail.
 */
@Entity
@Table(name = "user_tokens")
public class UserToken {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private User user;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private TokenPurpose purpose;

	@Column(name = "token_hash", nullable = false, length = 64)
	private String tokenHash;

	@Column(name = "expires_at", nullable = false)
	private LocalDateTime expiresAt;

	@Column(name = "used_at")
	private LocalDateTime usedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected UserToken() {
	}

	public UserToken(User user, TokenPurpose purpose, String tokenHash) {
		this.user = user;
		this.purpose = purpose;
		this.tokenHash = tokenHash;
		this.createdAt = Clock.now();
		this.expiresAt = createdAt.plus(purpose.validity());
	}

	public boolean isUsable() {
		return usedAt == null && expiresAt.isAfter(Clock.now());
	}

	public void markUsed() {
		this.usedAt = Clock.now();
	}

	public User getUser() {
		return user;
	}

	public TokenPurpose getPurpose() {
		return purpose;
	}
}
