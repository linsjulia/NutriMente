package br.com.nutrimente.api.screening;

import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Triagem da consulta (tabela appointment_screenings, migração V005): o
 * paciente conta o motivo e os sintomas atuais antes da consulta. Uma por
 * consulta; o id é o próprio id da consulta. Textos guardados cifrados.
 */
@Entity
@Table(name = "appointment_screenings")
public class AppointmentScreening {

	@Id
	@Column(name = "appointment_id")
	private Long appointmentId;

	@Column(nullable = false)
	private String reason;

	private String symptoms;

	@Column(name = "mood_score")
	private Integer moodScore;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected AppointmentScreening() {
	}

	AppointmentScreening(Long appointmentId) {
		this.appointmentId = appointmentId;
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

	/** Recebe os textos JÁ cifrados */
	void fill(String encryptedReason, String encryptedSymptoms, Integer moodScore) {
		this.reason = encryptedReason;
		this.symptoms = encryptedSymptoms;
		this.moodScore = moodScore;
	}

	Long getAppointmentId() {
		return appointmentId;
	}

	String getReason() {
		return reason;
	}

	String getSymptoms() {
		return symptoms;
	}

	Integer getMoodScore() {
		return moodScore;
	}

	LocalDateTime getCreatedAt() {
		return createdAt;
	}

	LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
