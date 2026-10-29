package br.com.nutrimente.api.common.event;

import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

import br.com.nutrimente.api.notification.EmailService;

/**
 * Observer: envia e-mails em resposta a eventos de domínio.
 *
 * {@code @TransactionalEventListener} garante que o e-mail só sai DEPOIS
 * do commit — se a transação falhar, ninguém recebe e-mail de algo que
 * não aconteceu. {@code fallbackExecution = true} mantém o envio quando
 * não há transação ativa (mesmo comportamento do AfterCommit.run).
 */
@Component
public class EmailEventListener {

	private final EmailService emailService;

	public EmailEventListener(EmailService emailService) {
		this.emailService = emailService;
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(ProfessionalVerifiedEvent e) {
		emailService.sendProfessionalReviewed(e.professionalEmail(), e.professionalName(),
				e.approved(), e.approved() ? null : e.reason());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(TelehealthRevokedEvent e) {
		emailService.sendAccountNotice(e.professionalEmail(), e.professionalName(),
				"Atendimento online desativado", e.notificationBody(),
				"As consultas online já marcadas continuam valendo. Depois de regularizar, marque de novo no seu perfil.");
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(PlanCreatedEvent e) {
		String intro = "%s criou um plano de ação para você: \"%s\".".formatted(
				e.professionalName(), e.planTitle());
		emailService.sendPlanNotice(e.patientEmail(), e.patientName(),
				"Novo plano de ação", intro);
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(UserRegisteredEvent e) {
		emailService.sendEmailVerification(e.email(), e.name(), e.verificationToken());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(PasswordResetRequestedEvent e) {
		emailService.sendPasswordReset(e.email(), e.name(), e.resetToken());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(AppointmentBookedEvent e) {
		emailService.sendAppointmentNotice(e.professionalEmail(), e.professionalName(),
				"Nova consulta agendada",
				"%s agendou uma consulta %s para %s.".formatted(e.patientName(), e.modality(), e.when()),
				"Você pode confirmar a consulta na sua área do NutriMente.");
		emailService.sendAppointmentNotice(e.patientEmail(), e.patientName(),
				"Consulta agendada",
				"Sua consulta com %s está marcada para %s (%s).".formatted(e.professionalName(), e.when(), e.modality()),
				e.cancelPolicy());
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(AppointmentCancelledEvent e) {
		String intro = "%s cancelou a consulta de %s.".formatted(e.cancellerName(), e.when());
		String footer = e.reason() != null ? "Motivo informado: " + e.reason() : "Nenhum motivo foi informado.";
		emailService.sendAppointmentNotice(e.otherEmail(), e.otherName(),
				"Consulta cancelada", intro, footer);
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(AppointmentConfirmedEvent e) {
		String intro = "%s confirmou sua consulta de %s.".formatted(e.professionalName(), e.when());
		String footer = e.videoUrl() != null
				? "Link da videochamada: " + e.videoUrl() + "\n" + e.cancelPolicy()
				: e.cancelPolicy();
		emailService.sendAppointmentNotice(e.patientEmail(), e.patientName(),
				"Consulta confirmada", intro, footer);
	}

	@TransactionalEventListener(fallbackExecution = true)
	void on(AppointmentRescheduledEvent e) {
		String intro = "%s remarcou a consulta de %s para %s.".formatted(
				e.patientName(), e.originalWhen(), e.newWhen());
		emailService.sendAppointmentNotice(e.professionalEmail(), e.professionalName(),
				"Consulta remarcada", intro, e.cancelPolicy());
	}
}
