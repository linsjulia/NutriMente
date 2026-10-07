package br.com.nutrimente.api.notification;

import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Aviso que aparece no "sininho" da área logada (tabela notifications).
 * read_at vazio = ainda não lida.
 */
@Entity
@Table(name = "notifications")
public class Notification {

	/** Tipos aceitos pelo banco (CHECK). A tela pode usar para escolher o ícone */
	public enum Type {
		APPOINTMENT, MESSAGE, PLAN, PAYMENT, REVIEW, SYSTEM
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Type type;

	@Column(nullable = false, length = 150)
	private String title;

	private String body;

	/** Para onde a notificação leva ao ser clicada (rota do site) */
	@Column(name = "link_url")
	private String linkUrl;

	@Column(name = "read_at")
	private LocalDateTime readAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected Notification() {
	}

	public Notification(Long userId, Type type, String title, String body, String linkUrl) {
		this.userId = userId;
		this.type = type;
		this.title = title;
		this.body = body;
		this.linkUrl = linkUrl;
	}

	@PrePersist
	void onCreate() {
		createdAt = Clock.now();
	}

	public void markRead() {
		if (readAt == null) {
			readAt = Clock.now();
		}
	}

	public Long getId() {
		return id;
	}

	public Long getUserId() {
		return userId;
	}

	public Type getType() {
		return type;
	}

	public String getTitle() {
		return title;
	}

	public String getBody() {
		return body;
	}

	public String getLinkUrl() {
		return linkUrl;
	}

	public LocalDateTime getReadAt() {
		return readAt;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
