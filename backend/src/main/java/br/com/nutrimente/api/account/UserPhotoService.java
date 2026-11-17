package br.com.nutrimente.api.account;

import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;

import br.com.nutrimente.api.appointment.AppointmentRepository;
import br.com.nutrimente.api.appointment.AppointmentStatus;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.EncryptedFileStorage;
import br.com.nutrimente.api.config.CurrentUser;
import br.com.nutrimente.api.user.ProfessionalRepository;
import br.com.nutrimente.api.user.Role;
import br.com.nutrimente.api.user.User;
import br.com.nutrimente.api.user.UserRepository;
import br.com.nutrimente.api.user.VerificationStatus;

/**
 * Quem pode ver a foto de perfil enviada por um usuário (GET /api/users/{id}/photo).
 *
 * <ul>
 * <li>Profissional APROVADO e ativo: pública (aparece na busca e no perfil público).</li>
 * <li>Qualquer outro caso (paciente, profissional em análise ou recusado, admin):
 * só com login, e só para a própria pessoa, para um admin ou para quem tem
 * vínculo de atendimento com ela (paciente ↔ profissional, mesma regra do
 * prontuário e do diário). A foto de um paciente é dado pessoal (LGPD).</li>
 * </ul>
 *
 * Sem permissão a resposta é 404, igual a "não existe": não dá para descobrir
 * quais ids têm foto. Fotos privadas saem com "private, no-store" para nenhum
 * cache compartilhado (CDN, otimizador de imagens do Next) guardar uma cópia.
 */
@Service
public class UserPhotoService {

	private static final Duration PUBLIC_MAX_AGE = Duration.ofHours(1);

	private final UserRepository users;
	private final ProfessionalRepository professionals;
	private final AppointmentRepository appointments;
	private final EncryptedFileStorage photos;

	public UserPhotoService(UserRepository users, ProfessionalRepository professionals,
			AppointmentRepository appointments, EncryptedFileStorage photos) {
		this.users = users;
		this.professionals = professionals;
		this.appointments = appointments;
		this.photos = photos;
	}

	/** @param viewer token de quem pede, ou null se não estiver logado */
	@Transactional(readOnly = true)
	public ResponseEntity<byte[]> photo(Long userId, Jwt viewer) {
		User owner = users.findById(userId)
				// Conta excluída: anonymize() já apagou a foto (photo_file = NULL)
				.filter(u -> u.getPhotoFile() != null)
				.orElseThrow(this::notFound);

		boolean isPublic = isApprovedProfessional(owner);
		if (!isPublic && !canSee(owner, viewer)) {
			throw notFound();
		}

		CacheControl cache = isPublic
				? CacheControl.maxAge(PUBLIC_MAX_AGE).cachePublic()
				: CacheControl.noStore().cachePrivate();
		return ResponseEntity.ok()
				.contentType(MediaType.parseMediaType(owner.getPhotoContentType()))
				.cacheControl(cache)
				.header("X-Content-Type-Options", "nosniff")
				.body(photos.read(owner.getPhotoFile()));
	}

	private boolean isApprovedProfessional(User owner) {
		return owner.getRole() == Role.PROFESSIONAL && owner.isActive()
				&& professionals.findById(owner.getId())
						.map(p -> p.getVerificationStatus() == VerificationStatus.APPROVED)
						.orElse(false);
	}

	private boolean canSee(User owner, Jwt viewer) {
		if (viewer == null) {
			return false;
		}
		Long viewerId = CurrentUser.id(viewer);
		if (viewerId.equals(owner.getId()) || Role.ADMIN.name().equals(viewer.getClaimAsString("role"))) {
			return true;
		}
		return appointments.linked(owner.getId(), viewerId, AppointmentStatus.LINKING)
				|| appointments.linked(viewerId, owner.getId(), AppointmentStatus.LINKING);
	}

	private ApiException notFound() {
		return ApiException.notFound("Foto não encontrada.");
	}
}
