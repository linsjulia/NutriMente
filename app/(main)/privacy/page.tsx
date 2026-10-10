import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidade | NutriMente" };

// ATENÇÃO: texto-modelo de um projeto acadêmico, baseado na LGPD
// (Lei 13.709/2018). Precisa de revisão jurídica antes de uso real.
// Ao mudar o que o sistema coleta ou guarda, atualize este texto e a versão.
export default function PrivacyPage() {
  return (
    <main id="conteudo" className="prose-page">
      <h1>Política de Privacidade</h1>
      <p className="text-sm text-gray-600">Versão 2026-10 · Projeto acadêmico (FATEC Luigi Papaiz, DSM)</p>

      <h2>1. Quais dados coletamos e por quê</h2>
      <ul>
        <li><strong>Nome, e-mail e senha</strong>: criar e proteger sua conta. A senha é guardada de forma irreversível (hash).</li>
        <li><strong>CPF e data de nascimento</strong>: identificar você com segurança e confirmar a maioridade.</li>
        <li><strong>Celular</strong>: contato sobre suas consultas.</li>
        <li><strong>Gênero</strong>: opcional, só se você quiser informar.</li>
        <li><strong>Profissionais</strong>: número do conselho (CRN ou CRP), documentos enviados para verificação (carteira do conselho, diploma, identidade), endereço do consultório e a declaração de cadastro no e-Psi ou e-Nutricionista para atender online.</li>
        <li>
          <strong>Dados de saúde</strong> (pacientes), só com seu consentimento específico e para o seu atendimento (LGPD, art. 11):
          questionário inicial (objetivos e hábitos), triagem antes da consulta (motivo, sintomas e humor), diário alimentar
          (refeições, anotações e fotos), plano de ação e progresso (peso e humor).
        </li>
        <li><strong>Registro da consulta (prontuário)</strong>: escrito pelo profissional, como exigem os conselhos (CFP 01/2009 e CFN 594/2017).</li>
        <li><strong>Registros de acesso</strong>: data, hora e endereço IP de login e de ações importantes, para segurança e para cumprir a lei (Marco Civil da Internet).</li>
      </ul>

      <h2>2. Quem vê os seus dados</h2>
      <ul>
        <li>
          <strong>Profissionais que atendem você</strong> (com consulta marcada ou realizada) veem seu questionário, sua triagem, seu
          diário e o plano de ação. Outros profissionais não veem nada.
        </li>
        <li>
          No registro da consulta, as <strong>anotações privadas</strong> são só do profissional; as <strong>orientações</strong>
          aparecem para você.
        </li>
        <li>
          O <strong>perfil público</strong> de um profissional mostra nome, foto, profissão, número do conselho, especialidades, bio,
          valor, nota média, se atende online e a cidade do consultório. O endereço completo aparece só para quem tem consulta
          presencial marcada. Nas avaliações, o nome do paciente aparece abreviado (ex.: &ldquo;Ana S.&rdquo;).
        </li>
        <li>
          A <strong>videochamada</strong> acontece no Jitsi Meet, um serviço de terceiros: a chamada não passa pelo NutriMente e
          <strong> não é gravada</strong>.
        </li>
        <li>A <strong>equipe administrativa</strong> vê os documentos dos profissionais para verificar o registro. Não vendemos dados.</li>
      </ul>

      <h2>3. Segurança</h2>
      <p>
        Usamos conexão protegida, senhas com hash, bloqueio após tentativas de login erradas e trilha de auditoria (quem acessou
        dados de quem). CPF, telefone, data de nascimento, prontuário, questionário, triagem e diário são guardados
        <strong> criptografados</strong> (AES-256); fotos e documentos também ficam criptografados. Ao trocar a senha, todas as
        sessões abertas em outros aparelhos são encerradas.
      </p>

      <h2>4. Por quanto tempo guardamos</h2>
      <ul>
        <li><strong>Enquanto a conta existir</strong>: dados da conta, questionário, diário, plano de ação e documentos.</li>
        <li><strong>Prontuário e triagem</strong>: pelo menos 5 anos, mesmo depois da exclusão da conta, porque os conselhos exigem a guarda (LGPD, art. 16, I).</li>
        <li><strong>Registros de acesso</strong>: 1 ano. <strong>Trilha de auditoria</strong>: 5 anos. <strong>Registros de erros do sistema</strong>: 90 dias.</li>
      </ul>

      <h2>5. Seus direitos (art. 18)</h2>
      <p>
        Você pode ver e corrigir seus dados em &ldquo;Minha conta&rdquo;, <strong>baixar uma cópia de todos os seus dados</strong>
        (arquivo para portabilidade), revogar consentimentos e excluir a conta. Na exclusão, seus dados pessoais são anonimizados;
        diário, questionário e documentos são apagados; prontuário, triagem, consultas e pagamentos são mantidos sem identificar
        você, quando a lei exige.
      </p>

      <h2>6. Contato</h2>
      <p>Dúvidas sobre seus dados: nutrimente@gmail.com.</p>
    </main>
  );
}
