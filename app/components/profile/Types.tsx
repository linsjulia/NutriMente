// Tipos usados só na tela de perfil. Para conexão na API.

export type Avaliacao = {
  id: number;
  nome: string;
  nota: number;
  quando: string;
  comentario: string;
};

export type Horario = { hora: string; livre: boolean };

export type Dia = { semana: string; numero: string; horarios: Horario[] };

export type Profissional = {
  nome: string;
  titulo: string;
  registro: string;
  cidade: string;
  foto: string;
  nota: number;
  totalAvaliacoes: number;
  resumo: string;
  apresentacao: string;
  graduacao: string;
  posGraduacao: string;
  experiencia: string;
  especialidades: string[];
  preco: number;
  modalidade: string;
  horarioAtendimento: string;
  /** quantidade de avaliações por nota: { 5: 78, 4: 15, ... } */
  distribuicao: Record<number, number>;
  avaliacoes: Avaliacao[];
  dias: Dia[];
};