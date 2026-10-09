package br.com.nutrimente.api.meal;

import java.util.Optional;

/**
 * Descobre o tipo da imagem pelos primeiros bytes do arquivo (a "assinatura"),
 * e NÃO pelo nome ou pelo Content-Type enviado: esses a pessoa escolhe e pode
 * mentir (ex.: um .exe chamado foto.jpg). Só aceitamos JPEG, PNG e WebP.
 */
final class ImageType {

	private ImageType() {
	}

	static Optional<String> detect(byte[] b) {
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
