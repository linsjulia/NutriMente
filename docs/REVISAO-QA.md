# 🔎 Revisão de QA e de arquitetura (set./out. 2026)

Varredura do projeto inteiro (front, API, banco e infraestrutura) testando como usuário e revisando o código. Cada item diz **o que estava errado, o impacto e o que foi feito**.

**Severidade:** 🔴 alta (quebra uso ou segurança) · 🟠 média (atrapalha parte das pessoas) · 🟡 baixa (qualidade e manutenção)

## Resultado dos testes automatizados

| Suíte | Resultado | Como rodar |
|---|---|---|
| Front: acessibilidade, fluxos e auditoria WCAG | **49 de 49** | `npm run test:e2e` |
| API Java (Java 25): regras, permissões, limite de tentativas e validação de campos | **32 de 32** | ver `backend/README.md` |
| Banco (SQL Server + MongoDB) | **23 de 23** | `cd database/tests && npm test` |
| Serviço de logs (Node) | **11 de 11** | `cd services/logs-service && npm test` |
| Lint do front | **0 erros e 11 avisos** (eram 3 erros e 33 avisos; os 11 são ícones de 1 a 3 KB) | `npm run lint` |
| Rolagem horizontal em 320/375/768/1366px | **nenhuma página** | — |

## Encontrado e corrigido

### Funcionalidade

| | Problema | Correção |
|---|---|---|
| 🔴 | Não havia login, cadastro nem sessão funcionando: os formulários não enviavam para lugar nenhum | API Java + telas + Server Actions: cadastro por papel, confirmação de e-mail, login, esqueci a senha, minha conta, aprovação pelo admin |
| 🔴 | Cadastro de paciente e de profissional misturados na mesma rota; o de paciente era um rascunho sem uso | Escolha do tipo em `/register`, com formulários separados (`/register/patient` e `/register/professional`) |
| 🔴 | No cadastro profissional, o rótulo "Telefone" apontava para o campo de nome e o CPF era `type="email"` | Formulário refeito; cada rótulo ligado ao seu campo e testado automaticamente |
| 🟠 | Menu do celular levava para `/cadastro` (página inexistente); links do cabeçalho e rodapé eram `#`; "Sobre nós" era uma página vazia | Links reais; páginas Sobre, Termos e Privacidade criadas |
| 🟠 | Botões "Ver perfil" e "Agendar" dos cards não faziam nada | Viraram links para a busca e para o cadastro |

### Responsividade

| | Problema | Correção |
|---|---|---|
| 🔴 | No celular a home rolava **575px** para o lado e o cadastro **485px** | Larguras fixas (`width: 600px`, `w-105`, `w-137.5`, `px-60`, `p-30`, `gap-60`) trocadas por larguras fluidas com limite máximo |
| 🟠 | Cards com altura fixa cortavam o texto ao aumentar a fonte | Altura livre |
| 🟡 | Rodapé com `min-h-screen` (uma tela inteira de espaço vazio) | Grade de 1 coluna no celular e 3 no desktop |
| 🟡 | Botão de acessibilidade cobria campos no celular | Menor no celular e espaço reservado no fim da página |

### Acessibilidade (auditoria axe, WCAG 2.2 AA)

| | Problema | Correção |
|---|---|---|
| 🟠 | Títulos em ciano e verde claro com contraste de ~1,8:1 (mínimo 3:1) | Tons mais escuros da mesma cor |
| 🟠 | Etiquetas de especialidade com contraste 3,1:1 (mínimo 4,5:1) | Texto mais escuro |
| 🟠 | Bolinhas do carrossel com 8px (mínimo 24px de alvo de toque) | 14px com espaçamento |
| 🟠 | Vários `<h1>` na mesma página e etiquetas marcadas como `<h2>` | Um `<h1>` por página; hierarquia `h2`/`h3` |
| 🟡 | "Agendar uma consulta" era um `<button>` que navegava via JavaScript | Virou link (funciona sem JS e abre em nova aba) |
| 🟡 | O asterisco de obrigatório fazia parte do nome do campo ("Senha *") | Asterisco fora do `<label>` |

### Segurança e arquitetura

