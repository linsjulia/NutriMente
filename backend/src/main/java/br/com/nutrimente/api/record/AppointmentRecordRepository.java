package br.com.nutrimente.api.record;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppointmentRecordRepository extends JpaRepository<AppointmentRecord, Long> {

	Optional<AppointmentRecord> findByAppointmentId(Long appointmentId);
}
