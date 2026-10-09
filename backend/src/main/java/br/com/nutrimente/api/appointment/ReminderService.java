package br.com.nutrimente.api.appointment;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.EnumSet;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.config.AppProperties;
import br.com.nutrimente.api.notification.EmailService;
import br.com.nutrimente.api.notification.Notification;
import br.com.nutrimente.api.notification.NotificationLinks;
import br.com.nutrimente.api.notification.NotificationService;
import br.com.nutrimente.api.user.User;

/**
 * Lembrete automático na véspera da consulta (e-mail + notificação no
 * sininho) para o paciente e para o profissional.
 *
 * Como funciona: a cada 10 minutos, a API procura consultas agendadas ou
 * confirmadas que começam nas próximas 24 h e ainda não tiveram lembrete.
 * Quem agendou com menos de 24 h de antecedência não recebe: o e-mail do
 * agendamento acabou de chegar.
 *
 * Sem envio em dobro: antes de avisar, a consulta é "reservada" com
 * UPDATE ... WHERE reminder_sent_at IS NULL (claimReminder). Se duas cópias
 * da API tentarem ao mesmo tempo, só uma consegue.
 *
 * Cada consulta é tratada na sua própria transação: um erro numa não
 * impede o lembrete das outras.
 */
@Service
public class ReminderService {

	private static final Logger log = LoggerFactory.getLogger(ReminderService.class);

	/** Só consultas que ainda vão acontecer */
	private static final EnumSet<AppointmentStatus> REMINDABLE = EnumSet.of(AppointmentStatus.SCHEDULED,
			AppointmentStatus.CONFIRMED);

	private final AppointmentRepository appointments;
	private final NotificationService notifications;
	private final EmailService emailService;
	private final ScheduleService schedule;
	private final AppProperties.Appointments rules;
	private final TransactionTemplate transaction;

	public ReminderService(AppointmentRepository appointments, NotificationService notifications,
			EmailService emailService, ScheduleService schedule, AppProperties properties,
			PlatformTransactionManager transactionManager) {
		this.appointments = appointments;
		this.notifications = notifications;
		this.emailService = emailService;
		this.schedule = schedule;
		this.rules = properties.appointments();
		this.transaction = new TransactionTemplate(transactionManager);
	}

	/** Tarefa agendada: 1 min depois de ligar e, depois, a cada 10 min (desligada nos testes) */
	@Scheduled(initialDelayString = "PT1M", fixedDelayString = "PT10M")
	void scheduled() {
		if (rules.remindersEnabled()) {
			int sent = sendDue();
			if (sent > 0) {
				log.info("Lembretes da véspera enviados: {}", sent);
			}
		}
	}

	/** Envia os lembretes devidos agora. Devolve quantas consultas foram lembradas */
	public int sendDue() {
		LocalDateTime now = Clock.now();
		Duration before = rules.reminderBefore();
		List<Appointment> due = transaction.execute(
				status -> appointments.findDueForReminder(REMINDABLE, now, now.plus(before)));
		int sent = 0;
		for (Appointment a : due == null ? List.<Appointment>of() : due) {
			// Agendada em cima da hora: o e-mail de agendamento já fez esse papel
			if (a.getCreatedAt().isAfter(a.getStartsAt().minus(before))) {
				continue;
			}
			try {
				Boolean claimed = transaction.execute(status -> {
					if (appointments.claimReminder(a.getId(), now) == 0) {
						return false; // outra execução já lembrou
					}
					remind(a);
					return true;
				});
				if (Boolean.TRUE.equals(claimed)) {
					sent++;
				}
			} catch (RuntimeException e) {
				log.error("Falha no lembrete da consulta {}", a.getId(), e);
			}
		}
		return sent;
	}

	private void remind(Appointment a) {
		String when = AppointmentService.WHEN.format(a.getStartsAt().toInstant(ZoneOffset.UTC).atZone(schedule.zone()));
		String modality = AppointmentService.modalityLabel(a.getModality());
		boolean online = a.getModality() == Modality.ONLINE;
		User patient = a.getPatient().getUser();
		User professional = a.getProfessional().getUser();

		send(a, patient, "Lembrete: sua consulta está chegando",
				"Sua consulta com %s é %s (%s).".formatted(professional.getName(), when, modality),
				online ? "No horário, abra o link da videochamada pela sua área do NutriMente."
						: "Chegue alguns minutos antes do horário.");
		send(a, professional, "Lembrete: consulta nas próximas 24 horas",
				"Você tem consulta com %s %s (%s).".formatted(patient.getName(), when, modality),
				online ? "Entre primeiro na videochamada: quem abre a sala é o profissional."
						: "A triagem e o questionário do paciente estão na sua área do NutriMente.");
	}

	private void send(Appointment a, User to, String subject, String intro, String footer) {
		notifications.notify(to.getId(), Notification.Type.APPOINTMENT, subject, intro,
				NotificationLinks.appointment(a.getId()));
		String email = to.getEmail();
		String name = to.getName();
		AfterCommit.run(() -> emailService.sendAppointmentNotice(email, name, subject, intro, footer));
	}
}
