package br.com.nutrimente.api.intake;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Questionário inicial do paciente (tabela patient_intakes, migração V005).
 * Um por paciente: o id é o próprio id do paciente.
 *
 * Os três textos livres ficam CRIPTOGRAFADOS aqui, exatamente como vão
 * para o banco; o IntakeService cifra ao gravar e decifra ao ler.
 */
@Entity
@Table(name = "patient_intakes")
public class PatientIntake {

	public enum ActivityLevel {
		SEDENTARIO, LEVE, MODERADO, INTENSO
	}

	@Id
	@Column(name = "patient_id")
	private Long patientId;

	/** Códigos de IntakeGoal separados por vírgula */
	@Column(nullable = false)
	private String goals;

	@Column(name = "meals_per_day", nullable = false)
	private int mealsPerDay;

	@Column(name = "water_liters_per_day", nullable = false)
	private BigDecimal waterLitersPerDay;

	@Enumerated(EnumType.STRING)
	@Column(name = "activity_level", nullable = false)
	private ActivityLevel activityLevel;

	@Column(name = "sleep_quality", nullable = false)
	private int sleepQuality;

	@Column(name = "stress_level", nullable = false)
	private int stressLevel;

	@Column(name = "dietary_restrictions")
	private String dietaryRestrictions;

	@Column(name = "health_conditions")
	private String healthConditions;

	private String expectations;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected PatientIntake() {
	}

	public PatientIntake(Long patientId) {
		this.patientId = patientId;
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
	void answer(String goals, int mealsPerDay, BigDecimal waterLitersPerDay, ActivityLevel activityLevel,
			int sleepQuality, int stressLevel, String encryptedRestrictions, String encryptedConditions,
			String encryptedExpectations) {
		this.goals = goals;
		this.mealsPerDay = mealsPerDay;
		this.waterLitersPerDay = waterLitersPerDay;
		this.activityLevel = activityLevel;
		this.sleepQuality = sleepQuality;
		this.stressLevel = stressLevel;
		this.dietaryRestrictions = encryptedRestrictions;
		this.healthConditions = encryptedConditions;
		this.expectations = encryptedExpectations;
	}

	public Long getPatientId() {
		return patientId;
	}

	String getGoals() {
		return goals;
	}

	int getMealsPerDay() {
		return mealsPerDay;
	}

	BigDecimal getWaterLitersPerDay() {
		return waterLitersPerDay;
	}

	ActivityLevel getActivityLevel() {
		return activityLevel;
	}

	int getSleepQuality() {
		return sleepQuality;
	}

	int getStressLevel() {
		return stressLevel;
	}

	String getDietaryRestrictions() {
		return dietaryRestrictions;
	}

	String getHealthConditions() {
		return healthConditions;
	}

	String getExpectations() {
		return expectations;
	}

	LocalDateTime getCreatedAt() {
		return createdAt;
	}

	LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
