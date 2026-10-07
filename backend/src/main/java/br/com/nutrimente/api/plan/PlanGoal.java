package br.com.nutrimente.api.plan;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import br.com.nutrimente.api.common.Clock;
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

/** Uma meta do plano, ex.: "Perder 3 kg" (alvo 3, unidade "kg") ou "Caminhar 3x por semana" */
@Entity
@Table(name = "plan_goals")
public class PlanGoal {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "plan_id")
	private ActionPlan plan;

	@Column(nullable = false, length = 500)
	private String description;

	@Column(name = "target_value")
	private BigDecimal targetValue;

	private String unit;

	@Column(name = "due_date")
	private LocalDate dueDate;

	/** Quando foi cumprida (null = ainda não) */
	@Column(name = "completed_at")
	private LocalDateTime completedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected PlanGoal() {
	}

	public PlanGoal(ActionPlan plan, String description, BigDecimal targetValue, String unit, LocalDate dueDate) {
		this.plan = plan;
		update(description, targetValue, unit, dueDate);
	}

	@PrePersist
	void onCreate() {
		createdAt = Clock.now();
	}

	public void update(String description, BigDecimal targetValue, String unit, LocalDate dueDate) {
		this.description = description;
		this.targetValue = targetValue;
		this.unit = unit;
		this.dueDate = dueDate;
	}

	public void setCompleted(boolean completed) {
		this.completedAt = completed ? (completedAt == null ? Clock.now() : completedAt) : null;
	}

	public Long getId() {
		return id;
	}

	public String getDescription() {
		return description;
	}

	public BigDecimal getTargetValue() {
		return targetValue;
	}

	public String getUnit() {
		return unit;
	}

	public LocalDate getDueDate() {
		return dueDate;
	}

	public LocalDateTime getCompletedAt() {
		return completedAt;
	}
}
