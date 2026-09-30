package br.com.nutrimente.api.common;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/** Único lugar que responde "que horas são?": sempre em UTC. */
public final class Clock {

	private Clock() {
	}

	public static LocalDateTime now() {
		return LocalDateTime.now(ZoneOffset.UTC);
	}
}