| | Problema | Correção |
|---|---|---|
| 🔴 | O SQL Server ficava "saudável" antes de terminar de criar as tabelas; a API podia ligar antes do banco estar pronto | O healthcheck agora entra com o usuário da aplicação e lê a tabela do seed |
| 🔴 | A API não ligava no Docker (mudança do Spring Boot 4 no `RestClient`); os testes não pegavam porque usavam um dublê | Corrigido, e o fluxo completo agora roda num teste de ponta a ponta sem dublês |
| 🟠 | Links de e-mail levam um token na URL e poderiam vazar para outros sites pelo cabeçalho `Referer` | `Referrer-Policy` e outros cabeçalhos de segurança em `next.config.ts` |
| 🟠 | A confirmação de e-mail seria "gasta" por robôs de antivírus que abrem links | Confirmação por botão (POST), não ao abrir a página |

## Segunda rodada (outubro/2026): rodando o projeto do zero

Subi tudo como alguém da equipe faria (`docker compose up -d --build` + `npm run dev`) e rodei todas as suítes.

| | Problema | Correção |
|---|---|---|
| 🔴 | **A home baixava 59 MB** (52 MB só de fotos) mesmo no celular: o carrossel usava fotos de até 8000px e 25 MB | `next/image` entrega cada foto no tamanho da tela e em WebP/AVIF. **Home: 59 MB → ~1,5 MB.** Cadastro: 17,7 MB → ~1,2 MB |
| 🔴 | Depois do upgrade para **Java 25**, a API funcionava mas ficava sempre "unhealthy": a nova imagem base não tem `wget`, usado pelo healthcheck | `curl` instalado na imagem. Upgrade validado: 18 de 18 testes passam em Java 25 |
| 🔴 | **O visitante conseguia forjar o próprio IP** (testado: `X-Forwarded-For: 6.6.6.6` foi parar no log e nos consentimentos da LGPD) | A API só aceita o cabeçalho vindo da rede interna; o Next repassa só a última entrada (a do proxy). Em produção é preciso um proxy reverso (ver `backend/README.md`) |
| 🟠 | Sem limite de tentativas por IP: um robô podia testar uma senha em cada uma de milhares de contas sem nunca bloquear nenhuma | Limite por IP em `/api/auth/**` (30/min, configurável), com resposta 429 e `Retry-After` |
| 🟠 | Se a API travasse, as páginas ficavam carregando para sempre | Tempo-limite de 10s com mensagem clara |
| 🟠 | Endereço inexistente e erros inesperados mostravam telas padrão do Next, em inglês | `not-found.tsx` e `error.tsx` em português |
| 🟡 | Favicon era um PNG de 800 KB | `app/icon.png` de 64px (4,7 KB) |
| 🟡 | `allowedDevOrigins` com um IP fixo de uma máquina | Variável `ALLOWED_DEV_ORIGINS` no `.env` |
| 🟡 | O lint do front analisava também o Java, o Node e os testes do banco | Lint restrito ao front; imports sem uso removidos |

## Terceira rodada (outubro/2026): validação, textos, telas e padronização

Revisão como QA sênior campo a campo, em celular (414px) e desktop (1024px+). Os testes que reproduzem cada problema estão em `tests/e2e/qa-regressions.spec.ts` e `backend/.../ValidationIntegrationTest.java`.

### Validação de campos (regras na API)

| | Problema | Correção |
|---|---|---|
| 🔴 | Valor da consulta "1.000,50" virava vazio e **o preço era apagado** com a mensagem "atualizado" | `parseBRL` aceita o formato brasileiro; texto inválido mostra erro e não apaga nada |
| 🟠 | E-mail sem domínio (`ana@gmail`) era aceito e o e-mail de confirmação nunca chegava | Exige domínio com ponto (`@Email` com regex) |
| 🟠 | Nome aceitava números, um só nome ou espaços sobrando | `@FullName` (nome e sobrenome, só letras) e `Names.normalize` ("  pedro   DE souza " → "Pedro de Souza") |
| 🟠 | Celular aceitava DDD inexistente, número sem o 9 e "11111111111" | `@Celular`: DDD da Anatel, 9 na frente, 11 dígitos |
| 🟠 | Psicólogo conseguia cadastrar CRN e nutricionista, CRP | `CouncilNumber`: o formato depende da profissão, com regiões válidas (CRN 1 a 11, CRP 01 a 24) |
| 🟡 | Campo vazio mostrava "formato inválido" em vez de "obrigatório"; data ou opção inválida virava erro genérico sem campo | Mensagem de obrigatório tem prioridade; erros de leitura do JSON apontam o campo ("Data inválida", "Opção inválida") |
| 🟡 | Data de nascimento de 1800 era aceita | Mais de 120 anos → "Data de nascimento inválida" |
| 🟠 | Admin recusava profissional com um clique, sem confirmar e sem dizer o motivo | Recusa pede motivo (obrigatório na API) e confirmação; o motivo vai no e-mail |

