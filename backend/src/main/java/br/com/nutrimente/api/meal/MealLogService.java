package br.com.nutrimente.api.meal;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import br.com.nutrimente.api.appointment.AppointmentRepository;
import br.com.nutrimente.api.appointment.AppointmentStatus;
import br.com.nutrimente.api.common.AfterCommit;
import br.com.nutrimente.api.common.ApiException;
import br.com.nutrimente.api.common.Digits;
import br.com.nutrimente.api.logging.LogClient;
import br.com.nutrimente.api.meal.MealLog.MealType;
import br.com.nutrimente.api.professional.ProfessionalController.PageResponse;
import br.com.nutrimente.api.record.RecordCipher;
import br.com.nutrimente.api.user.PatientRepository;

/**
 * Diário alimentar.
 *
 * Regras:
 * - o PACIENTE registra, edita e apaga as próprias refeições (até 60 dias
 *   para trás, nada no futuro) e pode anexar uma foto por refeição;
 * - o PROFISSIONAL que atende o paciente (AppointmentStatus.LINKING) lê o
 *   diário e as fotos; para os outros, ele "não existe" (404). A leitura
 *   do diário vai para a auditoria;
 * - textos cifrados (RecordCipher); fotos cifradas em arquivo (PhotoStorage).
 *   Arquivos só são apagados DEPOIS do commit: se a transação falhar, a
 *   foto antiga continua lá.
 */
@Service
public class MealLogService {

	static final Duration MAX_AGE = Duration.ofDays(60);
	private static final Duration FUTURE_TOLERANCE = Duration.ofMinutes(10);
	private static final int MAX_PAGE_SIZE = 50;

	private final MealLogRepository meals;
	private final PatientRepository patients;
	private final AppointmentRepository appointments;
	private final RecordCipher cipher;
	private final PhotoStorage photos;
	private final LogClient logClient;

	public MealLogService(MealLogRepository meals, PatientRepository patients, AppointmentRepository appointments,
			RecordCipher cipher, PhotoStorage photos, LogClient logClient) {
		this.meals = meals;
		this.patients = patients;
		this.appointments = appointments;
		this.cipher = cipher;
		this.photos = photos;
		this.logClient = logClient;
	}

	// ---------------- Paciente ----------------

	@Transactional(readOnly = true)
	public PageResponse<MealResponse> mine(Long patientId, int page, int size) {
		return page(patientId, page, size);
	}

	@Transactional
	public MealResponse create(Long patientId, MealRequest request) {
		if (!patients.existsById(patientId)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Só pacientes registram refeições.");
		}
		MealLog meal = new MealLog(patientId);
		fill(meal, request);
		meal = meals.saveAndFlush(meal);
		audit(patientId, "CREATE", meal.getId());
		return toResponse(meal);
	}

	@Transactional
	public MealResponse update(Long patientId, Long id, MealRequest request) {
		MealLog meal = own(patientId, id);
		fill(meal, request);
		meals.flush();
		audit(patientId, "UPDATE", id);
		return toResponse(meal);
	}

	@Transactional
	public void delete(Long patientId, Long id) {
		MealLog meal = own(patientId, id);
		String photo = meal.getPhotoFile();
		meals.delete(meal);
		audit(patientId, "DELETE", id);
		AfterCommit.run(() -> photos.delete(photo));
	}

