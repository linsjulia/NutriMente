package br.com.nutrimente.api.account;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UserPhotoController {

	private final AccountService accountService;

	public UserPhotoController(AccountService accountService) {
		this.accountService = accountService;
	}

	@GetMapping("/api/users/{id}/photo")
	public ResponseEntity<byte[]> userPhoto(@PathVariable Long id) {
		return accountService.userPhoto(id);
	}
}
