package br.com.nutrimente.api.meal;

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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Uma refeição do diário alimentar (tabela meal_logs, migração V008).
 * Descrição e anotações ficam CRIPTOGRAFADAS aqui (o MealLogService cifra
 * e decifra). A foto fica num arquivo à parte (EncryptedFileStorage); aqui só o nome.
 */
@Entity
@Table(name = "meal_logs")
public class MealLog {

	public enum MealType {
		CAFE_DA_MANHA, LANCHE_DA_MANHA, ALMOCO, LANCHE_DA_TARDE, JANTAR, CEIA, OUTRO
	}

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "patient_id", nullable = false, updatable = false)
	private Long patientId;

	@Column(name = "eaten_at", nullable = false)
	private LocalDateTime eatenAt;

	@Enumerated(EnumType.STRING)
	@Column(name = "meal_type", nullable = false)
	private MealType mealType;

	@Column(nullable = false)
	private String description;

	private String notes;

	@Column(name = "hunger_level")
	private Integer hungerLevel;

	@Column(name = "satisfaction_level")
	private Integer satisfactionLevel;

	@Column(name = "photo_file")
	private String photoFile;

	@Column(name = "photo_content_type")
	private String photoContentType;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected MealLog() {
	}

	MealLog(Long patientId) {
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
	void fill(LocalDateTime eatenAt, MealType mealType, String encryptedDescription, String encryptedNotes,
			Integer hungerLevel, Integer satisfactionLevel) {
		this.eatenAt = eatenAt;
		this.mealType = mealType;
		this.description = encryptedDescription;
		this.notes = encryptedNotes;
		this.hungerLevel = hungerLevel;
		this.satisfactionLevel = satisfactionLevel;
	}

	void attachPhoto(String file, String contentType) {
		this.photoFile = file;
		this.photoContentType = contentType;
	}

	void removePhoto() {
		attachPhoto(null, null);
	}

	Long getId() {
		return id;
	}

	Long getPatientId() {
		return patientId;
	}

	LocalDateTime getEatenAt() {
		return eatenAt;
	}

	MealType getMealType() {
		return mealType;
	}

	String getDescription() {
		return description;
	}

	String getNotes() {
		return notes;
	}

	Integer getHungerLevel() {
		return hungerLevel;
	}

	Integer getSatisfactionLevel() {
		return satisfactionLevel;
	}

	String getPhotoFile() {
		return photoFile;
	}

	String getPhotoContentType() {
		return photoContentType;
	}

	LocalDateTime getCreatedAt() {
		return createdAt;
	}

	LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
