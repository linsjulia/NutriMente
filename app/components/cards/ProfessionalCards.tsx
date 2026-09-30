import CategoryBadge from "../badge/CategoryBagde";

interface Props{
    titulo: string
    tipoProfissional: string;
    documento: string;
    descricao: string
    categoria: string
    segundaCategoria: string
    img: string
}

export default function CardProfi({titulo, tipoProfissional, documento, descricao, categoria, segundaCategoria, img} : Props){
    return(
        <div>
            <div className="flex flex-col w-105 h-150.5 border border-gray-400 rounded-2xl gap-4 p-8 shadow-xl ">
                <div className="flex items-center justify-center my-4 gap-10">
                    <img src={img} alt={`Foto de ${titulo}`} className="rounded-full bg-green-700 w-20 justify-center"/>
                    <div>
                        <h1 className="font-semibold font-fraunces text-[18px] text-center">{titulo}</h1>
                        <p>{tipoProfissional}</p>
                        <p>{documento}</p>
                    </div>
                </div>

                    <div className="mt-4 h-37.5">
                        <h2>{descricao}</h2>
                    </div>

                <div className="flex flex-col gap-5">
                    <CategoryBadge
                    categoria={categoria}
                    />

                    <CategoryBadge
                    categoria={segundaCategoria}
                    />

                </div>

                <div className="flex gap-5">
                    <button className="border border-gray-300 rounded-[8px] p-2 cursor-pointer transition duration-300 hover:-translate-y-0.5">Ver perfil</button>
                    <button className="border border-gray-300 rounded-[8px] p-2 cursor-pointer transition duration-300 hover:-translate-y-0.5">Agendar</button>
                </div>
            </div>
        </div>
    )
}