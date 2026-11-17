package br.com.nutrimente.api.common;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.util.zip.CRC32;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ImageResizerTest {

	@Test
	@DisplayName("foto grande vira JPEG com no máximo 512 px no lado maior, sem distorcer")
	void shrinksKeepingProportion() {
		byte[] out = ImageResizer.fit(TestImages.png(3000, 2000), ImageResizer.PROFILE_SIDE);
		assertThat(FileType.image(out)).contains("image/jpeg");
		BufferedImage image = TestImages.decode(out);
		assertThat(image.getWidth()).isEqualTo(512);
		assertThat(image.getHeight()).isEqualTo(341);
		// As cores continuam nos lugares certos (esquerda vermelha, direita azul)
		assertThat(red(image.getRGB(50, 170))).isGreaterThan(200);
		assertThat(blue(image.getRGB(460, 170))).isGreaterThan(200);
	}

	@Test
	@DisplayName("foto pequena não é ampliada; transparência vira fundo branco")
	void smallImageIsNotEnlarged() {
		BufferedImage image = TestImages.decode(ImageResizer.fit(TestImages.png(100, 80), 512));
		assertThat(image.getWidth()).isEqualTo(100);
		assertThat(image.getHeight()).isEqualTo(80);
	}

	@Test
	@DisplayName("orientação EXIF 6 (celular em pé): a foto sai girada 90°")
	void appliesExifOrientation() {
		byte[] withExif = withOrientation(TestImages.jpeg(400, 200), 6);
		assertThat(ExifOrientation.of(withExif)).isEqualTo(6);
		BufferedImage image = TestImages.decode(ImageResizer.fit(withExif, 512));
		assertThat(image.getWidth()).isEqualTo(200);
		assertThat(image.getHeight()).isEqualTo(400);
		// e o EXIF foi descartado
		assertThat(ExifOrientation.of(ImageResizer.fit(withExif, 512))).isEqualTo(1);
	}

	@Test
	@DisplayName("WebP (lido pelo plugin TwelveMonkeys) também vira JPEG reduzido")
	void readsWebp() throws Exception {
		byte[] webp;
		try (var in = getClass().getResourceAsStream("/images/exemplo.webp")) {
			webp = in.readAllBytes();
		}
		assertThat(FileType.image(webp)).contains("image/webp");
		byte[] out = ImageResizer.fit(webp, 256);
		assertThat(FileType.image(out)).contains("image/jpeg");
		BufferedImage image = TestImages.decode(out);
		assertThat(Math.max(image.getWidth(), image.getHeight())).isLessThanOrEqualTo(256);
	}

	@Test
	@DisplayName("arquivo que não abre como imagem e imagem gigante são recusados")
	void rejectsBrokenAndHugeImages() {
		byte[] fake = { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 1, 2, 3, 4 };
		assertThatThrownBy(() -> ImageResizer.fit(fake, 512)).isInstanceOf(ApiException.class)
				.hasMessageContaining("Não foi possível abrir a imagem");
		assertThatThrownBy(() -> ImageResizer.fit(pngHeaderClaiming(50_000, 50_000), 512))
				.isInstanceOf(ApiException.class).hasMessageContaining("40 megapixels");
	}

	private static int red(int rgb) {
		return (rgb >> 16) & 0xFF;
	}

	private static int blue(int rgb) {
		return rgb & 0xFF;
	}

	/** Põe um segmento APP1/EXIF (big-endian, só a tag de orientação) logo depois do SOI */
	private static byte[] withOrientation(byte[] jpeg, int orientation) {
		ByteBuffer tiff = ByteBuffer.allocate(26);
		tiff.put((byte) 'M').put((byte) 'M').putShort((short) 42).putInt(8); // cabeçalho, IFD0 no byte 8
		tiff.putShort((short) 1); // 1 entrada
		tiff.putShort((short) 0x0112).putShort((short) 3).putInt(1).putShort((short) orientation).putShort((short) 0);
		tiff.putInt(0); // sem próximo IFD
		byte[] exif = new byte[6 + tiff.capacity()];
		System.arraycopy(new byte[] { 'E', 'x', 'i', 'f', 0, 0 }, 0, exif, 0, 6);
		System.arraycopy(tiff.array(), 0, exif, 6, tiff.capacity());
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		out.write(jpeg, 0, 2); // SOI
		out.write(0xFF);
		out.write(0xE1);
		int length = exif.length + 2;
		out.write(length >> 8);
		out.write(length & 0xFF);
		out.writeBytes(exif);
		out.write(jpeg, 2, jpeg.length - 2);
		return out.toByteArray();
	}

	/** Só a assinatura e o IHDR de um PNG que diz ter w x h (um arquivo minúsculo) */
	private static byte[] pngHeaderClaiming(int w, int h) {
		ByteBuffer ihdr = ByteBuffer.allocate(17);
		ihdr.put(new byte[] { 'I', 'H', 'D', 'R' }).putInt(w).putInt(h)
				.put((byte) 8).put((byte) 2).put((byte) 0).put((byte) 0).put((byte) 0);
		CRC32 crc = new CRC32();
		crc.update(ihdr.array());
		ByteBuffer png = ByteBuffer.allocate(8 + 4 + 17 + 4);
		png.put(new byte[] { (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A });
		png.putInt(13).put(ihdr.array()).putInt((int) crc.getValue());
		return png.array();
	}
}
