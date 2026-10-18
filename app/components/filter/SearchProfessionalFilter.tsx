//? Em vez de usar arrays comuns para guardar múltiplos itens selecionados, o código utiliza a classe nativa do JavaScript Set combinada com o useState
//  O Set garante alta performance (O(1)) ao verificar se um item já está selecionado através do .has(id), 
// o que evita lentidão na interface quando o usuário clica nos checkboxes
// Na função handleCheckboxChange, o código manipula o estado de forma imutável criando uma cópia do Set atual (new Set(currentSet)), adicionando ou removendo o item, e enviando o novo conjunto para a função atualizadora (setter).

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
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useState } from "react";

const area = [
    { id: 'psicologia', label: 'Psicologia'},
    { id: 'nutricao', label: 'Nutrição'},
    { id: 'psicologia-nutricional', label: 'Psicologia nutricional'},
];

const tema = [
    { id: 'comer-emocional', label: 'Comer emocional'},
    { id: 'compulsao-alimentar', label: 'Compulsão alimentar'},
    { id: 'anorexia-bulimia', label: 'Anorexia e bulimia'},
    { id: 'imagem-corporal', label: 'Imagem corporal'},
    { id: 'ansiedade', label: 'Ansiedade'},
];

const publico = [
    { id: 'crianca', label: 'Criança'},
    { id: 'adolescente', label: 'Adolescente'},
    { id: 'adulto', label: 'Adulto'},
    { id: 'idoso', label: 'Idoso'},
];

const horarioDisponivel = [
    { id: 'hoje', label: 'Hoje'},
    { id: 'amanha', label: 'Amanhã'},
    { id: 'fim-de-semana', label: 'Fim de semana'},
];

const perfilProfissional = [
    { id: 'feminino', label: 'Feminino'},
    { id: 'masculino', label: 'Masculino'},
];

