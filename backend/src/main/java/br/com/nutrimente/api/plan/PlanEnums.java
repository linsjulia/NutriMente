package br.com.nutrimente.api.plan;

/** Valores fixos do plano de ação (iguais às regras CHECK do banco). */
public final class PlanEnums {

	private PlanEnums() {
	}

	/** Situação do plano. O paciente só marca o checklist em plano ACTIVE */
	public enum PlanStatus {
		DRAFT, ACTIVE, PAUSED, COMPLETED, CANCELLED
	}

	/** Refeições do dia, na ordem em que acontecem */
	public enum MealType {
		CAFE_DA_MANHA("Café da manhã"),
		LANCHE_MANHA("Lanche da manhã"),
		ALMOCO("Almoço"),
		LANCHE_TARDE("Lanche da tarde"),
		JANTAR("Jantar"),
		CEIA("Ceia");

		private final String label;

		MealType(String label) {
			this.label = label;
		}

		/** Nome em português, pronto para a tela */
		public String label() {
			return label;
		}
	}

	/** De quanto em quanto tempo o item do checklist deve ser feito */
	public enum Frequency {
		/** Todo dia (ex.: "Beber 2 litros de água") */
		DAILY,
		/** Uma vez por semana (ex.: "Planejar as refeições da semana") */
		WEEKLY,
		/** Uma vez só (ex.: "Fazer exame de sangue") */
		ONCE
	}
}
