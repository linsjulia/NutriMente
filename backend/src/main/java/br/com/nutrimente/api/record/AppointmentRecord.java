package br.com.nutrimente.api.record;

import java.time.LocalDateTime;

import br.com.nutrimente.api.appointment.Appointment;
import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.user.Professional;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

/**
 * Registro da consulta (prontuário), tabela appointment_records (migração V002).
 * Um por consulta, escrito pelo profissional.
 *
 * Os dois textos ficam CRIPTOGRAFADOS aqui (RecordCipher): a entidade guarda
 * exatamente o que vai para o banco, e o RecordService cifra ao gravar e
 * decifra ao ler. Assim fica explícito onde o texto aberto existe.
 */
@Entity
@Table(name = "appointment_records")
public class AppointmentRecord {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "appointment_id", updatable = false)
	private Appointment appointment;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "professional_id", updatable = false)
	private Professional professional;

	/** Evolução e anotações técnicas: só o profissional lê (cifrado) */
	@Column(name = "private_notes")
	private String privateNotes;

	/** Orientações combinadas: o paciente também lê (cifrado) */
	@Column(name = "patient_guidance")
	private String patientGuidance;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(name = "updated_at", nullable = false)
	private LocalDateTime updatedAt;

	protected AppointmentRecord() {
	}

	public AppointmentRecord(Appointment appointment) {
		this.appointment = appointment;
		this.professional = appointment.getProfessional();
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
	void write(String encryptedPrivateNotes, String encryptedPatientGuidance) {
		this.privateNotes = encryptedPrivateNotes;
		this.patientGuidance = encryptedPatientGuidance;
	}

	public Long getId() {
		return id;
	}

	String getPrivateNotes() {
		return privateNotes;
	}

	String getPatientGuidance() {
		return patientGuidance;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
