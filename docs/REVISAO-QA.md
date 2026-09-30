# 🔎 Revisão de QA e de arquitetura (setembro/2026)

Varredura do projeto inteiro (front, API, banco e infraestrutura) testando como usuário e revisando o código. Cada item diz **o que estava errado, o impacto e o que foi feito**.

**Severidade:** 🔴 alta (quebra uso ou segurança) · 🟠 média (atrapalha parte das pessoas) · 🟡 baixa (qualidade e manutenção)

## Resultado dos testes automatizados

| Suíte | Resultado | Como rodar |
|---|---|---|
| Front: acessibilidade, fluxos e auditoria WCAG | **35 de 35** | `npm run test:e2e` |
| API Java: regras e permissões por papel | **16 de 16** | ver `backend/README.md` |
| Banco (SQL Server + MongoDB) | **23 de 23** | `cd database/tests && npm test` |
| Serviço de logs (Node) | **11 de 11** | `cd services/logs-service && npm test` |
| Lint do front | **0 erros** (eram 3) | `npm run lint` |
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

## Decisões de arquitetura

- **BFF (Backend for Frontend)**: o navegador só fala com o Next. O token fica num cookie `httpOnly`, fora do alcance de scripts maliciosos (XSS).
- **Validação num lugar só**: as regras (CPF, idade, senha) ficam na API; o front só mostra os erros que ela devolve, campo a campo. Assim não há duas versões da mesma regra.
- **Três camadas de proteção por papel**: `proxy.ts` (redireciona), `dal.ts` (confere em cada página e ação) e a API (a proteção de verdade).
- **E-mails só depois do commit**: se o cadastro falhar, nenhum link é enviado.
- **Exclusão de conta por anonimização**: atende à LGPD sem apagar histórico de consultas e pagamentos.

## Recomendações (ainda não feitas)

| Prioridade | Recomendação | Por quê |
|---|---|---|
| Alta | **Limitar tentativas por IP** nas rotas de login e cadastro (ex.: Bucket4j) | Hoje o bloqueio é por conta; um ataque pode testar várias contas a partir do mesmo IP |
| Alta | **Invalidar sessões antigas** ao trocar a senha (coluna `token_version` no usuário e no JWT) | O token dura 8h; trocar a senha não desconecta outros aparelhos (a exclusão de conta já desconecta) |
| Alta | **CI no GitHub Actions** rodando os testes em cada Pull Request | Hoje os testes dependem de alguém lembrar de rodar |
| Média | Trocar os profissionais e depoimentos fixos da landing por dados da API | Hoje são exemplos inventados |
| Média | Migrar `<img>` para `next/image` (26 avisos do lint) | Imagens menores e carregamento mais rápido |
| Média | Revisão jurídica dos Termos e da Política de Privacidade | Os textos atuais são modelos |
| Baixa | Em produção: SMTP real, HTTPS, segredos fora do `.env` e a API sem acesso público direto | O `X-Forwarded-For` só é confiável se apenas o Next puder chamar a API |
