package br.com.nutrimente.api.config;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Limite de requisições por IP nas rotas de autenticação (POST /api/auth/**).
 *
 * Por que, se já existe o bloqueio após 5 senhas erradas? Aquele bloqueio é
 * POR CONTA. Um robô pode testar 1 senha em cada uma de milhares de contas
 * (ataque de "credential stuffing") sem nunca bloquear nenhuma. O limite por
 * IP freia isso, e também cadastros em massa e spam de e-mails.
 *
 * Como funciona ("janela fixa"): cada IP tem um contador que zera a cada
 * minuto. Passou do limite -> resposta 429 (Too Many Requests) com o header
 * Retry-After dizendo quantos segundos esperar.
 *
 * Limitação conhecida: o contador fica na memória desta instância. Se a API
 * rodar em várias cópias, cada uma conta separado (aí o ideal é Redis).
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

	private static final Duration WINDOW = Duration.ofMinutes(1);
	/** Evita que a memória cresça sem fim com IPs diferentes */
	private static final int MAX_TRACKED_IPS = 10_000;

	private final int limit;
	private final Map<String, Window> windows = new ConcurrentHashMap<>();

	public AuthRateLimitFilter(AppProperties properties) {
		this.limit = properties.rateLimit().authRequestsPerMinute();
	}

	@Override
	protected boolean shouldNotFilter(HttpServletRequest request) {
		return !("POST".equals(request.getMethod()) && request.getRequestURI().startsWith("/api/auth/"));
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		long now = System.currentTimeMillis();
		if (windows.size() > MAX_TRACKED_IPS) {
			windows.values().removeIf(window -> window.isExpired(now));
		}

		// getRemoteAddr() já é o IP real (ver server.forward-headers-strategy).
		// "_" = parâmetro que não usamos (a chave, o IP); recurso do Java 22+.
		Window window = windows.compute(request.getRemoteAddr(),
				(_, current) -> current == null || current.isExpired(now) ? new Window(now) : current.increment());

		if (window.count > limit) {
			long retryAfterSeconds = Math.max(1, (window.start + WINDOW.toMillis() - now) / 1000);
			response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
			response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
			response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
			response.setCharacterEncoding("UTF-8");
			// Mesmo formato dos outros erros da API (RFC 9457)
			response.getWriter().write("""
					{"status":429,"code":"RATE_LIMITED","detail":"Muitas tentativas seguidas. Aguarde %d segundos e tente de novo."}"""
					.formatted(retryAfterSeconds));
			return;
		}
		chain.doFilter(request, response);
	}

	/** Contador de um IP dentro do minuto atual (imutável: seguro entre threads) */
	private record Window(long start, int count) {

		Window(long start) {
			this(start, 1);
		}

		Window increment() {
			return new Window(start, count + 1);
		}

		boolean isExpired(long now) {
			return now - start >= WINDOW.toMillis();
		}
	}
}
