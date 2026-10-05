import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade | NutriMente" };

// ATENÇÃO: texto-modelo de um projeto acadêmico, baseado na LGPD
// (Lei 13.709/2018). Precisa de revisão jurídica antes de uso real.
export default function PrivacyPage() {
  return (
    <main id="conteudo" className="prose-page">
      <h1>Política de Privacidade</h1>
      <p className="text-sm text-gray-600">Versão 2026-09 · Projeto acadêmico (FATEC Luigi Papaiz, DSM)</p>

      <h2>1. Quais dados coletamos e por quê</h2>
      <ul>
        <li><strong>Nome, e-mail e senha</strong>: criar e proteger sua conta. A senha é guardada de forma irreversível (hash).</li>
        <li><strong>CPF e data de nascimento</strong>: identificar você com segurança e confirmar a maioridade.</li>
        <li><strong>Celular</strong>: contato sobre suas consultas.</li>
        <li><strong>Gênero</strong>: opcional, só se você quiser informar.</li>
        <li><strong>CRN ou CRP</strong> (profissionais): conferir o registro no conselho.</li>
        <li><strong>Dados de saúde</strong> (pacientes): só com seu consentimento específico, para o seu atendimento (art. 11).</li>
      </ul>

      <h2>2. Com quem compartilhamos</h2>
      <p>
        Seus dados de saúde só são vistos pelos profissionais que você escolher. Não vendemos dados. O perfil público
        de um profissional mostra apenas nome, profissão, número do conselho, bio e valor da consulta.
      </p>

      <h2>3. Segurança</h2>
      <p>
        Usamos conexão protegida, senhas com hash, bloqueio após tentativas de login erradas e registro de quem acessa
        dados pessoais (trilha de auditoria).
      </p>

      <h2>4. Seus direitos (art. 18)</h2>
      <p>
        Você pode ver e corrigir seus dados em &ldquo;Minha conta&rdquo;, revogar consentimentos e excluir a conta.
        Na exclusão, seus dados pessoais são anonimizados; registros de consultas e pagamentos são mantidos sem
        identificar você, quando a lei exige.
      </p>

      <h2>5. Contato</h2>
      <p>Dúvidas sobre seus dados: nutrimente@gmail.com.</p>
    </main>
  );
}
