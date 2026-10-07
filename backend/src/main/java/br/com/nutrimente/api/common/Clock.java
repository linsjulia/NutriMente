package br.com.nutrimente.api.common;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

/**
 * Único lugar que responde "que horas são?": sempre em UTC e com precisão de
 * SEGUNDOS, a mesma das colunas DATETIME2(0) do banco. Assim a data que a API
 * devolve logo depois de gravar é igual à que volta numa leitura posterior
 * (sem frações de segundo que o banco descartaria).
 */
public final class Clock {

	private Clock() {
	}

	public static LocalDateTime now() {
		return LocalDateTime.now(ZoneOffset.UTC).truncatedTo(ChronoUnit.SECONDS);
	}
}
