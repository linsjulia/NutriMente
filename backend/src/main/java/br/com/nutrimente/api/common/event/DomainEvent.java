package br.com.nutrimente.api.common.event;

/**
 * Observer Pattern: marcador selado para todos os eventos de domínio.
 *
 * Cada evento é um record imutável que descreve algo que ACONTECEU no sistema.
 * Os listeners reagem ao evento sem que o serviço que o publicou precise
 * conhecê-los (desacoplamento).
 */
public sealed interface DomainEvent
		permits ProfessionalVerifiedEvent, TelehealthRevokedEvent, PlanCreatedEvent,
				UserRegisteredEvent, PasswordResetRequestedEvent,
				AppointmentBookedEvent, AppointmentCancelledEvent, AppointmentConfirmedEvent,
				AppointmentRescheduledEvent, AppointmentCompletedEvent {
}
