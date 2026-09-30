# ♿ Acessibilidade no NutriMente

Este guia explica o que foi implementado, como funciona por dentro e as regras que todo componente novo deve seguir.

**Por que isso importa?** No Brasil, cerca de 18,6 milhões de pessoas têm alguma deficiência (IBGE, 2022). A **Lei Brasileira de Inclusão (Lei 13.146/2015, art. 63)** torna a acessibilidade obrigatória em sites, e ela conversa direto com a **ODS 3** do projeto. A referência técnica usada é a **WCAG 2.2**, a diretriz internacional de acessibilidade web.

---

## 1. O que a pessoa usuária encontra

### Botão de acessibilidade (canto inferior esquerdo)

Abre com clique ou com o atalho **Alt + A** em qualquer página.

| Botão | O que faz | Quem ajuda |
|---|---|---|
| **Aumentar / Diminuir** | Texto em 100%, 115%, 130% ou 150% | Baixa visão, pessoas idosas |
| **Alto contraste** | Fundo preto, texto branco, links amarelos | Baixa visão, catarata, telas com reflexo |
| **Texto legível** | Fonte Atkinson Hyperlegible e mais espaço entre letras, palavras e linhas | Dislexia, baixa visão |
| **Destacar links** | Sublinha links e contorna botões | Daltonismo, deficiência cognitiva |
| **Pausar animações** | Para transições, efeitos de entrada e o carrossel | Epilepsia fotossensível, TDAH, labirintite |
| **Cursor grande** | Seta do mouse de 48px | Baixa visão, dificuldade motora |
| **Restaurar padrão** | Desliga tudo | — |

As escolhas ficam salvas no navegador e valem para todas as páginas e visitas.

### VLibras (canto direito)

Plugin gratuito do Governo Federal que traduz o texto selecionado para **Libras** com um avatar 3D. Para muitas pessoas surdas, Libras é a primeira língua e o português escrito é a segunda.

### Outros recursos

- **"Pular para o conteúdo principal"**: aparece ao apertar **Tab** pela primeira vez. Leva direto ao conteúdo, sem passar pelo menu inteiro.
- **Foco visível**: contorno azul em tudo que recebe foco pelo teclado.
- **Carrossel com botão de pausa** e navegação pelas setas do teclado.
- **Respeita o sistema operacional**: se a pessoa ativou "reduzir movimento" no Windows, macOS ou celular, as animações já vêm reduzidas.

---

## 2. Como funciona por dentro

```text
app/components/accessibility/
├── preferences.ts             tipos, padrões, salvar/ler e aplicar no <html>
├── AccessibilityProvider.tsx  estado compartilhado (Context) + animações do framer-motion
├── AccessibilityMenu.tsx      o botão flutuante e o painel com as opções
├── SkipLink.tsx               link "Pular para o conteúdo"
└── VLibras.tsx                plugin de Libras
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

O React compara o HTML do servidor com o que o navegador gera. Se o navegador renderizar de cara com as preferências salvas, os dois HTMLs ficam diferentes e dá **erro de hidratação**. O `useSyncExternalStore` usa o valor padrão durante essa comparação e troca para o valor salvo logo em seguida. Os detalhes estão comentados em `AccessibilityProvider.tsx`.

### Usando as preferências em um componente

```tsx
"use client";
import { useAccessibility } from "@/app/components/accessibility/AccessibilityProvider";

export default function MeuComponente() {
  const { prefs } = useAccessibility();

  if (prefs.reduceMotion) {
    // não anime, não toque vídeo automaticamente...
  }
}
```

### Criando uma nova opção no menu

1. Em `preferences.ts`: adicione o campo no tipo `AccessibilityPreferences`, no `DEFAULT_PREFERENCES`, no `applyPreferences` **e** no `INLINE_APPLY_SCRIPT`.
2. Em `AccessibilityMenu.tsx`: adicione um item na lista `TOGGLES`.
3. Em `globals.css`: escreva a regra `html[data-a11y-sua-opcao="..."] { ... }`.
4. Em `tests/e2e/accessibility.spec.ts`: adicione na lista `toggles` (o teste já é gerado).

---

## 3. Correções feitas no código existente

| Onde | Problema | Correção |
|---|---|---|
| Layout raiz | `lang="en"`: leitor de tela lia o português com pronúncia de inglês | `lang="pt-BR"` |
| Layout raiz | `/login` e `/register` ficavam sem `<html>`, `<body>` e fontes | `<html>` movido para `app/layout.tsx` |
| Cadastro de profissional | Label "Telefone" apontava para `id="name"`; CPF era `type="email"` | Cada label aponta para o seu campo; tipos corrigidos |
| Cadastro de profissional | Escolha Nutricionista/Psicólogo era `<div onClick>`: impossível usar pelo teclado | Virou `<button>` com `aria-pressed` |
| Botões de gênero | Radios com `display: none`: sumiam do teclado e do leitor de tela | Escondidos só visualmente, com foco visível no rótulo |
| Botões de gênero | `id="women"` fixo: dois grupos na mesma tela conflitariam | Ids únicos com `useId` e grupo rotulado (`radiogroup`) |
| Cabeçalho | Menu mobile sem `aria-expanded`; `focus:outline-none` escondia o foco | Atributos ARIA adicionados, foco visível |
| Cabeçalho | Botão mobile "Cadastre-se" ia para `/cadastro` (página inexistente) | Aponta para `/register` |
| Carrossel | Passava sozinho sem como pausar (WCAG 2.2.2) | Botão pausar/continuar, teclado e rótulos |
| Imagens | 12 imagens sem `alt` | `alt` descritivo, ou `alt=""` nas decorativas |
| Cadastro | `useEffect` com `setState` (erro do lint) e `console.log` esquecido | Limpeza feita no clique; log removido |

---

## 4. Checklist para qualquer componente novo

- [ ] **Imagem**: tem `alt`? Se só enfeita, use `alt=""`. Se informa algo, descreva (`alt="Nutricionista em consulta"`).
- [ ] **Clicável**: é `<button>` (ação) ou `<a href>` (navegação)? **Nunca** `<div onClick>`.
- [ ] **Botão só com ícone**: tem `aria-label`? O ícone tem `aria-hidden`?
- [ ] **Campo de formulário**: tem `<label htmlFor="x">` e o input tem `id="x"`?
- [ ] **Foco**: nada de `outline: none` / `focus:outline-none` sem outro indicador.
- [ ] **Teclado**: dá para fazer tudo só com Tab, Enter, Espaço e Esc?
- [ ] **Cor**: a informação não depende **só** da cor (use também texto ou ícone)?
- [ ] **Tamanho**: use classes do Tailwind (`text-lg`) em vez de `text-[18px]`, que não cresce com "Aumentar texto".
- [ ] **Animação**: respeita `prefs.reduceMotion`?
- [ ] **Página nova**: tem `<main id="conteudo">`?

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
