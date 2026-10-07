package br.com.nutrimente.api.appointment;

import java.util.EnumSet;
import java.util.Set;

/**
 * Situação de uma consulta (coluna appointments.status).
 *
 * <pre>
 * SCHEDULED ──confirm──► CONFIRMED ──complete──► COMPLETED
 *     │                      │
 *     ├──cancel──────────────┴──► CANCELLED
 *     └──reschedule─────────────► RESCHEDULED (e nasce uma consulta nova)
 * </pre>
 */
public enum AppointmentStatus {
	SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, RESCHEDULED, NO_SHOW;

	/**
	 * Situações que OCUPAM o horário na agenda. Iguais às do índice único
	 * uq_appointments_*_slot do banco (COMPLETED também ocupa: a consulta aconteceu).
	 */
	public static final Set<AppointmentStatus> OCCUPYING = EnumSet.of(SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED);

	/** Situações em que a consulta ainda vai acontecer (aparecem em "próximas") */
	public static final Set<AppointmentStatus> UPCOMING = EnumSet.of(SCHEDULED, CONFIRMED, IN_PROGRESS);

	/** Ainda dá para cancelar ou remarcar */
	public boolean isChangeable() {
		return this == SCHEDULED || this == CONFIRMED;
	}
}
