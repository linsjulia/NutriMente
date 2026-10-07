package br.com.nutrimente.api.plan;

import java.time.LocalTime;

import br.com.nutrimente.api.plan.PlanEnums.MealType;
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

/** Uma refeição da rotina alimentar, ex.: Café da manhã, 07:30: "Pão integral com ovo e uma fruta" */
@Entity
@Table(name = "meal_routines")
public class MealRoutine {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "plan_id")
	private ActionPlan plan;

	@Enumerated(EnumType.STRING)
	@Column(name = "meal_type", nullable = false)
	private MealType mealType;

	@Column(name = "meal_time")
	private LocalTime mealTime;

	/** null = todos os dias; 0 = domingo ... 6 = sábado */
	@Column(name = "day_of_week")
	private Integer dayOfWeek;

	@Column(nullable = false, length = 1000)
	private String description;

	protected MealRoutine() {
	}

	public MealRoutine(ActionPlan plan, MealType mealType, LocalTime mealTime, Integer dayOfWeek, String description) {
		this.plan = plan;
		this.mealType = mealType;
		this.mealTime = mealTime;
		this.dayOfWeek = dayOfWeek;
		this.description = description;
	}

	public Long getId() {
		return id;
	}

	public MealType getMealType() {
		return mealType;
	}

	public LocalTime getMealTime() {
		return mealTime;
	}

	public Integer getDayOfWeek() {
		return dayOfWeek;
	}

	public String getDescription() {
		return description;
	}
}
