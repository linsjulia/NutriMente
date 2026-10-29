package br.com.nutrimente.api.professional;

import java.util.List;

import br.com.nutrimente.api.professional.ProfessionalSearchService.Filters;
import br.com.nutrimente.api.user.Professional;

/**
 * Strategy Pattern: filtro pós-consulta aplicado aos resultados da busca.
 *
 * A busca principal acontece no banco (JPQL). Filtros que dependem de dados
 * calculados em tempo real (ex.: disponibilidade na agenda) implementam esta
 * interface e são injetados automaticamente no serviço de busca.
 *
 * Para adicionar um novo filtro, basta criar um {@code @Component} que
 * implemente esta interface — sem alterar o serviço de busca.
 */
public interface SearchResultFilter {

	/** Retorna true se este filtro precisa rodar para os filtros escolhidos. */
	boolean supports(Filters filters);

	/** Filtra a lista de candidatos e retorna somente os que atendem ao critério. */
	List<Professional> apply(List<Professional> candidates, Filters filters);
}
