package br.com.nutrimente.api.user;

/**
 * Situação do cadastro do profissional:
 * PENDING (aguardando análise) -> APPROVED (aparece na busca) ou REJECTED.
 */
public enum VerificationStatus {
	PENDING, APPROVED, REJECTED
}
