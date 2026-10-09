package br.com.nutrimente.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Regras de segurança: quem pode acessar o quê.
 *
 * Fluxo de uma requisição autenticada:
 * 1. O front manda o header "Authorization: Bearer <token>".
 * 2. O Spring confere a assinatura e a validade do JWT (jwtDecoder) e se a
 *    sessão ainda vale: conta ativa e senha não trocada (SessionValidator).
 * 3. A claim "role" vira a permissão ROLE_PATIENT / ROLE_PROFESSIONAL / ROLE_ADMIN.
 * 4. As regras abaixo (e os @PreAuthorize nos controllers) liberam ou barram.
 */
@Configuration
@EnableMethodSecurity // habilita @PreAuthorize("hasRole('ADMIN')") nos controllers
public class SecurityConfig {

	@Bean
	SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
		http
				// API sem cookies de sessão: cada requisição traz o token.
				// Sem cookie, não existe ataque CSRF, então ele fica desligado.
				.csrf(csrf -> csrf.disable())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						// Rotas públicas
						.requestMatchers("/api/auth/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/professionals/**").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/specialties").permitAll()
						.requestMatchers("/actuator/health/**").permitAll()
						.requestMatchers("/error").permitAll()
						// Área administrativa: só ADMIN
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						// Todo o resto exige login
						.anyRequest().authenticated())
				.oauth2ResourceServer(oauth -> oauth
						.jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
						// Token ausente/inválido -> 401 em JSON, com "code" (UNAUTHORIZED ou SESSION_INVALID)
						.authenticationEntryPoint(new JsonAuthenticationEntryPoint()));
		return http.build();
	}

	/** Lê a claim "role" do token e cria a permissão "ROLE_<role>" */
	@Bean
	JwtAuthenticationConverter jwtAuthenticationConverter() {
		JwtGrantedAuthoritiesConverter authorities = new JwtGrantedAuthoritiesConverter();
		authorities.setAuthoritiesClaimName("role");
		authorities.setAuthorityPrefix("ROLE_");
		JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
		converter.setJwtGrantedAuthoritiesConverter(authorities);
		return converter;
	}

	/** Confere assinatura, expiração, emissor e se a sessão ainda vale */
	@Bean
	JwtDecoder jwtDecoder(AppProperties properties, SessionValidator sessionValidator) {
		NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(JwtService.secretKey(properties))
				.macAlgorithm(JwtService.ALGORITHM)
				.build();
		decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
				JwtValidators.createDefaultWithIssuer(JwtService.ISSUER), sessionValidator));
		return decoder;
	}

	/** BCrypt: hash lento de propósito, para dificultar ataques de força bruta */
	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
