package br.com.nutrimente.api.appointment;

import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Uma janela de atendimento semanal do profissional, ex.: "segunda, das 08:00
 * às 12:00" (tabela professional_availability).
 *
 * Os horários são do relógio LOCAL (fuso de nutrimente.appointments.timezone,
 * padrão America/Sao_Paulo): é assim que o profissional pensa a agenda.
 * As consultas, por outro lado, são gravadas em UTC.
 */
@Entity
@Table(name = "professional_availability")
public class Availability {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "professional_id", nullable = false)
	private Long professionalId;

	/** 0 = domingo, 1 = segunda ... 6 = sábado (igual ao banco) */
	@Column(name = "day_of_week", nullable = false)
	private Integer dayOfWeek;

	@Column(name = "start_time", nullable = false)
	private LocalTime startTime;

	@Column(name = "end_time", nullable = false)
	private LocalTime endTime;

	@Column(name = "is_active", nullable = false)
	private boolean active = true;

	protected Availability() {
	}

	public Availability(Long professionalId, int dayOfWeek, LocalTime startTime, LocalTime endTime) {
		this.professionalId = professionalId;
		this.dayOfWeek = dayOfWeek;
		this.startTime = startTime;
		this.endTime = endTime;
	}

	public Long getId() {
		return id;
	}

	public int getDayOfWeek() {
		return dayOfWeek;
	}

	public LocalTime getStartTime() {
		return startTime;
	}

	public LocalTime getEndTime() {
		return endTime;
	}
}
