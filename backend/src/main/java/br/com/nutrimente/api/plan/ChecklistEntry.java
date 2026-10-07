package br.com.nutrimente.api.plan;

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

/** Marcação do paciente num dia: "fiz" (completed = true) ou "não fiz" */
@Entity
@Table(name = "checklist_entries")
public class ChecklistEntry {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "item_id")
	private ChecklistItem item;

	@Column(name = "entry_date", nullable = false)
	private LocalDate entryDate;

	@Column(nullable = false)
	private boolean completed;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected ChecklistEntry() {
	}

	ChecklistEntry(ChecklistItem item, LocalDate entryDate, boolean completed) {
		this.item = item;
		this.entryDate = entryDate;
		this.completed = completed;
	}

	@PrePersist
	void onCreate() {
		createdAt = Clock.now();
	}

	void setCompleted(boolean completed) {
		this.completed = completed;
	}

	public LocalDate getEntryDate() {
		return entryDate;
	}

	public boolean isCompleted() {
		return completed;
	}
}