### Experiência de uso

| | Problema | Correção |
|---|---|---|
| 🔴 | A home **não terminava de carregar** em 414px e 1024px (carrossel em loop + fotos de 25 MB) | Carrossel com `rewind` e fotos de `public/` reduzidas a 2000px (**63 MB → 7,8 MB**) |
| 🟠 | Com erro no envio, o aviso ficava fora da tela no celular e parecia que nada tinha acontecido | `useFocusOnError` leva foco e rolagem ao primeiro campo errado, em todos os formulários |
| 🟠 | Sessão expirada mandava para o login e, depois de entrar, a pessoa perdia a página onde estava | Login com `?next=` (volta para a página), protegido contra redirecionamento para outro site |
| 🟠 | Telas paradas, sem sinal, enquanto a API respondia | `loading.tsx` na área logada e na busca |
| 🟡 | Mensagens técnicas ("fetch failed", "timeout") | Frases simples: "Não conseguimos conectar agora..." |
| 🟡 | Botão de acessibilidade no topo cobria o menu no celular | Movido para o canto inferior direito |
| 🟡 | Links de texto com área de toque de ~20px | `py-2.5` (44px) |

### Padronização

| | Problema | Correção |
|---|---|---|
| 🟡 | "Home" no site público e "Início" na área logada | "Início" em todo lugar |
| 🟡 | Rodapé só na home; páginas sem `<h1>` ou com dois | Rodapé no layout `(main)`, um `<h1>` por página; a 404 ganhou cabeçalho e rodapé |
| 🟡 | Aba de "Esqueci minha senha" mostrava só "NutriMente" | `metadata` própria (página de servidor + formulário em arquivo separado) |
| 🟡 | CTA "Agendar uma consulta" levava a um cadastro, sem agendamento | "Começar agora"; cards "Em breve" com etiqueta e contraste adequado |
| 🟡 | Sem regra para a cor dos botões | [PADROES-DE-INTERFACE.md](PADROES-DE-INTERFACE.md): verde = marketing, azul = ação de formulário, vermelho = destrutivo |

## Decisões de arquitetura

- **BFF (Backend for Frontend)**: o navegador só fala com o Next. O token fica num cookie `httpOnly`, fora do alcance de scripts maliciosos (XSS).
- **Validação num lugar só**: as regras (CPF, idade, senha) ficam na API; o front só mostra os erros que ela devolve, campo a campo. Assim não há duas versões da mesma regra.
- **Três camadas de proteção por papel**: `proxy.ts` (redireciona), `dal.ts` (confere em cada página e ação) e a API (a proteção de verdade).
- **E-mails só depois do commit**: se o cadastro falhar, nenhum link é enviado.
- **Exclusão de conta por anonimização**: atende à LGPD sem apagar histórico de consultas e pagamentos.

## Recomendações (ainda não feitas)

| Prioridade | Recomendação | Por quê |
|---|---|---|
| Alta | **Invalidar sessões antigas** ao trocar a senha (coluna `token_version` no usuário e no JWT) | O token dura 8h; trocar a senha não desconecta outros aparelhos (a exclusão de conta já desconecta) |
| Alta | **CI no GitHub Actions** rodando os testes em cada Pull Request | Hoje os testes dependem de alguém lembrar de rodar |
| Média | Trocar os profissionais e depoimentos fixos da landing por dados da API | Hoje são exemplos inventados |
| Média | Migrations com Flyway | Hoje, mudar o banco depois da 1ª subida exige `docker compose down -v` (apaga os dados) |
| Média | Revisão jurídica dos Termos e da Política de Privacidade | Os textos atuais são modelos |
| Alta | Em produção: proxy reverso na frente do Next, SMTP real, HTTPS, segredos fora do `.env` e a API sem acesso público direto | Ver "Em produção" em `backend/README.md` |
