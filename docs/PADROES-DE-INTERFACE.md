# 🎨 Padrões de interface

Regras combinadas na revisão de QA para o site ter a mesma "cara" em todas as telas.
Antes de criar um botão, um texto ou um formulário novo, confira aqui.

## Botões: cada cor tem um papel

| Classe / componente | Cor | Quando usar | Exemplos |
|---|---|---|---|
| `LandingButton` | Verde (marca) | **Chamada de marketing** nas páginas públicas. No máximo um por seção | "Começar agora" |
| `.btn-primary` | Azul cheio | **A ação principal de um formulário ou tela**. Um por formulário | "Entrar", "Criar conta", "Salvar dados" |
| `.btn-secondary` | Contorno azul | Ação alternativa, ao lado da principal | "Voltar", "Cancelar" |
| `.btn-danger` | Vermelho | Ação **destrutiva ou que não dá para desfazer**. Sempre com confirmação antes | "Excluir definitivamente", "Recusar" |

Regras:

- **Navegar é link, agir é botão.** Se o clique só leva para outra página, use `<Link>` (pode ter a aparência de botão). `<button>` é para enviar formulário ou executar algo.
- **Área de toque mínima de 44px** de altura (`.btn-*` já tem `min-height: 3rem`). Para links de texto soltos, use `inline-block py-2.5`.
- **Ação destrutiva pede confirmação na própria tela** (ex.: `<details>` com campo de motivo, ou digitar "EXCLUIR"). Não usamos `confirm()` do navegador.

## Textos

- **Verbo no infinitivo + objeto**, dizendo o que vai acontecer: "Salvar perfil", "Enviar link", "Confirmar recusa". Evite "OK", "Enviar" ou "Clique aqui" sozinhos.
- **Não prometa o que a tela seguinte não entrega.** Se a função ainda não existe, mostre a etiqueta "Em breve" em vez de um botão que não funciona.
- Os mesmos nomes em todo o site: **"Início"** (nunca "Home"), **"Minha conta"**, **"Sair"**.
- Mensagens de erro dizem **o que fazer**, com exemplo: "Celular inválido. Use DDD + número com 9 dígitos, ex.: (11) 98888-7777".
- Erros de rede ou da API usam frases simples, sem termos técnicos: "Não conseguimos conectar agora. Tente de novo em alguns instantes."

## Formulários

- Todo campo tem `<label>` visível. Dicas de formato ficam no `hint` do `Field` ("Com DDD.", "Ex.: 150 ou 1.000,50").
- **As regras ficam na API.** O front só mostra o erro que ela devolve, embaixo do campo certo. Exceção: "repita a senha", conferido no Next.
- Depois de um envio com erro, o foco vai para o primeiro campo errado (`useFocusOnError`). Todo formulário novo deve usar esse hook.
- O que a pessoa digitou **nunca é apagado** quando há erro (`defaultValue={state.values?.campo}`).
- Valores em reais aceitam o formato brasileiro (`parseBRL` / `formatBRL` em `app/lib/money.ts`).

## Páginas

- **Um único `<h1>` por página**; dentro dela, `h2` e `h3` em ordem.
- Toda página tem `metadata` com o título no formato `Assunto | NutriMente`. Componentes `"use client"` não podem exportar `metadata`: deixe o `page.tsx` como componente de servidor e coloque o formulário num arquivo à parte (como em `forgot-password/`).
- Páginas públicas usam o layout `(main)`, que já traz cabeçalho e rodapé.
- Páginas que buscam dados na API têm um `loading.tsx` (componente `Loading`).
- Acessibilidade: só **tamanho da fonte** e **alto contraste** (ver [ACESSIBILIDADE.md](ACESSIBILIDADE.md)). Toda tela nova deve passar no teste `axe.spec.ts` nos dois modos.
