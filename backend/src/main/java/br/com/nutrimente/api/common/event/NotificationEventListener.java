package br.com.nutrimente.api.common.event;

import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import br.com.nutrimente.api.notification.Notification;
import br.com.nutrimente.api.notification.NotificationLinks;
import br.com.nutrimente.api.notification.NotificationService;

/**
 * Observer: cria notificações no site (sininho) em resposta a eventos de domínio.
 *
 * Roda de forma SÍNCRONA, na mesma transação do serviço que publicou o evento.
 * Se a transação falhar, a notificação também é desfeita — ninguém recebe
 * aviso de algo que não aconteceu.
 */
@Component
public class NotificationEventListener {

	private final NotificationService notifications;

	public NotificationEventListener(NotificationService notifications) {
		this.notifications = notifications;
	}

	@EventListener
	void on(ProfessionalVerifiedEvent e) {
		notifications.notify(e.professionalId(), Notification.Type.SYSTEM,
				e.approved() ? "Cadastro aprovado" : "Cadastro precisa de revisão",
				e.approved() ? "Seu registro foi verificado e seu perfil já aparece na busca."
						: "Não conseguimos confirmar seu registro. Motivo: " + e.reason(),
				NotificationLinks.dashboard());
	}

	@EventListener
	void on(TelehealthRevokedEvent e) {
		notifications.notify(e.professionalId(), Notification.Type.SYSTEM,
				"Atendimento online desativado", e.notificationBody(),
				NotificationLinks.dashboard());
	}

	@EventListener
	void on(PlanCreatedEvent e) {
		String intro = "%s criou um plano de ação para você: \"%s\".".formatted(
				e.professionalName(), e.planTitle());
		notifications.notify(e.patientId(), Notification.Type.PLAN,
				"Novo plano de ação", intro, NotificationLinks.plan(e.planId()));
	}

	@EventListener
	void on(AppointmentBookedEvent e) {
		String body = "%s agendou uma consulta %s para %s.".formatted(
				e.patientName(), e.modality(), e.when());
		notifications.notify(e.professionalId(), Notification.Type.APPOINTMENT,
				"Nova consulta agendada", body, NotificationLinks.appointment(e.appointmentId()));
	}

	@EventListener
	void on(AppointmentCancelledEvent e) {
		String body = "%s cancelou a consulta de %s.".formatted(e.cancellerName(), e.when());
		notifications.notify(e.otherId(), Notification.Type.APPOINTMENT,
				"Consulta cancelada", body, NotificationLinks.dashboard());
	}

	@EventListener
	void on(AppointmentConfirmedEvent e) {
		String body = "%s confirmou sua consulta de %s.".formatted(e.professionalName(), e.when());
		notifications.notify(e.patientId(), Notification.Type.APPOINTMENT,
				"Consulta confirmada", body, NotificationLinks.appointment(e.appointmentId()));
	}

	@EventListener
	void on(AppointmentRescheduledEvent e) {
		String body = "%s remarcou a consulta de %s para %s.".formatted(
				e.patientName(), e.originalWhen(), e.newWhen());
		notifications.notify(e.professionalId(), Notification.Type.APPOINTMENT,
				"Consulta remarcada", body, NotificationLinks.appointment(e.newId()));
	}

	@EventListener
	void on(AppointmentCompletedEvent e) {
		notifications.notify(e.patientId(), Notification.Type.APPOINTMENT,
				"Consulta concluída", "Sua consulta foi concluída. Que tal deixar uma avaliação?",
				NotificationLinks.appointment(e.appointmentId()));
	}
}
