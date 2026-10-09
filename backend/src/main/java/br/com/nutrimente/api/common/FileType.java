package br.com.nutrimente.api.common;

import java.util.Optional;

/**
 * Descobre o tipo do arquivo pelos primeiros bytes (a "assinatura"), e NÃO
 * pelo nome ou pelo Content-Type enviado: esses a pessoa escolhe e pode
 * mentir (ex.: um .exe chamado foto.jpg). Reconhece JPEG, PNG, WebP e PDF.
 */
public final class FileType {

	public static final String PDF = "application/pdf";

	private FileType() {
	}

	/** Só imagens (JPEG, PNG, WebP) */
	public static Optional<String> image(byte[] b) {
		return detect(b).filter(type -> type.startsWith("image/"));
	}

	public static Optional<String> detect(byte[] b) {
		if (b.length >= 5 && b[0] == '%' && b[1] == 'P' && b[2] == 'D' && b[3] == 'F' && b[4] == '-') {
			return Optional.of(PDF);
		}
		if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
			return Optional.of("image/jpeg");
		}
		if (b.length >= 8 && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
				&& b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
			return Optional.of("image/png");
		}
		if (b.length >= 12 && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
				&& b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
			return Optional.of("image/webp");
		}
		return Optional.empty();
	}
}