export default function SearchProfessionalFilter() {
    // Slider state
    const [sliderValue, setSliderValue] = useState([0]);

    // Checkbox states organizados por categoria usando Set (performance e boas práticas do shadcn)
    const [areasSelecionadas, setAreasSelecionadas] = useState<Set<string>>(new Set());
    const [temasSelecionados, setTemasSelecionados] = useState<Set<string>>(new Set());
    const [publicoSelecionado, setPublicoSelecionado] = useState<Set<string>>(new Set());
    const [horarioSelecionado, setHorarioSelecionado] = useState<Set<string>>(new Set());
    const [perfilSelecionado, setPerfilSelecionado] = useState<Set<string>>(new Set());

    // Função genérica para alternar itens no Set
    const handleCheckboxChange = (
        id: string, 
        checked: boolean, 
        setter: React.Dispatch<React.SetStateAction<Set<string>>>, 
        currentSet: Set<string>
    ) => {
        const newSet = new Set(currentSet);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setter(newSet);
    };

    return (
    <aside className="w-full shrink-0 rounded-2xl bg-white p-10 shadow-sm md:w-64 md:self-start lg:w-72 overflow-y-auto">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-blue-900">Filtros</h2>
        <button type="button" className="text-xs font-semibold text-green-600">
          Limpar filtros
        </button>
      </div>

        <Accordion defaultValue={["area", "tema", "publico", "preco-consulta", "horario-disponivel", "duracao-consulta", "perfil-profissional"]} multiple>
            {/* ÁREA */}
            <AccordionItem value="area">
                <AccordionTrigger>Área</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2">
                    {area.map((l) => (
                        <label key={l.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <Checkbox 
                                checked={areasSelecionadas.has(l.id)}
                                onCheckedChange={(checked) => 
                                    handleCheckboxChange(l.id, checked === true, setAreasSelecionadas, areasSelecionadas)
                                }
                            />
                            {l.label}
                        </label>
                    ))}
                </AccordionContent>
            </AccordionItem>

            {/* TEMA */}
            <AccordionItem value="tema">
                <AccordionTrigger>Tema</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2">
                    <div className="flex items-center rounded-md border border-slate-300 px-2 py-1.5">
                        <input 
                            type="text" 
                            placeholder="Buscar tema..." 
                            className="w-full bg-transparent text-xs outline-none placeholder:text-slate-400 focus:outline-none focus:ring-0"
                        />
                        <Link href="">
                            <FontAwesomeIcon icon={faSearch} className="h-4 w-4" />
                        </Link>
                    </div>
                    {tema.map((l) => (
                        <label key={l.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <Checkbox 
                                checked={temasSelecionados.has(l.id)}
                                onCheckedChange={(checked) => 
                                    handleCheckboxChange(l.id, checked === true, setTemasSelecionados, temasSelecionados)
                                }
                            />
                            {l.label}
                        </label>
                    ))}
                    <button type="button" className="pt-1 text-xs font-semibold text-green-600 text-left">
                        Ver todos os temas
                    </button>
                </AccordionContent>
            </AccordionItem>

            {/* PÚBLICO */}
            <AccordionItem value="publico">
                <AccordionTrigger>Público</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2">
                    {publico.map((l) => (
                        <label key={l.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <Checkbox 
                                checked={publicoSelecionado.has(l.id)}
                                onCheckedChange={(checked) => 
                                    handleCheckboxChange(l.id, checked === true, setPublicoSelecionado, publicoSelecionado)
                                }
                            />
                            {l.label}
                        </label>
                    ))}
                </AccordionContent>
            </AccordionItem>

            {/* PREÇO DA CONSULTA */}
            <AccordionItem value="preco-consulta">
                <AccordionTrigger>Preço da Consulta</AccordionTrigger>
                <AccordionContent className="p-2">
                    <Slider
                        value={sliderValue}
                        onValueChange={(value) => setSliderValue(value as number[])}
                        min={60}
                        max={250}
                    />
                    <div className="flex justify-between pt-2 text-xs font-semibold text-slate-700">
                        <span>R$60</span>
                        <span>R${sliderValue}</span>
                    </div>
                </AccordionContent>
            </AccordionItem>

            {/* HORÁRIO DISPONÍVEL */}
            <AccordionItem value="horario-disponivel">
                <AccordionTrigger>Horário Disponível</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2">
                    {horarioDisponivel.map((l) => (
                        <label key={l.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <Checkbox 
                                checked={horarioSelecionado.has(l.id)}
                                onCheckedChange={(checked) => 
                                    handleCheckboxChange(l.id, checked === true, setHorarioSelecionado, horarioSelecionado)
                                }
                            />
                            {l.label}
                        </label>
                    ))}
                    <ToggleGroup size="sm" variant="outline" className="toggle-group mt-2" multiple>
                        <ToggleGroupItem value="manha" className="toggle-item">Manhã</ToggleGroupItem>
                        <ToggleGroupItem value="tarde" className="toggle-item">Tarde</ToggleGroupItem>
                        <ToggleGroupItem value="noite" className="toggle-item">Noite</ToggleGroupItem>
                    </ToggleGroup>
                    <button type="button" className="flex items-center gap-2 pt-1 text-xs font-semibold text-green-600">
                        <FontAwesomeIcon icon={faCalendar} /> 
                        Selecionar data
                    </button>
                </AccordionContent>
            </AccordionItem>

            {/* DURAÇÃO DA CONSULTA */}
            <AccordionItem value="duracao-consulta">
                <AccordionTrigger>Duração da Consulta</AccordionTrigger>
                <AccordionContent>
                    <ToggleGroup size="sm" variant="outline" orientation="vertical" className="toggle-group" multiple>
                        <ToggleGroupItem value="trinta-min" className="toggle-item">Até 30 min</ToggleGroupItem>
                        <ToggleGroupItem value="sessenta-min" className="toggle-item">Até 60 min</ToggleGroupItem>
                        <ToggleGroupItem value="mais-sessenta-min" className="toggle-item">Mais de 60 min</ToggleGroupItem>
                    </ToggleGroup>
                </AccordionContent>
            </AccordionItem>

            {/* PERFIL DO PROFISSIONAL */}
            <AccordionItem value="perfil-profissional">
                <AccordionTrigger>Perfil do Profissional</AccordionTrigger>
                <AccordionContent className="flex flex-col gap-2">
                    {perfilProfissional.map((l) => (
                        <label key={l.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                            <Checkbox 
                                checked={perfilSelecionado.has(l.id)}
                                onCheckedChange={(checked) => 
                                    handleCheckboxChange(l.id, checked === true, setPerfilSelecionado, perfilSelecionado)
                                }
                            />
                            {l.label}
                        </label>
                    ))}
                </AccordionContent>
            </AccordionItem>
        </Accordion> 
    </aside>
  ); 
}