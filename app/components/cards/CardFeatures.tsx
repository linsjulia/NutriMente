
import { FileText, LucideIcon } from 'lucide-react'


interface CardProps{
    titulo: string;
    descricao: string;
    corFundo?: 'branco' | 'azul';
    corIcon?: string;
    icone?: LucideIcon;
}


export default function CardFeatures({titulo, descricao, corFundo, corIcon = 'branco', icone: Icone} : CardProps){
    return(
        <div>
            <div className={`cards-landing2 ${corFundo == 'azul' ? 'bg-blue-100' : 'bg-white'} shadow-lg shadow-blue-900/5 flex-1 transition duration-300 hover:-translate-y-1`}>
                <div className={`${corIcon} rounded-lg p-5`}>
                    {Icone && <Icone size={60}/>}    
                </div>

                <div>
                    <div className="flex flex-row gap-5 items-center text-[18px]">

                        <h1 className="text-center font-bold">{titulo}</h1>
                    </div>
                    <div>
                        <h2 className='text-gray-600'>{descricao}</h2>
                    </div>
                </div>
            </div>
        </div>

)

}