	@Transactional
	public MealResponse attachPhoto(Long patientId, Long id, MultipartFile file) {
		MealLog meal = own(patientId, id);
		if (file == null || file.isEmpty()) {
			throw photoError("Escolha uma foto");
		}
		byte[] bytes;
		try {
			bytes = file.getBytes();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
		String contentType = ImageType.detect(bytes)
				.orElseThrow(() -> photoError("Envie uma foto em JPG, PNG ou WebP"));
		String old = meal.getPhotoFile();
		String saved = photos.save(bytes);
		meal.attachPhoto(saved, contentType);
		meals.flush();
		// Se a transação falhar, o arquivo novo é que sobra (e o antigo continua valendo)
		AfterCommit.run(() -> photos.delete(old));
		audit(patientId, "UPDATE", id);
		return toResponse(meal);
	}

	@Transactional
	public MealResponse removePhoto(Long patientId, Long id) {
		MealLog meal = own(patientId, id);
		String old = meal.getPhotoFile();
		meal.removePhoto();
		meals.flush();
		AfterCommit.run(() -> photos.delete(old));
		return toResponse(meal);
	}

	/** Exclusão de conta (LGPD): o diário é do paciente e some com ele, fotos incluídas */
	@Transactional
	public void deleteAllOf(Long patientId) {
		List<MealLog> all = meals.findByPatientId(patientId);
		List<String> files = all.stream().map(m -> m.getPhotoFile()).filter(f -> f != null).toList();
		meals.deleteAll(all);
		AfterCommit.run(() -> files.forEach(photos::delete));
	}

	// ---------------- Profissional ----------------

	@Transactional(readOnly = true)
	public PageResponse<MealResponse> ofPatient(Long professionalId, Long patientId, int page, int size) {
		requireLinked(professionalId, patientId);
		AfterCommit.run(() -> logClient.audit(professionalId, "PROFESSIONAL", "READ", "meal_logs", patientId,
				patientId));
		return page(patientId, page, size);
	}

	// ---------------- Foto (dono ou profissional) ----------------

	@Transactional(readOnly = true)
	public Photo photo(Long userId, Long id) {
		MealLog meal = meals.findById(id)
				.filter(m -> m.getPatientId().equals(userId)
						|| appointments.linked(m.getPatientId(), userId, AppointmentStatus.LINKING))
				.filter(m -> m.getPhotoFile() != null)
				.orElseThrow(() -> ApiException.notFound("Foto não encontrada."));
		return new Photo(photos.read(meal.getPhotoFile()), meal.getPhotoContentType());
	}

	// ---------------- Regras compartilhadas ----------------

	private PageResponse<MealResponse> page(Long patientId, int page, int size) {
		PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.clamp(size, 1, MAX_PAGE_SIZE));
		return PageResponse.of(meals.findByPatientIdOrderByEatenAtDescIdDesc(patientId, pageable).map(this::toResponse));
	}

	private void requireLinked(Long professionalId, Long patientId) {
		if (!appointments.linked(patientId, professionalId, AppointmentStatus.LINKING)) {
			throw ApiException.notFound("Paciente não encontrado.");
		}
	}

	private MealLog own(Long patientId, Long id) {
		return meals.findByIdAndPatientId(id, patientId)
				.orElseThrow(() -> ApiException.notFound("Refeição não encontrada."));
	}

	private void fill(MealLog meal, MealRequest request) {
		Instant now = Instant.now();
		if (request.eatenAt().isAfter(now.plus(FUTURE_TOLERANCE))) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Revise os campos destacados.",
					Map.of("eatenAt", "A refeição não pode estar no futuro"));
		}
		if (request.eatenAt().isBefore(now.minus(MAX_AGE))) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Revise os campos destacados.",
					Map.of("eatenAt", "Registre refeições dos últimos 60 dias"));
		}
		meal.fill(LocalDateTime.ofInstant(request.eatenAt(), ZoneOffset.UTC).withNano(0), request.mealType(),
				cipher.encrypt(request.description().strip()), cipher.encrypt(Digits.trimToNull(request.notes())),
				request.hungerLevel(), request.satisfactionLevel());
	}

	private void audit(Long patientId, String action, Long mealId) {
		AfterCommit.run(() -> logClient.audit(patientId, "PATIENT", action, "meal_logs", mealId, patientId));
	}

	private static ApiException photoError(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "INVALID_PHOTO", message, Map.of("photo", message));
	}

	private MealResponse toResponse(MealLog m) {
		boolean hasPhoto = m.getPhotoFile() != null;
		return new MealResponse(m.getId(), m.getEatenAt().toInstant(ZoneOffset.UTC), m.getMealType(),
				cipher.decrypt(m.getDescription()), cipher.decrypt(m.getNotes()), m.getHungerLevel(),
				m.getSatisfactionLevel(), hasPhoto ? "/api/meals/" + m.getId() + "/photo" : null,
				m.getCreatedAt().toInstant(ZoneOffset.UTC), m.getUpdatedAt().toInstant(ZoneOffset.UTC));
	}

	public record Photo(byte[] bytes, String contentType) {
	}

	/** Os campos e as validações ficam no MealController.MealForm */
	public record MealRequest(Instant eatenAt, MealType mealType, String description, String notes,
			Integer hungerLevel, Integer satisfactionLevel) {
	}

	public record MealResponse(
			Long id,
			Instant eatenAt,
			MealType mealType,
			String description,
			String notes,
			Integer hungerLevel,
			Integer satisfactionLevel,
			/** Rota da foto (exige login), ou null sem foto */
			String photoUrl,
			Instant createdAt,
			Instant updatedAt) {
	}
}
