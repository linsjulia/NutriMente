package br.com.nutrimente.api.notification;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

	/** Mais recentes primeiro (índice ix_notifications_user) */
	Page<Notification> findByUserIdOrderByCreatedAtDescIdDesc(Long userId, Pageable pageable);

	/** Para o contador do sininho (índice filtrado ix_notifications_unread) */
	long countByUserIdAndReadAtIsNull(Long userId);

	/** Marca todas como lidas numa consulta só */
	@Modifying
	@Query("UPDATE Notification n SET n.readAt = :now WHERE n.userId = :userId AND n.readAt IS NULL")
	int markAllRead(@Param("userId") Long userId, @Param("now") LocalDateTime now);
}
