package br.com.nutrimente.api.common.event;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import br.com.nutrimente.api.logging.LogClient;

/**
 * Observer: envia logs de auditoria (LGPD) em resposta a eventos de domínio.
 *
 * Assim como o e-mail, o log só é enviado depois do commit, para não
 * registrar ações que falharam.
 */
@Component
public class AuditEventListener {

	private final LogClient logClient;

	public AuditEventListener(LogClient logClient) {
		this.logClient = logClient;
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(ProfessionalVerifiedEvent e) {
		logClient.audit(e.adminId(), "ADMIN", "UPDATE", "professionals.verification",
				e.professionalId(), e.professionalId());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(TelehealthRevokedEvent e) {
		logClient.audit(e.adminId(), "ADMIN", "UPDATE", "professionals.telehealth",
				e.professionalId(), e.professionalId());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(PlanCreatedEvent e) {
		logClient.audit(e.professionalId(), "PROFESSIONAL", "CREATE", "action_plans",
				e.planId(), e.patientId());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(UserRegisteredEvent e) {
		logClient.audit(e.userId(), e.role(), "CREATE", "users", e.userId(), e.userId());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(PasswordResetRequestedEvent e) {
		logClient.access("PASSWORD_RESET_REQUEST", true, e.userId(), e.email(), e.ip(), null);
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(AppointmentBookedEvent e) {
		logClient.audit(e.patientId(), "PATIENT", "CREATE", "appointments", e.appointmentId(), e.patientId());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(AppointmentCancelledEvent e) {
		String role = e.cancelledByPatient() ? "PATIENT" : "PROFESSIONAL";
		logClient.audit(e.cancelledById(), role, "CANCEL", "appointments", e.appointmentId(), e.patientId());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(AppointmentConfirmedEvent e) {
		logClient.audit(e.professionalId(), "PROFESSIONAL", "CONFIRM", "appointments",
				e.appointmentId(), e.patientId());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(AppointmentRescheduledEvent e) {
		logClient.audit(e.patientId(), "PATIENT", "RESCHEDULE", "appointments", e.newId(), e.patientId());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(AppointmentCompletedEvent e) {
		logClient.audit(e.professionalId(), "PROFESSIONAL", "COMPLETE", "appointments",
				e.appointmentId(), e.patientId());
	}
}
