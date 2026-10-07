package br.com.nutrimente.api.plan;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.BatchSize;

import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.plan.PlanEnums.PlanStatus;
import br.com.nutrimente.api.user.Patient;
import br.com.nutrimente.api.user.Professional;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Plano de ação que o profissional monta para o paciente (tabela action_plans):
 * metas, rotina alimentar, checklist de hábitos e registros de progresso.
 *
 * As listas abaixo são "filhas" do plano (cascade = ALL): salvar o plano salva
 * as filhas junto. orphanRemoval = true: tirar uma meta da lista apaga a meta
 * do banco. O checklist NÃO usa orphanRemoval: um item retirado só é
 * desativado, para não perder o histórico do que o paciente já marcou.
 */
@Entity
@Table(name = "action_plans")
public class ActionPlan {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "patient_id")
	private Patient patient;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "professional_id")
	private Professional professional;

	@Column(nullable = false, length = 150)
	private String title;

	private String description;

	@Column(name = "start_date", nullable = false)
	private LocalDate startDate;

	@Column(name = "end_date")
	private LocalDate endDate;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private PlanStatus status = PlanStatus.ACTIVE;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	@OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("id")
	@BatchSize(size = 50)
	private List<PlanGoal> goals = new ArrayList<>();

	@OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("id")
	@BatchSize(size = 50)
	private List<MealRoutine> meals = new ArrayList<>();

	@OneToMany(mappedBy = "plan", cascade = CascadeType.ALL)
	@OrderBy("id")
	@BatchSize(size = 50)
	private List<ChecklistItem> checklist = new ArrayList<>();

	@OneToMany(mappedBy = "plan", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("recordDate DESC, id DESC")
	@BatchSize(size = 50)
	private List<ProgressRecord> progress = new ArrayList<>();

	protected ActionPlan() {
	}

	public ActionPlan(Patient patient, Professional professional) {
		this.patient = patient;
		this.professional = professional;
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

	public void updateHeader(String title, String description, LocalDate startDate, LocalDate endDate) {
		this.title = title;
		this.description = description;
		this.startDate = startDate;
		this.endDate = endDate;
	}

	public void changeStatus(PlanStatus status) {
		this.status = status;
	}

	public boolean hasParticipant(Long userId) {
		return patient.getId().equals(userId) || professional.getId().equals(userId);
	}

	public boolean isPatient(Long userId) {
		return patient.getId().equals(userId);
	}

	public Long getId() {
		return id;
	}

	public Patient getPatient() {
		return patient;
	}

	public Professional getProfessional() {
		return professional;
	}

	public String getTitle() {
		return title;
	}

	public String getDescription() {
		return description;
	}

	public LocalDate getStartDate() {
		return startDate;
	}

	public LocalDate getEndDate() {
		return endDate;
	}

	public PlanStatus getStatus() {
		return status;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}

	public List<PlanGoal> getGoals() {
		return goals;
	}

	public List<MealRoutine> getMeals() {
		return meals;
	}

	public List<ChecklistItem> getChecklist() {
		return checklist;
	}

	public List<ProgressRecord> getProgress() {
		return progress;
	}
}
