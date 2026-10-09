package br.com.nutrimente.api.appointment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.user.Patient;
import br.com.nutrimente.api.user.Professional;
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
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Uma consulta entre paciente e profissional (tabela appointments).
 * Datas em UTC, como em todo o banco.
 */
@Entity
@Table(name = "appointments")
public class Appointment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "patient_id")
	private Patient patient;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "professional_id")
	private Professional professional;

	@Column(name = "starts_at", nullable = false)
	private LocalDateTime startsAt;

	@Column(name = "ends_at", nullable = false)
	private LocalDateTime endsAt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private AppointmentStatus status = AppointmentStatus.SCHEDULED;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private Modality modality;

	@Column(name = "video_url")
	private String videoUrl;

	/**
	 * Valor COPIADO do perfil no momento do agendamento: se o profissional
	 * mudar o preço depois, a consulta já marcada continua com o valor combinado.
	 */
	@Column(nullable = false)
	private BigDecimal price;

	/** Observação do paciente para o profissional (ex.: "primeira consulta") */
	private String notes;

	@Column(name = "cancellation_reason")
	private String cancellationReason;

	@Column(name = "cancelled_by")
	private Long cancelledBy;

	/** Se esta consulta nasceu de uma remarcação, o id da original */
	@Column(name = "rescheduled_from_id")
	private Long rescheduledFromId;

	/** Quando o lembrete da véspera saiu (V006); marcado pelo ReminderService */
	@Column(name = "reminder_sent_at", insertable = false, updatable = false)
	private LocalDateTime reminderSentAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected Appointment() {
	}

	public Appointment(Patient patient, Professional professional, LocalDateTime startsAt, LocalDateTime endsAt,
			Modality modality, String videoUrl, BigDecimal price, String notes, Long rescheduledFromId) {
		this.patient = patient;
		this.professional = professional;
		this.startsAt = startsAt;
		this.endsAt = endsAt;
		this.modality = modality;
		this.videoUrl = videoUrl;
		this.price = price;
		this.notes = notes;
		this.rescheduledFromId = rescheduledFromId;
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

	public void cancel(Long byUserId, String reason) {
		status = AppointmentStatus.CANCELLED;
		cancelledBy = byUserId;
		cancellationReason = reason;
	}

	/** A original vira RESCHEDULED; a nova consulta guarda o id desta */
	public void markRescheduled(Long byUserId) {
		status = AppointmentStatus.RESCHEDULED;
		cancelledBy = byUserId;
	}

	public void confirm() {
		status = AppointmentStatus.CONFIRMED;
	}

	public void complete() {
		status = AppointmentStatus.COMPLETED;
	}

	/** O paciente pode preencher a triagem: consulta agendada ou confirmada que ainda não começou */
	public boolean acceptsScreening(Instant now) {
		return status.isChangeable() && now.isBefore(startsAt.toInstant(ZoneOffset.UTC));
	}

	/** O profissional pode escrever o registro: a consulta já começou e não foi cancelada/remarcada */
	public boolean acceptsRecord(Instant now) {
		return status.acceptsRecord() && !now.isBefore(startsAt.toInstant(ZoneOffset.UTC));
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public boolean hasParticipant(Long userId) {
		return patient.getId().equals(userId) || professional.getId().equals(userId);
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

	public LocalDateTime getStartsAt() {
		return startsAt;
	}

	public LocalDateTime getEndsAt() {
		return endsAt;
	}

	public AppointmentStatus getStatus() {
		return status;
	}

	public Modality getModality() {
		return modality;
	}

	public String getVideoUrl() {
		return videoUrl;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public String getNotes() {
		return notes;
	}

	public String getCancellationReason() {
		return cancellationReason;
	}

	public Long getCancelledBy() {
		return cancelledBy;
	}

	public Long getRescheduledFromId() {
		return rescheduledFromId;
	}
}
