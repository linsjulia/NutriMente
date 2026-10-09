package br.com.nutrimente.api.intake;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientIntakeRepository extends JpaRepository<PatientIntake, Long> {
}
