// =============================================================
// Preferências de acessibilidade do NutriMente
//
// COMO FUNCIONA (visão geral)
// 1. Cada opção do menu (fonte maior, alto contraste...) vira um atributo
//    "data-a11y-*" na tag <html>. Ex.: <html data-a11y-contrast="high">.
// 2. O globals.css tem regras para cada atributo (seção ACESSIBILIDADE).
//    Ou seja: o JavaScript só liga/desliga atributos e o CSS faz o visual.
// 3. As escolhas ficam salvas no localStorage do navegador, então a pessoa
//    não precisa configurar de novo a cada visita.
// 4. Um script inline no <head> (ver app/layout.tsx) aplica as preferências
//    ANTES da página aparecer. Sem isso, a página abriria "normal" e depois
//    mudaria, o que incomoda e pode até causar crise em pessoas
//    fotossensíveis.
// =============================================================

export type AccessibilityPreferences = {
  /** Nível do tamanho da fonte: índice de FONT_SCALES (0 = 100%) */
  fontLevel: number;
  /** Alto contraste: fundo preto, texto branco, links amarelos */
  highContrast: boolean;
  /** Fonte mais fácil de ler + mais espaço entre letras/linhas (ajuda dislexia e baixa visão) */
  readableFont: boolean;
  /** Sublinha e contorna todos os links e botões */
  highlightLinks: boolean;
  /** Para animações, transições e o carrossel automático */
  reduceMotion: boolean;
  /** Cursor do mouse maior */
  bigCursor: boolean;
};

/** Tamanhos de fonte disponíveis (multiplicam o tamanho base de 16px) */
export const FONT_SCALES = [1, 1.15, 1.3, 1.5] as const;

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontLevel: 0,
  highContrast: false,
  readableFont: false,
  highlightLinks: false,
  reduceMotion: false,
  bigCursor: false,
};

/** Chave usada no localStorage */
export const STORAGE_KEY = "nutrimente:a11y";

/** Lê as preferências salvas. Qualquer problema -> volta ao padrão. */
export function loadPreferences(): AccessibilityPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES; // no servidor não existe localStorage
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    return { ...DEFAULT_PREFERENCES, ...saved };
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

/**
 * Aplica as preferências na tag <html> como atributos data-a11y-*.
 * Atributo ausente = opção desligada.
 */
export function applyPreferences(prefs: AccessibilityPreferences) {
  const html = document.documentElement;
  const set = (name: string, value: string | false) =>
    value ? html.setAttribute(name, value) : html.removeAttribute(name);

  set("data-a11y-font", prefs.fontLevel > 0 && String(prefs.fontLevel));
  set("data-a11y-contrast", prefs.highContrast && "high");
  set("data-a11y-readable", prefs.readableFont && "true");
  set("data-a11y-links", prefs.highlightLinks && "true");
  set("data-a11y-motion", prefs.reduceMotion && "reduce");
  set("data-a11y-cursor", prefs.bigCursor && "big");
}

/**
 * Mesmo trabalho do applyPreferences, mas como TEXTO de um script que roda
 * direto no <head>, antes do React carregar. Precisa ser JavaScript puro e
 * autossuficiente (não pode importar nada). Se mudar os atributos acima,
 * mude aqui também.
 */
export const INLINE_APPLY_SCRIPT = `(function(){try{
var p=JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)})||"{}"),h=document.documentElement;
if(p.fontLevel>0)h.setAttribute("data-a11y-font",String(p.fontLevel));
if(p.highContrast)h.setAttribute("data-a11y-contrast","high");
if(p.readableFont)h.setAttribute("data-a11y-readable","true");
if(p.highlightLinks)h.setAttribute("data-a11y-links","true");
if(p.reduceMotion)h.setAttribute("data-a11y-motion","reduce");
if(p.bigCursor)h.setAttribute("data-a11y-cursor","big");
}catch(e){}})()`;
