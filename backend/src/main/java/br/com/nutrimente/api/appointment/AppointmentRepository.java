package br.com.nutrimente.api.appointment;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Consultas. O id do paciente e do profissional é o MESMO id do usuário
 * (users.id), então "minhas consultas" é uma consulta só para os dois papéis.
 *
 * Os "JOIN FETCH" trazem paciente, profissional e os nomes na mesma consulta
 * ao banco (evita uma consulta extra por item da lista: problema "N+1").
 */
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

	/**
	 * Existe consulta do profissional que se SOBREPÕE ao intervalo?
	 * Dois intervalos se sobrepõem quando um começa antes de o outro terminar
	 * (e vice-versa). O índice único do banco só pega horário de início igual;
	 * esta regra pega também 13:00-13:50 contra 13:30-14:20.
	 */
	@Query("""
			SELECT COUNT(a) > 0 FROM Appointment a
			WHERE a.professional.id = :professionalId AND a.status IN :occupying
			  AND a.startsAt < :endsAt AND a.endsAt > :startsAt
			""")
	boolean professionalBusy(@Param("professionalId") Long professionalId, @Param("startsAt") LocalDateTime startsAt,
			@Param("endsAt") LocalDateTime endsAt, @Param("occupying") Collection<AppointmentStatus> occupying);

	/** Mesma regra para o paciente: ninguém fica em duas consultas ao mesmo tempo */
	@Query("""
			SELECT COUNT(a) > 0 FROM Appointment a
			WHERE a.patient.id = :patientId AND a.status IN :occupying
			  AND a.startsAt < :endsAt AND a.endsAt > :startsAt
			""")
	boolean patientBusy(@Param("patientId") Long patientId, @Param("startsAt") LocalDateTime startsAt,
			@Param("endsAt") LocalDateTime endsAt, @Param("occupying") Collection<AppointmentStatus> occupying);

	/** Consultas que ocupam a agenda do profissional num período (para calcular os horários livres) */
	@Query("""
			SELECT a FROM Appointment a
			WHERE a.professional.id = :professionalId AND a.status IN :occupying
			  AND a.startsAt < :to AND a.endsAt > :from
			""")
	List<Appointment> findOccupying(@Param("professionalId") Long professionalId, @Param("from") LocalDateTime from,
			@Param("to") LocalDateTime to, @Param("occupying") Collection<AppointmentStatus> occupying);

	/** Próximas consultas de quem está logado (paciente OU profissional), da mais próxima para a mais distante */
	@Query("""
			SELECT a FROM Appointment a
			  JOIN FETCH a.patient pa JOIN FETCH pa.user
			  JOIN FETCH a.professional pr JOIN FETCH pr.user
			WHERE (pa.id = :userId OR pr.id = :userId)
			  AND a.status IN :upcoming AND a.endsAt >= :now
			ORDER BY a.startsAt
			""")
	List<Appointment> findUpcoming(@Param("userId") Long userId, @Param("now") LocalDateTime now,
			@Param("upcoming") Collection<AppointmentStatus> upcoming, Pageable limit);

	/** Histórico: já passaram, foram canceladas ou remarcadas. Da mais recente para a mais antiga */
	@Query("""
			SELECT a FROM Appointment a
			  JOIN FETCH a.patient pa JOIN FETCH pa.user
			  JOIN FETCH a.professional pr JOIN FETCH pr.user
			WHERE (pa.id = :userId OR pr.id = :userId)
			  AND (a.status NOT IN :upcoming OR a.endsAt < :now)
			ORDER BY a.startsAt DESC
			""")
	List<Appointment> findPast(@Param("userId") Long userId, @Param("now") LocalDateTime now,
			@Param("upcoming") Collection<AppointmentStatus> upcoming, Pageable limit);

	@Query("""
			SELECT a FROM Appointment a
			  JOIN FETCH a.patient pa JOIN FETCH pa.user
			  JOIN FETCH a.professional pr JOIN FETCH pr.user
			WHERE a.id = :id
			""")
	Optional<Appointment> findWithPeople(@Param("id") Long id);

	/** O paciente tem (ou teve) consulta com este profissional? Usado no plano de ação */
	@Query("""
			SELECT COUNT(a) > 0 FROM Appointment a
			WHERE a.patient.id = :patientId AND a.professional.id = :professionalId AND a.status IN :statuses
			""")
	boolean linked(@Param("patientId") Long patientId, @Param("professionalId") Long professionalId,
			@Param("statuses") Collection<AppointmentStatus> statuses);

	/** Consultas do profissional (mais recentes primeiro), para montar a lista "meus pacientes" */
	@Query("""
			SELECT a FROM Appointment a JOIN FETCH a.patient pa JOIN FETCH pa.user
			WHERE a.professional.id = :professionalId AND a.status IN :statuses
			ORDER BY a.startsAt DESC
			""")
	List<Appointment> findOfProfessional(@Param("professionalId") Long professionalId,
			@Param("statuses") Collection<AppointmentStatus> statuses);
}
