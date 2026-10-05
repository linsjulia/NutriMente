package br.com.nutrimente.api.common;

import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * Executa algo só DEPOIS que a transação do banco for confirmada (commit).
 *
 * Por quê? Se o e-mail de confirmação saísse antes do commit e o cadastro
 * falhasse logo depois, a pessoa receberia um link para uma conta que não
 * existe. Com isso, e-mail e log só saem se os dados foram mesmo gravados.
 */
public final class AfterCommit {

	private AfterCommit() {
	}

	public static void run(Runnable action) {
		if (!TransactionSynchronizationManager.isSynchronizationActive()) {
			action.run();
			return;
		}
		TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
			@Override
			public void afterCommit() {
				action.run();
			}
		});
	}
}
