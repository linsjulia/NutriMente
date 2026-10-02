# ♿ Acessibilidade no NutriMente

Este guia explica o que foi implementado, como funciona por dentro e as regras que todo componente novo deve seguir.

**Por que isso importa?** No Brasil, cerca de 18,6 milhões de pessoas têm alguma deficiência (IBGE, 2022). A **Lei Brasileira de Inclusão (Lei 13.146/2015, art. 63)** torna a acessibilidade obrigatória em sites, e ela conversa direto com a **ODS 3** do projeto. A referência técnica usada é a **WCAG 2.2**.

---

## 1. O que a pessoa usuária encontra

### Botão de acessibilidade (canto inferior esquerdo)

Abre com clique ou com o atalho **Alt + A** em qualquer página. Nesta fase do projeto, o menu tem o básico:

| Botão | O que faz | Quem ajuda |
|---|---|---|
| **Aumentar / Diminuir** | Texto em 100%, 115%, 130% ou 150% | Baixa visão, pessoas idosas |
| **Alto contraste** | Fundo preto, texto branco, links amarelos | Baixa visão, catarata, telas com reflexo |
| **Restaurar padrão** | Volta tudo ao normal | — |

As escolhas ficam salvas no navegador e valem para todas as páginas e visitas.

### Recursos que não dependem de botão

- **"Pular para o conteúdo principal"**: aparece ao apertar **Tab** pela primeira vez. Leva direto ao conteúdo, sem passar pelo menu inteiro.
- **Foco visível**: contorno azul em tudo que recebe foco pelo teclado.
- **Carrossel com botão de pausa** (exigência da WCAG 2.2.2) e navegação pelas setas do teclado.
- **Menos movimento automático**: se a pessoa ativou "reduzir movimento" no Windows, macOS ou celular, as animações CSS são desligadas.

> Opções como fonte para dislexia, cursor grande e tradução para Libras (VLibras) ficaram de fora por enquanto. A estrutura permite adicioná-las depois (ver "Criando uma nova opção").

---

## 2. Como funciona por dentro

```text
app/components/accessibility/
├── preferences.ts             tipos, padrões, salvar/ler e aplicar no <html>
├── AccessibilityProvider.tsx  estado compartilhado entre os componentes
├── AccessibilityMenu.tsx      o botão flutuante e o painel com as opções
└── SkipLink.tsx               link "Pular para o conteúdo"
```

### O caminho de um clique

```text
Clique em "Alto contraste"
   │
   ▼
AccessibilityMenu chama update({ highContrast: true })
   │
   ▼
AccessibilityProvider:
   1. salva no localStorage ("nutrimente:a11y")
   2. coloca data-a11y-contrast="high" na tag <html>
   3. avisa os componentes que usam useAccessibility()
   │
   ▼
globals.css tem a regra html[data-a11y-contrast="high"] { ... }
e o visual muda na hora
```

**Ideia central:** o JavaScript só liga e desliga **atributos** no `<html>`; quem muda o visual é o **CSS** (seção `ACESSIBILIDADE` no final do `app/globals.css`). Assim, qualquer componente, inclusive os que ainda vão ser criados, é afetado automaticamente.

### Por que existe um script dentro do `<head>`?

O site é gerado no servidor, e o servidor não sabe o que a pessoa salvou no navegador. Sem o script, a página abriria no visual padrão e **depois** mudaria para alto contraste: um "piscar" branco que incomoda e pode prejudicar pessoas fotossensíveis.

O script em `app/layout.tsx` (`INLINE_APPLY_SCRIPT`) roda **antes** da página ser desenhada e já aplica os atributos. É o padrão recomendado pela documentação do Next.js ("Preventing flash before hydration").

### Por que `useSyncExternalStore` e não `useState`?

O React compara o HTML do servidor com o que o navegador gera. Se o navegador renderizar de cara com as preferências salvas, os dois HTMLs ficam diferentes e dá **erro de hidratação**. O `useSyncExternalStore` usa o valor padrão durante essa comparação e troca para o valor salvo logo em seguida.

### Por que o tamanho do texto usa `rem`?

O Tailwind usa `rem` (relativo à fonte da tag `<html>`). Aumentando a fonte do `<html>`, tudo o que usa `rem` cresce junto. Valores fixos em `px` (ex.: `text-[18px]`, `w-[600px]`) **não** crescem: prefira as classes padrão (`text-lg`, `max-w-xl`).

### Criando uma nova opção no menu

1. Em `preferences.ts`: adicione o campo no tipo, no `DEFAULT_PREFERENCES`, no `loadPreferences`, no `applyPreferences` **e** no `INLINE_APPLY_SCRIPT`.
2. Em `AccessibilityMenu.tsx`: adicione um item na lista `TOGGLES`.
3. Em `globals.css`: escreva a regra `html[data-a11y-sua-opcao="..."] { ... }`.
4. Em `tests/e2e/accessibility.spec.ts`: adicione um teste.

---

## 3. Checklist para qualquer componente novo

- [ ] **Imagem**: tem `alt`? Se só enfeita, use `alt=""`. Se informa algo, descreva (`alt="Nutricionista em consulta"`).
- [ ] **Clicável**: é `<button>` (ação) ou `<a href>` / `<Link>` (navegação)? **Nunca** `<div onClick>`.
- [ ] **Botão só com ícone**: tem `aria-label`? O ícone tem `aria-hidden`?
- [ ] **Campo de formulário**: tem `<label htmlFor="x">` e o input tem `id="x"`? Erros ligados ao campo com `aria-describedby`?
- [ ] **Foco**: nada de `outline: none` / `focus:outline-none` sem outro indicador.
- [ ] **Teclado**: dá para fazer tudo só com Tab, Enter, Espaço e Esc?
- [ ] **Cor**: a informação não depende **só** da cor (use também texto ou ícone)?
- [ ] **Tamanho**: `rem` (classes do Tailwind) em vez de `px` fixo.
- [ ] **Celular**: funciona em 360px de largura sem rolagem horizontal?
- [ ] **Página nova**: tem `<main id="conteudo">` e um `<h1>`?

### Como testar na mão

1. **Só teclado**: largue o mouse e navegue com Tab / Shift+Tab / Enter / Esc.
2. **Leitor de tela**: [NVDA](https://www.nvaccess.org/) (Windows, gratuito) ou Narrador (`Ctrl + Win + Enter`).
3. **Zoom**: `Ctrl +` até 200%; nada pode sumir ou ficar sobreposto.
4. **Lighthouse**: DevTools do Chrome (F12) > Lighthouse > Accessibility.

### Testes automáticos

```bash
npm run test:e2e
```

Os testes em `tests/e2e/` procuram os elementos pelo **papel e nome acessível** (`getByRole`, `getByLabel`), do mesmo jeito que um leitor de tela. Se o teste não encontra um botão, uma pessoa cega também não encontraria.
