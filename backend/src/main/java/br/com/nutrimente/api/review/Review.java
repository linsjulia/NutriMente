package br.com.nutrimente.api.review;

import java.time.LocalDateTime;

import br.com.nutrimente.api.appointment.Appointment;
import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.user.Patient;
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
import jakarta.persistence.Table;

/**
 * Avaliação que o paciente dá ao profissional depois de uma consulta
 * REALIZADA (tabela reviews). Uma por consulta: o banco tem UNIQUE em
 * appointment_id, então ninguém avalia a mesma consulta duas vezes.
 */
@Entity
@Table(name = "reviews")
public class Review {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@OneToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "appointment_id")
	private Appointment appointment;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "patient_id")
	private Patient patient;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "professional_id")
	private Professional professional;

	/** 1 a 5 estrelas */
	@Column(nullable = false)
	private Integer rating;

	private String comment;

	@Column(name = "created_at", nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected Review() {
	}

	public Review(Appointment appointment, int rating, String comment) {
		this.appointment = appointment;
		this.patient = appointment.getPatient();
		this.professional = appointment.getProfessional();
		this.rating = rating;
		this.comment = comment;
	}

	@PrePersist
	void onCreate() {
		createdAt = Clock.now();
	}

	public Long getId() {
		return id;
	}

	public Patient getPatient() {
		return patient;
	}

	public int getRating() {
		return rating;
	}

	public String getComment() {
		return comment;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
