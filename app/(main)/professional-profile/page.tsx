import type { Metadata } from "next";
import ProfileView from "@/app/components/profile/ProfileView";
import type { Horario, Profissional } from "@/app/components/profile/Types";

export const metadata: Metadata = { title: "Perfil do profissional | NutriMente" };

// Dados de exemplo (mesmos do Figma). Depois trocamos pela API.
const HORAS = ["8:00", "8:30", "9:00", "9:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];
const OCUPADOS = ["8:30", "11:30", "13:00", "16:00"];
const horarios = (): Horario[] => HORAS.map((hora) => ({ hora, livre: !OCUPADOS.includes(hora) }));

const nayara: Profissional = {
  nome: "Nayara Santos",
  titulo: "Psicólogo(a)",
  registro: "CRP - 06/00000",
  cidade: "São Paulo - SP",
  foto: "/doctor/nayara-profile.png",
  nota: 4.7,
  totalAvaliacoes: 100,
  resumo: "Psicóloga clínica com ênfase em Terapia Cognitivo-Comportamental (TCC).",
  apresentacao:
    "Psicóloga clínica com ênfase em Terapia Cognitivo-Comportamental (TCC), atende pessoas que estão lidando com estresse, sobrecarga emocional e sintomas de ansiedade, e que querem entender melhor o que sentem e como isso aparece no dia a dia.",
  graduacao: "Instituto de Psicologia – IPUSP",
  posGraduacao: "Especialização em Terapia Cognitivo-Comportamental",
  experiencia: "8 anos de atuação",
  especialidades: ["Ansiedade", "Estresse", "Autoestima", "Regulação emocional", "Crises de pânico", "Terapia Cognitivo-Comportamental"],
  preco: 100,
  modalidade: "Telemedicina",
  horarioAtendimento: "08:00 às 17:00",
  distribuicao: { 5: 78, 4: 15, 3: 4, 2: 2, 1: 1 },
  avaliacoes: [
    { id: 1, nome: "Lívia F.", nota: 5, quando: "Há 3 dias", comentario: "Atenciosa e pontual!" },
    { id: 2, nome: "João S.", nota: 5, quando: "Há 4 dias", comentario: "Muito paciente, adorei a consulta." },
    { id: 3, nome: "Alexandra B.", nota: 5, quando: "Há 1 semana", comentario: "Excelente profissional, atenciosa e dedicada." },
    { id: 4, nome: "Carlos M.", nota: 4, quando: "Há 2 semanas", comentario: "Gostei muito do atendimento." },
  ],
  dias: [
    { semana: "dom", numero: "04", horarios: horarios() },
    { semana: "seg", numero: "05", horarios: horarios() },
    { semana: "ter", numero: "06", horarios: horarios() },
    { semana: "qua", numero: "07", horarios: horarios() },
    { semana: "qui", numero: "08", horarios: horarios() },
  ],
};

export default function PerfilProfissionalPage() {
  return (
    <main id="conteudo" className="flex-1 bg-blue3">
      <ProfileView p={nayara} />
    </main>
  );
}