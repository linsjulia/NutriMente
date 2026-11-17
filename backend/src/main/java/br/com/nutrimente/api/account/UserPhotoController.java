package br.com.nutrimente.api.account;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Foto de perfil enviada pelo usuário. A rota é aberta no SecurityConfig
 * (profissional aprovado tem foto pública), mas quem decide o resto é o
 * UserPhotoService: com token, {@code jwt} vem preenchido; sem token, null.
 */
@RestController
public class UserPhotoController {

	private final UserPhotoService userPhotos;

	public UserPhotoController(UserPhotoService userPhotos) {
		this.userPhotos = userPhotos;
	}

	@GetMapping("/api/users/{id}/photo")
	public ResponseEntity<byte[]> userPhoto(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
		return userPhotos.photo(id, jwt);
	}
}
