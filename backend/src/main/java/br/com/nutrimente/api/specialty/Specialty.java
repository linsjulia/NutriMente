package br.com.nutrimente.api.specialty;

import br.com.nutrimente.api.user.ProfessionalType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Especialidade de uma profissão (ex.: "Nutrição Esportiva" para
 * nutricionistas, "Ansiedade" para psicólogos). Tabela "specialties".
 *
 * Cada especialidade pertence a UMA profissão: um psicólogo não pode
 * marcar "Nutrição Esportiva".
 */
@Entity
@Table(name = "specialties")
public class Specialty {

	/** IDENTITY = o próprio SQL Server gera o número (coluna IDENTITY) */
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer id;

	@Column(nullable = false, length = 100)
	private String name;

	@Enumerated(EnumType.STRING)
	@Column(name = "professional_type", nullable = false)
	private ProfessionalType type;

	protected Specialty() {
	}

	public Specialty(String name, ProfessionalType type) {
		this.name = name;
		this.type = type;
	}

	public Integer getId() {
		return id;
	}

	public String getName() {
		return name;
	}

	public ProfessionalType getType() {
		return type;
	}
}
