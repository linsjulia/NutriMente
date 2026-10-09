package br.com.nutrimente.api.user;

import java.time.LocalDate;

import org.springframework.stereotype.Component;

import br.com.nutrimente.api.record.RecordCipher;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Como o EncryptedStringConverter, para datas: a data vira texto
 * "AAAA-MM-DD" e é cifrada. Na leitura, aceita também o valor antigo aberto
 * ("1990-05-10"), que a V007 deixou ao transformar a coluna DATE em texto.
 */
@Component
@Converter
public class EncryptedDateConverter implements AttributeConverter<LocalDate, String> {

	private final RecordCipher cipher;

	public EncryptedDateConverter(RecordCipher cipher) {
		this.cipher = cipher;
	}

	@Override
	public String convertToDatabaseColumn(LocalDate date) {
		return date == null ? null : cipher.encrypt(date.toString());
	}

	@Override
	public LocalDate convertToEntityAttribute(String stored) {
		String plain = cipher.decryptOrPlain(stored);
		return plain == null ? null : LocalDate.parse(plain.strip());
	}
}
