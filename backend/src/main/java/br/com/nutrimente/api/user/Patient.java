package br.com.nutrimente.api.user;

import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/**
 * Perfil de paciente. Usa o MESMO id do usuário (@MapsId): a linha em
 * "patients" é uma extensão da linha em "users".
 */
@Entity
@Table(name = "patients")
public class Patient {

	@Id
	@Column(name = "user_id")
	private Long id;

	@MapsId
	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id")
	private User user;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected Patient() {
	}

	public Patient(User user) {
		this.user = user;
	}

	@PrePersist
	void onCreate() {
		createdAt = Clock.now();
	}

	/** Mesmo id do usuário (users.id) */
	public Long getId() {
		return id;
	}

	public User getUser() {
		return user;
	}
}
