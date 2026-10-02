package br.com.nutrimente.api.config;

import java.util.Locale;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.user.Role;
import br.com.nutrimente.api.user.User;
import br.com.nutrimente.api.user.UserRepository;

/**
 * Cria o primeiro administrador quando a API liga, usando ADMIN_EMAIL e
 * ADMIN_PASSWORD do .env. Se o e-mail já existir, não faz nada.
 *
 * Por que não no script SQL? A senha precisa virar hash BCrypt, e isso é
 * feito pelo Java. Também evita deixar uma senha fixa escrita no repositório.
 */
@Component
public class AdminSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

	private final UserRepository users;
	private final PasswordEncoder passwordEncoder;
	private final AppProperties properties;

	public AdminSeeder(UserRepository users, PasswordEncoder passwordEncoder, AppProperties properties) {
		this.users = users;
		this.passwordEncoder = passwordEncoder;
		this.properties = properties;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		String email = properties.admin().email();
		String password = properties.admin().password();
		if (email == null || email.isBlank() || password == null || password.isBlank()) {
			log.info("ADMIN_EMAIL/ADMIN_PASSWORD não configurados: nenhum administrador criado.");
			return;
		}
		String normalized = email.strip().toLowerCase(Locale.ROOT);
		if (users.existsByEmail(normalized)) {
			return;
		}
		User admin = new User("Administrador", normalized, passwordEncoder.encode(password), Role.ADMIN);
		admin.verifyEmail();
		users.save(admin);
		log.info("Administrador {} criado.", normalized);
	}
}
