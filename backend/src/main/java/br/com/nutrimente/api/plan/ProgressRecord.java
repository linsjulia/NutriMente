package br.com.nutrimente.api.plan;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/** Registro de progresso: peso, humor (1 a 5) e observações de um dia. Paciente ou profissional registram */
@Entity
@Table(name = "progress_records")
public class ProgressRecord {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "plan_id")
	private ActionPlan plan;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "recorded_by")
	private User recordedBy;

	@Column(name = "record_date", nullable = false)
	private LocalDate recordDate;

	@Column(name = "weight_kg")
	private BigDecimal weightKg;

	/** 1 (muito mal) a 5 (muito bem) */
	@Column(name = "mood_score")
	private Integer moodScore;

	private String notes;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected ProgressRecord() {
	}

	public ProgressRecord(ActionPlan plan, User recordedBy, LocalDate recordDate, BigDecimal weightKg,
			Integer moodScore, String notes) {
		this.plan = plan;
		this.recordedBy = recordedBy;
		this.recordDate = recordDate;
		this.weightKg = weightKg;
		this.moodScore = moodScore;
		this.notes = notes;
	}

	@PrePersist
	void onCreate() {
		createdAt = Clock.now();
	}

	public Long getId() {
		return id;
	}

	public User getRecordedBy() {
		return recordedBy;
	}

	public LocalDate getRecordDate() {
		return recordDate;
	}

	public BigDecimal getWeightKg() {
		return weightKg;
	}

	public Integer getMoodScore() {
		return moodScore;
	}

	public String getNotes() {
		return notes;
	}
}
