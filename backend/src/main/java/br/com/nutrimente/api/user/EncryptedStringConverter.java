package br.com.nutrimente.api.user;

import org.springframework.stereotype.Component;

import br.com.nutrimente.api.record.RecordCipher;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Cifra um texto ao gravar no banco e decifra ao ler, sem o resto do código
 * perceber: User.getCpf() devolve "52998224725", mas a coluna guarda "v1:...".
 *
 * Usado com @Convert(converter = EncryptedStringConverter.class) no campo.
 * É um @Component porque o Spring Boot entrega ao Hibernate conversores
 * criados pelo Spring, já com o RecordCipher injetado.
 *
 * Valores antigos (gravados antes da V007, ainda abertos) são lidos como
 * estão; o LegacyPersonalDataEncryptor os cifra quando a API liga.
 */
@Component
@Converter
public class EncryptedStringConverter implements AttributeConverter<String, String> {

	private final RecordCipher cipher;

	public EncryptedStringConverter(RecordCipher cipher) {
		this.cipher = cipher;
	}

	@Override
	public String convertToDatabaseColumn(String value) {
		return cipher.encrypt(value);
	}

	@Override
	public String convertToEntityAttribute(String stored) {
		return cipher.decryptOrPlain(stored);
	}
}
