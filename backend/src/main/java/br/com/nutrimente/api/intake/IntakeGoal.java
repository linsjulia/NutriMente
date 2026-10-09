package br.com.nutrimente.api.intake;

/**
 * Objetivos que o paciente pode marcar no questionário inicial (de 1 a 4).
 * O texto em português fica no front; aqui vão só os códigos, que são
 * gravados no banco (patient_intakes.goals).
 */
public enum IntakeGoal {
	/** Emagrecer com saúde */
	EMAGRECER,
	/** Ganhar massa muscular */
	GANHAR_MASSA,
	/** Comer de forma mais equilibrada */
	ALIMENTACAO_SAUDAVEL,
	/** Melhorar a relação com a comida (compulsão, culpa, restrição) */
	RELACAO_COM_A_COMIDA,
	/** Lidar com ansiedade e estresse */
	ANSIEDADE,
	/** Dormir melhor */
	SONO,
	/** Ter mais energia no dia a dia */
	ENERGIA,
	/** Autoestima e imagem corporal */
	AUTOESTIMA
}
