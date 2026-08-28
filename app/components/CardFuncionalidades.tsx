interface CardProps{
    titulo: string;
    descricao: string;
    image: string
    cor?: 'branco' | 'azul';
}


export default function Card({titulo, descricao, image, cor = 'branco'} : CardProps){
    return(
        <div>
            <div className={`cards-landing2 ${cor == 'azul' ? 'bg-blue3' : 'bg-white'}`}>
                <div className="flex flex-row gap-5 items-center text-[18px]">
                    <img src={image} alt="" className="numbers-icon"/>
                    <h1>{titulo}</h1>
                </div>
                
                <div>
                    <h2>{descricao}</h2>
                </div>

            </div>
        </div>

)

}