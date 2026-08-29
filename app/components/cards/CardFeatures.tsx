interface CardProps{
    titulo: string;
    descricao: string;
    cor?: 'branco' | 'azul';
}


export default function CardFeatures({titulo, descricao, cor = 'branco'} : CardProps){
    return(
        <div>
            <div className={`cards-landing2 ${cor == 'azul' ? 'bg-blue3' : 'bg-white'}`}>
                <div className="flex flex-row gap-5 items-center text-[18px]">
                    <h1 className="text-center font-bold">{titulo}</h1>
                </div>
                <div>
                    <h2>{descricao}</h2>
                </div>
            </div>
        </div>

)

}