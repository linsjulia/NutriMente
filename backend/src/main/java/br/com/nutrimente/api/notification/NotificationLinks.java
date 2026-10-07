package br.com.nutrimente.api.notification;

/**
 * Para onde cada notificação leva quando clicada (rotas do site).
 * Num lugar só: se o front mudar uma rota, basta ajustar aqui.
 */
public final class NotificationLinks {

	private NotificationLinks() {
	}

	public static String appointment(Long id) {
		return "/appointments/" + id;
	}

	public static String plan(Long id) {
		return "/plans/" + id;
	}

	/** Perfil público (onde aparecem as avaliações) */
	public static String professional(Long id) {
		return "/professionals/" + id;
	}

	public static String dashboard() {
		return "/dashboard";
	}
}
