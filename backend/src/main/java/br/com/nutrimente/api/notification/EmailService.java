package br.com.nutrimente.api.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import br.com.nutrimente.api.config.AppProperties;
import jakarta.mail.internet.MimeMessage;

/**
 * Envia os e-mails do sistema. Em desenvolvimento, todos caem no Mailpit
 * (http://localhost:8025), nenhum vai para a caixa de ninguém.
 *
 * @Async: o envio acontece em segundo plano, então o cadastro responde na
 * hora mesmo se o servidor de e-mail estiver lento.
 */
@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final JavaMailSender mailSender;
	private final AppProperties properties;

	public EmailService(JavaMailSender mailSender, AppProperties properties) {
		this.mailSender = mailSender;
		this.properties = properties;
	}

	@Async
	public void sendEmailVerification(String to, String name, String token) {
		String link = properties.frontendUrl() + "/verify-email?token=" + token;
		send(to, "Confirme seu e-mail no NutriMente", name,
				"Falta pouco! Confirme seu e-mail para ativar sua conta.",
				"Confirmar e-mail", link,
				"O link vale por 24 horas. Se você não criou uma conta no NutriMente, ignore este e-mail.");
	}

	@Async
	public void sendPasswordReset(String to, String name, String token) {
		String link = properties.frontendUrl() + "/reset-password?token=" + token;
		send(to, "Redefinição de senha do NutriMente", name,
				"Recebemos um pedido para redefinir a sua senha.",
				"Criar nova senha", link,
				"O link vale por 1 hora. Se não foi você, ignore este e-mail: sua senha continua a mesma.");
	}

	@Async
	public void sendProfessionalReviewed(String to, String name, boolean approved) {
		String link = properties.frontendUrl() + "/login";
		if (approved) {
			send(to, "Seu cadastro no NutriMente foi aprovado", name,
					"Boa notícia: seu registro profissional foi verificado e seu perfil já aparece para os pacientes.",
					"Acessar minha conta", link, "Complete seu perfil com uma bio e o valor da consulta.");
		} else {
			send(to, "Seu cadastro no NutriMente precisa de revisão", name,
					"Não conseguimos confirmar seu registro profissional com os dados informados.",
					"Acessar minha conta", link, "Confira o número do seu conselho ou fale com nossa equipe.");
		}
	}

	private void send(String to, String subject, String name, String intro, String button, String link, String footer) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(properties.mail().from());
			helper.setTo(to);
			helper.setSubject(subject);
			// Versão texto (leitores de e-mail simples) + versão HTML
			helper.setText(plainText(name, intro, link, footer), html(name, intro, button, link, footer));
			mailSender.send(message);
		} catch (Exception e) {
			log.error("Falha ao enviar e-mail '{}'", subject, e);
		}
	}

	private static String plainText(String name, String intro, String link, String footer) {
		return "Olá, " + name + "!\n\n" + intro + "\n\n" + link + "\n\n" + footer + "\n\nEquipe NutriMente";
	}

	/** HtmlUtils.htmlEscape evita que um nome como "<script>" vire código no e-mail */
	private static String html(String name, String intro, String button, String link, String footer) {
		return """
				<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#183245">
				  <h1 style="color:#004AAD;font-size:22px">NutriMente</h1>
				  <p>Olá, %s!</p>
				  <p>%s</p>
				  <p style="margin:28px 0">
				    <a href="%s" style="background:#004AAD;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">%s</a>
				  </p>
				  <p style="font-size:13px;color:#555">Se o botão não funcionar, copie e cole no navegador:<br>%s</p>
				  <p style="font-size:13px;color:#555">%s</p>
				</div>
				""".formatted(HtmlUtils.htmlEscape(name), intro, link, button, link, footer);
	}
}
