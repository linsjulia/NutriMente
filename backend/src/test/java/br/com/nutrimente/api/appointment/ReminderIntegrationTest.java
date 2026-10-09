package br.com.nutrimente.api.appointment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.jayway.jsonpath.JsonPath;

import br.com.nutrimente.api.IntegrationTest;

/** Lembrete da véspera: sai uma vez, só para consultas ativas agendadas com antecedência */
class ReminderIntegrationTest extends IntegrationTest {

	private static final String PATIENT_SUBJECT = "Lembrete: sua consulta está chegando";

	@Autowired
	private ReminderService reminders;

	/** Move a consulta para começar daqui a "hoursAhead" horas, agendada "createdDaysAgo" dias atrás */
	private void reschedule(Integer id, int hoursAhead, int createdDaysAgo) {
		jdbc.update("""
				UPDATE appointments SET starts_at = DATEADD(hour, ?, SYSUTCDATETIME()),
				  ends_at = DATEADD(minute, 50, DATEADD(hour, ?, SYSUTCDATETIME())),
				  created_at = DATEADD(day, -?, SYSUTCDATETIME())
				WHERE id = ?""", hoursAhead, hoursAhead, createdDaysAgo, id);
	}

	private Object reminderSentAt(Integer id) {
		return jdbc.queryForObject("SELECT reminder_sent_at FROM appointments WHERE id = ?", Object.class, id);
	}

	@Test
	@DisplayName("lembrete: uma vez só, para paciente e profissional; não para cancelada nem agendada em cima da hora")
	void reminderFlow() throws Exception {
		String admin = createAdminAndLogin();
		Pro pro = readyProfessional(admin);
		String patientEmail = uniqueEmail();
		String patient = registerVerifiedPatient(patientEmail);

		// 1) Agendada há 2 dias, começa em 20 h: deve lembrar
		Integer due = JsonPath.read(book(patient, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");
		reschedule(due, 20, 2);
		// 2) Agendada agora, começa em 5 h: o e-mail do agendamento basta
		String other = registerVerifiedPatient(uniqueEmail());
		Integer lastMinute = JsonPath.read(book(other, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");
		reschedule(lastMinute, 5, 0);
		// 3) Cancelada: nunca lembra
		String third = registerVerifiedPatient(uniqueEmail());
		Integer cancelled = JsonPath.read(book(third, pro.id(), slotAfter(pro.id(), Duration.ofHours(30))), "$.id");
		postAs("/api/appointments/" + cancelled + "/cancel", pro.token(), "{}").andExpect(status().isOk());
		reschedule(cancelled, 10, 3);

		reminders.sendDue();

		assertThat(reminderSentAt(due)).isNotNull();
		assertThat(reminderSentAt(lastMinute)).isNull();
		assertThat(reminderSentAt(cancelled)).isNull();
		verify(emailService).sendAppointmentNotice(eq(patientEmail), anyString(), eq(PATIENT_SUBJECT), anyString(),
				anyString());
		verify(emailService).sendAppointmentNotice(eq(pro.email()), anyString(),
				eq("Lembrete: consulta nas próximas 24 horas"), anyString(), anyString());
		getAs("/api/notifications?size=1", patient)
				.andExpect(jsonPath("$.items[0].title").value(PATIENT_SUBJECT))
				.andExpect(jsonPath("$.items[0].linkUrl").value("/appointments/" + due));

		// Rodar de novo não repete o lembrete
		reminders.sendDue();
		verify(emailService, times(1)).sendAppointmentNotice(eq(patientEmail), anyString(), eq(PATIENT_SUBJECT),
				anyString(), anyString());
	}
}
