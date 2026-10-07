package br.com.nutrimente.api.plan;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.hibernate.annotations.BatchSize;

import br.com.nutrimente.api.plan.PlanEnums.Frequency;
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
import jakarta.persistence.Table;

/** Um hábito do checklist, ex.: "Beber 2 litros de água" (todo dia) */
@Entity
@Table(name = "checklist_items")
public class ChecklistItem {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "plan_id")
	private ActionPlan plan;

	@Column(nullable = false, length = 300)
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Frequency frequency = Frequency.DAILY;

	/** Item retirado do plano fica inativo (o histórico das marcações continua) */
	@Column(name = "is_active", nullable = false)
	private boolean active = true;

	/** Marcações do paciente, uma por dia (UNIQUE item + data no banco) */
	@OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
	@BatchSize(size = 50)
	private List<ChecklistEntry> entries = new ArrayList<>();

	protected ChecklistItem() {
	}

	public ChecklistItem(ActionPlan plan, String description, Frequency frequency) {
		this.plan = plan;
		update(description, frequency);
	}

	public void update(String description, Frequency frequency) {
		this.description = description;
		this.frequency = frequency == null ? Frequency.DAILY : frequency;
		this.active = true;
	}

	public void deactivate() {
		this.active = false;
	}

	/** Marca (ou desmarca) o dia. Se já existe marcação naquele dia, só troca o valor */
	public void mark(LocalDate date, boolean completed) {
		entryOn(date).ifPresentOrElse(e -> e.setCompleted(completed),
				() -> entries.add(new ChecklistEntry(this, date, completed)));
	}

	public Optional<ChecklistEntry> entryOn(LocalDate date) {
		return entries.stream().filter(e -> e.getEntryDate().equals(date)).findFirst();
	}

	public boolean doneOn(LocalDate date) {
		return entryOn(date).map(e -> e.isCompleted()).orElse(false);
	}

	public Long getId() {
		return id;
	}

	public ActionPlan getPlan() {
		return plan;
	}

	public String getDescription() {
		return description;
	}

	public Frequency getFrequency() {
		return frequency;
	}

	public boolean isActive() {
		return active;
	}

	public List<ChecklistEntry> getEntries() {
		return entries;
	}
}
