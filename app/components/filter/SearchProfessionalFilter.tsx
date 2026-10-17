"use client";
import { faSearch, faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
 Accordion,
 AccordionItem,
 AccordionTrigger,
 AccordionContent 

} from "@/components/ui/accordion";
import Checkbox from "../inputs/Checkbox";

export default function Filtros() {
  return (
    <aside className="w-full shrink-0 rounded-2xl bg-white p-10 shadow-sm md:w-64 md:self-start lg:w-72 overflow-y-auto">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-blue-900">Filtros</h2>
        <button type="button" className="text-xs font-semibold text-green-600">
          Limpar filtros
        </button>
      </div>

      <Accordion defaultValue={["area"]}>

        <AccordionItem value="area">
            <AccordionTrigger>Área</AccordionTrigger>
            <AccordionContent>
                <Checkbox label="Psicologia" />
                <Checkbox label="Nutrição" />
                <Checkbox label="Psicologia nutricional" marcado />
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tema">
            <AccordionTrigger>Tema</AccordionTrigger>
            <AccordionContent>
                <div className="flex items-center rounded-md border border-slate-300 px-2 py-1.5">
                    <input type="text" placeholder="Buscar tema..." className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"/>
                        <FontAwesomeIcon icon={faSearch} className="h-4 w-4 text-blue-700" />
                </div>
                <Checkbox label="Comer emocional" marcado />
                <Checkbox label="Compulsão alimentar" />
                <Checkbox label="Anorexia e bulimia" />
                <Checkbox label="Imagem corporal" />
                <Checkbox label="Ansiedade" marcado />
                <button type="button" className="pt-1 text-xs font-semibold text-green-600">Ver todos os temas</button>
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="publico">
            <AccordionTrigger>Público</AccordionTrigger>
            <AccordionContent>
                <Checkbox label="Adulto" />
                <Checkbox label="Adolescente" />
                <Checkbox label="Criança" />
                <Checkbox label="Casal" />
                <Checkbox label="Idoso" />
            </AccordionContent>
        </AccordionItem>
       </Accordion> 

      <Grupo titulo="Preço da consulta">
        <div className="relative w-fit">
          <input type="range"/>
        </div>
        <div className="flex justify-between pt-2 text-xs font-semibold text-slate-700">
          <span>R$ 80</span>
          <span>R$ 300</span>
        </div>
      </Grupo>

      <Grupo titulo="Horário disponível">
        <Checkbox label="Hoje" marcado />
        <Checkbox label="Esta semana" />
        <Checkbox label="Fim de Semana" />
        <Segmentos opcoes={["Manhã", "Tarde", "Noite"]} inicial="Tarde" />
        <button
          type="button"
          className="flex items-center gap-2 pt-1 text-xs font-semibold text-green-600"
        >
          <FontAwesomeIcon icon={faCalendar} />
          Selecionar data
        </button>
      </Grupo>

      <Grupo titulo="Duração da consulta">
        <Segmentos opcoes={["Até 30 min", "Até 60 min", "Mais de 60 min"]} inicial="Até 60 min" />
      </Grupo>

      <Grupo titulo="Perfil do profissional">
        <Checkbox label="Feminino" marcado />
        <Checkbox label="Masculino" />
      </Grupo>
    </aside>
  );
}