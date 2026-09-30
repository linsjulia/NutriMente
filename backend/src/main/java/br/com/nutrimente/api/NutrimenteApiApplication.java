package br.com.nutrimente.api;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Ponto de entrada da API.
 *
 * Organização das pastas (por funcionalidade, não por tipo de classe):
 * <pre>
 *   auth/          cadastro, login, confirmação de e-mail, redefinição de senha
 *   account/       "minha conta": ver, editar e excluir o próprio perfil
 *   professional/  lista pública de profissionais aprovados
 *   admin/         aprovação de profissionais (só ADMIN)
 *   user/          entidades de usuário, paciente e profissional
 *   notification/  envio de e-mails
 *   logging/       envio de logs para o serviço Node.js (MongoDB)
 *   common/        erros, validações e utilidades compartilhadas
 *   config/        segurança, JWT e configurações
 * </pre>
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync // permite rodar tarefas em segundo plano (envio de e-mail e de logs)
public class NutrimenteApiApplication {

	public static void main(String[] args) {
		// Toda data/hora da aplicação é tratada em UTC (o front converte para
		// o horário de Brasília na hora de exibir)
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		SpringApplication.run(NutrimenteApiApplication.class, args);
	}
}
