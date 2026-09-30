package br.com.nutrimente.api.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.com.nutrimente.api.common.Clock;
import br.com.nutrimente.api.user.User;

public interface UserTokenRepository extends JpaRepository<UserToken, Long> {

	/** JOIN FETCH: já traz o usuário junto, porque sempre vamos usá-lo */
	@Query("SELECT t FROM UserToken t JOIN FETCH t.user WHERE t.tokenHash = :hash AND t.purpose = :purpose")
	Optional<UserToken> findByHash(@Param("hash") String hash, @Param("purpose") TokenPurpose purpose);

	/**
	 * Invalida os tokens anteriores ainda não usados. Assim, ao pedir um novo
	 * e-mail, só o link mais recente funciona.
	 */
	@Modifying
	@Query("UPDATE UserToken t SET t.usedAt = :now WHERE t.user = :user AND t.purpose = :purpose AND t.usedAt IS NULL")
	void invalidateAll(@Param("user") User user, @Param("purpose") TokenPurpose purpose, @Param("now") java.time.LocalDateTime now);

	default void invalidateAll(User user, TokenPurpose purpose) {
		invalidateAll(user, purpose, Clock.now());
	}
}
