// =============================================================
// Preferências de acessibilidade do NutriMente
//
// Opções disponíveis: TAMANHO DO TEXTO e ALTO CONTRASTE.
//
// COMO FUNCIONA (visão geral)
// 1. Cada opção vira um atributo "data-a11y-*" na tag <html>.
//    Ex.: <html data-a11y-contrast="high" data-a11y-font="2">.
// 2. O globals.css tem as regras de cada atributo (seção ACESSIBILIDADE).
//    O JavaScript só liga/desliga atributos; o CSS faz o visual.
// 3. As escolhas ficam salvas no localStorage do navegador.
// 4. Um script inline no <head> (ver app/layout.tsx) aplica as preferências
//    ANTES da página aparecer, para ela não "piscar" com o visual padrão.
// =============================================================

export type AccessibilityPreferences = {
  /** Nível do tamanho da fonte: índice de FONT_SCALES (0 = 100%) */
  fontLevel: number;
  /** Alto contraste: fundo preto, texto branco, links amarelos */
  highContrast: boolean;
};

/** Tamanhos de fonte disponíveis (multiplicam o tamanho base de 16px) */
export const FONT_SCALES = [1, 1.15, 1.3, 1.5] as const;

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontLevel: 0,
  highContrast: false,
};

/** Chave usada no localStorage */
export const STORAGE_KEY = "nutrimente:a11y";

/** Lê as preferências salvas. Qualquer problema -> volta ao padrão. */
export function loadPreferences(): AccessibilityPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES; // no servidor não existe localStorage
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    const fontLevel = Number(saved.fontLevel);
    return {
      // Valores fora da faixa (ex.: salvos por uma versão antiga) voltam ao padrão
      fontLevel: fontLevel >= 0 && fontLevel < FONT_SCALES.length ? fontLevel : 0,
      highContrast: saved.highContrast === true,
    };
  } catch {
    // localStorage bloqueado (modo privado, por exemplo) ou valor corrompido
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: AccessibilityPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Sem localStorage a preferência vale só até recarregar a página
  }
}

/** Aplica as preferências na tag <html>. Atributo ausente = opção desligada. */
export function applyPreferences(prefs: AccessibilityPreferences) {
  const html = document.documentElement;
  if (prefs.fontLevel > 0) html.setAttribute("data-a11y-font", String(prefs.fontLevel));
  else html.removeAttribute("data-a11y-font");
  if (prefs.highContrast) html.setAttribute("data-a11y-contrast", "high");
  else html.removeAttribute("data-a11y-contrast");
}

/**
 * Mesmo trabalho do applyPreferences, mas como TEXTO de um script que roda
 * direto no <head>, antes do React carregar. Precisa ser JavaScript puro e
 * autossuficiente (não pode importar nada). Se mudar os atributos acima,
 * mude aqui também.
 */
export const INLINE_APPLY_SCRIPT = `(function(){try{
var p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}"),h=document.documentElement;
if(p.fontLevel>0&&p.fontLevel<${FONT_SCALES.length})h.setAttribute("data-a11y-font",String(p.fontLevel));
if(p.highContrast===true)h.setAttribute("data-a11y-contrast","high");
}catch(e){}})()`;
