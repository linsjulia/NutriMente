package br.com.nutrimente.api.common;

/**
 * Lê só a "orientação" (tag 0x0112) do EXIF de um JPEG: 1 = normal, 6 = girar
 * 90° no sentido horário etc. O celular grava a foto sempre na mesma posição
 * do sensor e só anota esse número; quem mostra a foto é que gira. Como o
 * ImageResizer regrava a imagem sem EXIF, ele precisa aplicar a rotação antes.
 *
 * Qualquer coisa fora do esperado (não é JPEG, sem EXIF, arquivo cortado)
 * devolve 1: a foto fica como veio, nunca dá erro.
 */
final class ExifOrientation {

	private static final int NORMAL = 1;

	private ExifOrientation() {
	}

	static int of(byte[] b) {
		try {
			return read(b);
		} catch (RuntimeException e) {
			return NORMAL;
		}
	}

	private static int read(byte[] b) {
		if (b.length < 4 || u8(b, 0) != 0xFF || u8(b, 1) != 0xD8) {
			return NORMAL;
		}
		int pos = 2;
		while (pos + 4 <= b.length && u8(b, pos) == 0xFF) {
			int marker = u8(b, pos + 1);
			int length = (u8(b, pos + 2) << 8) | u8(b, pos + 3);
			if (marker == 0xDA || marker == 0xD9) {
				return NORMAL; // começou a imagem: não tem EXIF antes
			}
			int data = pos + 4;
			if (marker == 0xE1 && length >= 8 && data + 6 <= b.length
					&& b[data] == 'E' && b[data + 1] == 'x' && b[data + 2] == 'i' && b[data + 3] == 'f'
					&& b[data + 4] == 0 && b[data + 5] == 0) {
				return fromTiff(b, data + 6);
			}
			pos += 2 + length;
		}
		return NORMAL;
	}

	/** Cabeçalho TIFF: "II" (little-endian) ou "MM" (big-endian), depois o 1º diretório (IFD0) */
	private static int fromTiff(byte[] b, int tiff) {
		boolean little = b[tiff] == 'I' && b[tiff + 1] == 'I';
		if (!little && !(b[tiff] == 'M' && b[tiff + 1] == 'M')) {
			return NORMAL;
		}
		int ifd = tiff + (int) u32(b, tiff + 4, little);
		int entries = u16(b, ifd, little);
		for (int i = 0; i < entries; i++) {
			int entry = ifd + 2 + i * 12;
			if (u16(b, entry, little) == 0x0112) {
				int value = u16(b, entry + 8, little);
				return value >= 1 && value <= 8 ? value : NORMAL;
			}
		}
		return NORMAL;
	}

	private static int u8(byte[] b, int i) {
		return b[i] & 0xFF;
	}

	private static int u16(byte[] b, int i, boolean little) {
		return little ? u8(b, i) | (u8(b, i + 1) << 8) : (u8(b, i) << 8) | u8(b, i + 1);
	}

	private static long u32(byte[] b, int i, boolean little) {
		return little
				? (u8(b, i) | (u8(b, i + 1) << 8) | (u8(b, i + 2) << 16) | ((long) u8(b, i + 3) << 24))
				: (((long) u8(b, i) << 24) | (u8(b, i + 1) << 16) | (u8(b, i + 2) << 8) | u8(b, i + 3));
	}
}
