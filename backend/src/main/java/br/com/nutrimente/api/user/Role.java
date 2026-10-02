package br.com.nutrimente.api.user;

/**
 * Papéis (roles) de quem usa o sistema. Cada um vê e pode fazer coisas
 * diferentes:
 * <ul>
 *   <li>PATIENT: cliente que procura atendimento</li>
 *   <li>PROFESSIONAL: nutricionista ou psicólogo; só aparece na busca depois
 *       de aprovado por um ADMIN</li>
 *   <li>ADMIN: equipe do NutriMente; aprova ou recusa profissionais</li>
 * </ul>
 * No Spring Security viram "ROLE_PATIENT", "ROLE_PROFESSIONAL" e "ROLE_ADMIN".
 */
public enum Role {
	PATIENT, PROFESSIONAL, ADMIN
}
