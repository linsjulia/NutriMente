package br.com.nutrimente.api.common;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Map;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;

import org.springframework.http.HttpStatus;

/**
 * Deixa a foto enviada num tamanho adequado para a tela, antes de gravar.
 *
 * Uma foto de celular tem 3000-4000 px e vários MB; na tela ela aparece com
 * 40-600 px. Aqui a imagem é:
 * <ol>
 * <li>conferida: no máximo {@value #MAX_PIXELS} pixels (protege a memória
 * contra uma imagem pequena em bytes mas enorme ao abrir);</li>
 * <li>girada conforme a orientação EXIF (o celular grava a foto "deitada" e
 * só anota que é para girar);</li>
 * <li>reduzida para caber em {@code maxSide} x {@code maxSide}, sem distorcer
 * (fotos menores não são ampliadas);</li>
 * <li>gravada como JPEG, qualidade {@value #QUALITY}. Transparência (PNG/WebP)
 * vira fundo branco.</li>
 * </ol>
 * Regravar também descarta os metadados (EXIF), que podem ter a localização
 * GPS de onde a foto foi tirada.
 *
 * Lê JPEG, PNG e WebP (WebP pelo plugin TwelveMonkeys, registrado
 * automaticamente no ImageIO).
 */
public final class ImageResizer {

	public static final String CONTENT_TYPE = "image/jpeg";
	/** Lado maior da foto de perfil: aparece com até 128 px (x3 em tela de alta densidade) */
	public static final int PROFILE_SIDE = 512;
	/** Lado maior da foto do diário: aparece ampliada na ficha do paciente */
	public static final int MEAL_SIDE = 1600;

	static final long MAX_PIXELS = 40_000_000L;
	private static final float QUALITY = 0.85f;

	private ImageResizer() {
	}

	/** @return JPEG com no máximo maxSide px no lado maior ({@link #CONTENT_TYPE}) */
	public static byte[] fit(byte[] original, int maxSide) {
		BufferedImage image = read(original);
		image = applyOrientation(image, ExifOrientation.of(original));
		return writeJpeg(scale(image, maxSide));
	}

	private static BufferedImage read(byte[] bytes) {
		try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
			Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
			if (!readers.hasNext()) {
				throw invalid();
			}
			ImageReader reader = readers.next();
			try {
				reader.setInput(input, true, true);
				long pixels = (long) reader.getWidth(0) * reader.getHeight(0);
				if (pixels > MAX_PIXELS) {
					throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
							"A foto é grande demais. Use uma de até 40 megapixels.",
							Map.of("photo", "Use uma foto de até 40 megapixels"));
				}
				return reader.read(0);
			} finally {
				reader.dispose();
			}
		} catch (IOException | RuntimeException e) {
			if (e instanceof ApiException api) {
				throw api;
			}
			throw invalid();
		}
	}

	/** Ex.: orientação 6 = a câmera estava "em pé": gira 90° no sentido horário */
	static BufferedImage applyOrientation(BufferedImage image, int orientation) {
		if (orientation < 2 || orientation > 8) {
			return image;
		}
		int w = image.getWidth();
		int h = image.getHeight();
		boolean swap = orientation >= 5;
		AffineTransform t = new AffineTransform();
		switch (orientation) {
			case 2 -> { t.translate(w, 0); t.scale(-1, 1); }
			case 3 -> { t.translate(w, h); t.rotate(Math.PI); }
			case 4 -> { t.translate(0, h); t.scale(1, -1); }
			case 5 -> { t.rotate(-Math.PI / 2); t.scale(-1, 1); }
			case 6 -> { t.translate(h, 0); t.rotate(Math.PI / 2); }
			case 7 -> { t.scale(-1, 1); t.translate(-h, 0); t.translate(0, w); t.rotate(3 * Math.PI / 2); }
			case 8 -> { t.translate(0, w); t.rotate(3 * Math.PI / 2); }
			default -> { }
		}
		BufferedImage out = new BufferedImage(swap ? h : w, swap ? w : h, BufferedImage.TYPE_INT_ARGB);
		Graphics2D g = out.createGraphics();
		g.drawImage(image, t, null);
		g.dispose();
		return out;
	}

	/**
	 * Reduz pela metade várias vezes e depois até o tamanho final: com
	 * interpolação bilinear isso fica bem mais nítido que reduzir de uma vez.
	 */
	static BufferedImage scale(BufferedImage image, int maxSide) {
		int w = image.getWidth();
		int h = image.getHeight();
		double ratio = Math.min(1.0, (double) maxSide / Math.max(w, h));
		int targetW = Math.max(1, (int) Math.round(w * ratio));
		int targetH = Math.max(1, (int) Math.round(h * ratio));

		BufferedImage current = flatten(image);
		while (current.getWidth() / 2 >= targetW && current.getHeight() / 2 >= targetH) {
			current = draw(current, current.getWidth() / 2, current.getHeight() / 2);
		}
		if (current.getWidth() != targetW || current.getHeight() != targetH) {
			current = draw(current, targetW, targetH);
		}
		return current;
	}

	/** JPEG não tem transparência: pinta o fundo de branco */
	private static BufferedImage flatten(BufferedImage image) {
		if (image.getType() == BufferedImage.TYPE_INT_RGB) {
			return image;
		}
		BufferedImage rgb = new BufferedImage(image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
		Graphics2D g = rgb.createGraphics();
		g.setColor(Color.WHITE);
		g.fillRect(0, 0, rgb.getWidth(), rgb.getHeight());
		g.drawImage(image, 0, 0, null);
		g.dispose();
		return rgb;
	}

	private static BufferedImage draw(BufferedImage source, int w, int h) {
		BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
		Graphics2D g = out.createGraphics();
		g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
		g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
		g.drawImage(source, 0, 0, w, h, null);
		g.dispose();
		return out;
	}

	private static byte[] writeJpeg(BufferedImage image) {
		ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		try (ImageOutputStream output = ImageIO.createImageOutputStream(out)) {
			writer.setOutput(output);
			ImageWriteParam param = writer.getDefaultWriteParam();
			param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
			param.setCompressionQuality(QUALITY);
			writer.write(null, new IIOImage(image, null, null), param);
		} catch (IOException e) {
			throw new IllegalStateException("Não foi possível gravar a imagem", e);
		} finally {
			writer.dispose();
		}
		return out.toByteArray();
	}

	private static ApiException invalid() {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
				"Não foi possível abrir a imagem. Envie uma foto em JPG, PNG ou WebP.",
				Map.of("photo", "Não foi possível abrir a imagem"));
	}
}
