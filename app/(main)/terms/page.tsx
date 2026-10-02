import type { Metadata } from "next";

export const metadata: Metadata = { title: "Termos de Uso | NutriMente" };

// ATENÇÃO: texto-modelo de um projeto acadêmico. Antes de uso real, precisa
// ser revisado por alguém da área jurídica. Ao mudar o texto, atualize
// LgpdConsent.TERMS_VERSION na API (os aceites guardam a versão).
export default function TermsPage() {
  return (
    <main id="conteudo" className="prose-page">
      <h1>Termos de Uso</h1>
      <p className="text-sm text-gray-600">Versão 2026-09 · Projeto acadêmico (FATEC Luigi Papaiz, DSM)</p>

      <h2>1. O que é o NutriMente</h2>
      <p>
        Plataforma que conecta pacientes a nutricionistas e psicólogos. O NutriMente não presta atendimento de saúde:
        o atendimento é de responsabilidade de cada profissional, conforme o código de ética do seu conselho (CFN ou
        CFP).
      </p>

      <h2>2. Cadastro</h2>
      <ul>
        <li>É preciso ter 18 anos ou mais.</li>
        <li>Os dados informados devem ser verdadeiros. A conta é pessoal e a senha não deve ser compartilhada.</li>
        <li>Profissionais só aparecem para os pacientes depois que a equipe confere o registro no conselho (CRN ou CRP).</li>
      </ul>

      <h2>3. Uso adequado</h2>
      <p>
        Não é permitido usar a plataforma para fins ilegais, se passar por outra pessoa ou tentar acessar dados de
        outros usuários. Contas que violarem estas regras podem ser suspensas.
      </p>

      <h2>4. Emergências</h2>
      <p>
        O NutriMente não é um serviço de emergência. Em caso de risco à vida, ligue 192 (SAMU) ou 188 (CVV, apoio
        emocional, 24 horas).
      </p>

      <h2>5. Exclusão da conta</h2>
      <p>Você pode excluir sua conta a qualquer momento em &ldquo;Minha conta&rdquo;.</p>
    </main>
  );
}
