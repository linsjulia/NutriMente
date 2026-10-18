"use client";
import { faSearch, faCalendar } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
 Accordion,
 AccordionItem,
 AccordionTrigger,
 AccordionContent 

} from "@/components/ui/accordion";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import Checkbox from "../inputs/Checkbox";
import Link from "next/link";

const area = [
    { label: 'Psicologia'},
    { label: 'Nutrição'},
    { label: 'Psicologia nutricional'},
]

const tema = [
    { label: 'Comer emocional'},
    { label: 'Compulsão alimentar'},
    { label: 'Anorexia e bulimia'},
    { label: 'Imagem corporal'},
    { label: 'Ansiedade'},
]

const publico = [
    { label: 'Criança'},
    { label: 'Adolescente'},
    { label: 'Adulto'},
    { label: 'Idoso'},
]

const horarioDisponivel = [
    { label: 'Hoje'},
    { label: 'Amanhã'},
    { label: 'Fim de semana'},
]

const perfilProfissional = [
    { label: 'Feminino'},
    { label: 'Masculino'},
]

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
                {area.map((l, index) => (
                    <Checkbox key={index} label={l.label}/>
                ))}
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="tema">
            <AccordionTrigger>Tema</AccordionTrigger>
            <AccordionContent>
                <div className="flex items-center rounded-md border border-slate-300 px-2 py-1.5">
                    <input type="text" placeholder="Buscar tema..." className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400"/>
                        <Link href="">
                            <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
                        </Link>
                </div>
                {tema.map((l, index) => (
                    <Checkbox key={index} label={l.label}/>
                ))}
                <button type="button" className="pt-1 text-xs font-semibold text-green-600">Ver todos os temas</button>
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="publico">
            <AccordionTrigger>Público</AccordionTrigger>
            <AccordionContent>
                {publico.map((l, index) => (
                    <Checkbox key={index} label={l.label}/>
                ))}
            </AccordionContent>
        </AccordionItem >

        <AccordionItem value="preco-consulta">
            <AccordionTrigger>Preço da Consulta</AccordionTrigger>
            <AccordionContent>
                <div className="relative w-fit">
                <input type="range"/>
                </div>
                <div className="flex justify-between pt-2 text-xs font-semibold text-slate-700">
                <span>R$ 80</span>
                <span>R$ 300</span>
                </div>
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="horario-disponivel">
                <AccordionTrigger>Horário Disponível</AccordionTrigger>
                <AccordionContent>
                    {horarioDisponivel.map((l, index) => (
                        <Checkbox key={index} label={l.label}/>
                    ))}
                    <ToggleGroup multiple>
                        <ToggleGroupItem value="manha">Manhã</ToggleGroupItem>
                        <ToggleGroupItem value="tarde">Tarde</ToggleGroupItem>
                        <ToggleGroupItem value="noite">Noite</ToggleGroupItem>
                    </ToggleGroup>
                    <button type="button" className="flex items-center gap-2 pt-1 text-xs font-semibold text-green-600">
                        <FontAwesomeIcon icon={faCalendar} /> 
                        Selecionar data
                    </button>
                </AccordionContent>
        </AccordionItem>

        <AccordionItem value="duracao-consulta">
                <AccordionTrigger>Duração da Consulta</AccordionTrigger>
                <AccordionContent>
                    <ToggleGroup multiple>
                        <ToggleGroupItem value="trinta-min">Até 30 min</ToggleGroupItem>
                        <ToggleGroupItem value="sessenta-min">Até 60 min</ToggleGroupItem>
                        <ToggleGroupItem value="mais-sessenta-min">Mais de 60 min</ToggleGroupItem>
                    </ToggleGroup>
                </AccordionContent>
        </AccordionItem>

        <AccordionItem>
            <AccordionTrigger>Perfil do Profissional</AccordionTrigger>
            <AccordionContent>
                {perfilProfissional.map((l, index) => (
                    <Checkbox key={index} label={l.label}/>
                ))}
            </AccordionContent>
        </AccordionItem>
       </Accordion> 
    </aside>
  );
}