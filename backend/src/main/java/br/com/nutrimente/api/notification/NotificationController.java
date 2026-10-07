package br.com.nutrimente.api.notification;

import java.util.Map;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.notification.NotificationService.NotificationView;
import br.com.nutrimente.api.professional.ProfessionalController.PageResponse;

/**
 * Notificações de quem está logado (qualquer papel).
 *
 * <pre>
 * GET  /api/notifications?page=0&size=20     minhas notificações, mais recentes primeiro
 * GET  /api/notifications/unread-count        { "count": 3 } (para o contador do sininho)
 * POST /api/notifications/{id}/read           marca uma como lida
 * POST /api/notifications/read-all            marca todas como lidas
 * </pre>
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

	private final NotificationService service;

	public NotificationController(NotificationService service) {
		this.service = service;
	}

	@GetMapping
	public PageResponse<NotificationView> list(@AuthenticationPrincipal Jwt jwt,
			@RequestParam(defaultValue = "0") int page,
			@RequestParam(defaultValue = "20") int size) {
		return service.list(CurrentUser.id(jwt), page, size);
	}

	@GetMapping("/unread-count")
	public Map<String, Long> unreadCount(@AuthenticationPrincipal Jwt jwt) {
		return Map.of("count", service.unreadCount(CurrentUser.id(jwt)));
	}

	@PostMapping("/{id}/read")
	public NotificationView read(@AuthenticationPrincipal Jwt jwt, @PathVariable Long id) {
		return service.markRead(CurrentUser.id(jwt), id);
	}

	@PostMapping("/read-all")
	public Map<String, Integer> readAll(@AuthenticationPrincipal Jwt jwt) {
		return Map.of("updated", service.markAllRead(CurrentUser.id(jwt)));
	}
}
