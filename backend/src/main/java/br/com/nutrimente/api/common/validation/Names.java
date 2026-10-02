package br.com.nutrimente.api.common.validation;

import java.util.Locale;
import java.util.Set;

/**
 * Padroniza a escrita de nomes: "pedro  DE souza" -> "Pedro de Souza".
 * Partículas (da, de, do, das, dos, e) ficam minúsculas, menos no começo.
 * Partes separadas por hífen ou apóstrofo também ganham maiúscula
 * ("ana-clara d'ávila" -> "Ana-Clara D'Ávila").
 */
public final class Names {

	private static final Set<String> PARTICLES = Set.of("da", "de", "do", "das", "dos", "e");
	private static final Locale PT_BR = Locale.of("pt", "BR");

	private Names() {
	}

	public static String normalize(String raw) {
		if (raw == null) {
			return null;
		}
		String[] words = raw.strip().replaceAll("\\s+", " ").toLowerCase(PT_BR).split(" ");
		StringBuilder result = new StringBuilder();
		for (int i = 0; i < words.length; i++) {
			String word = words[i];
			if (i > 0) {
				result.append(' ');
			}
			result.append(i > 0 && PARTICLES.contains(word) ? word : capitalizeParts(word));
		}
		return result.toString();
	}

	/** Maiúscula no começo e depois de hífen/apóstrofo */
	private static String capitalizeParts(String word) {
		StringBuilder out = new StringBuilder(word.length());
		boolean upperNext = true;
		for (char c : word.toCharArray()) {
			out.append(upperNext ? Character.toUpperCase(c) : c);
			upperNext = c == '-' || c == '\'' || c == '’';
		}
		return out.toString();
	}
}
