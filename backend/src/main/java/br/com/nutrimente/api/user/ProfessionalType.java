package br.com.nutrimente.api.user;

/**
 * Profissões atendidas. Cada uma tem seu conselho de classe:
 * nutricionista -> CRN, psicólogo -> CRP.
 */
public enum ProfessionalType {
	NUTRICIONISTA("CRN"),
	PSICOLOGO("CRP");

	private final String council;

	ProfessionalType(String council) {
		this.council = council;
	}

	/** Sigla do conselho, usada nas mensagens de erro */
	public String council() {
		return council;
	}
}
