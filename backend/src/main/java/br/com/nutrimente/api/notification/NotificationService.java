package br.com.nutrimente.api.notification;

import java.time.Instant;
import java.time.ZoneOffset;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.notification.Notification.Type;
import br.com.nutrimente.api.professional.ProfessionalController.PageResponse;

/**
 * Notificações do site ("sininho").
 *
 * Os outros serviços chamam notify(...) DENTRO da própria transação: se a
 * ação falhar (ex.: agendamento recusado), a notificação também não é
 * gravada. Nada de aviso de algo que não aconteceu.
 */
@Service
public class NotificationService {

	private static final int MAX_PAGE_SIZE = 50;

	private final NotificationRepository notifications;

	public NotificationService(NotificationRepository notifications) {
		this.notifications = notifications;
	}

	/** Cria um aviso para alguém (chamado pelos outros serviços) */
	@Transactional
	public void notify(Long userId, Type type, String title, String body, String linkUrl) {
		notifications.save(new Notification(userId, type, title, body, linkUrl));
	}

	@Transactional(readOnly = true)
	public PageResponse<NotificationView> list(Long userId, int page, int size) {
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
		return PageResponse.of(notifications.findByUserIdOrderByCreatedAtDescIdDesc(userId, pageable)
				.map(NotificationView::of));
	}

	@Transactional(readOnly = true)
	public long unreadCount(Long userId) {
		return notifications.countByUserIdAndReadAtIsNull(userId);
	}

	/** Marca uma como lida. A notificação de outra pessoa "não existe" (404) */
	@Transactional
	public NotificationView markRead(Long userId, Long id) {
		Notification notification = notifications.findById(id)
				.filter(n -> n.getUserId().equals(userId))
				.orElseThrow(() -> ApiException.notFound("Notificação não encontrada."));
		notification.markRead();
		return NotificationView.of(notification);
	}

	@Transactional
	public int markAllRead(Long userId) {
		return notifications.markAllRead(userId, Clock.now());
	}

	/** Uma notificação como a tela recebe */
	public record NotificationView(Long id, Type type, String title, String body, String linkUrl, boolean read,
			Instant createdAt) {

		static NotificationView of(Notification n) {
			return new NotificationView(n.getId(), n.getType(), n.getTitle(), n.getBody(), n.getLinkUrl(),
					n.getReadAt() != null, n.getCreatedAt().toInstant(ZoneOffset.UTC));
		}
	}
}
