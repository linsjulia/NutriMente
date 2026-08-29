interface Props{
    titulo: string
    descricao: string
    categoria: string
    categoria2: string
    img: string
}


export default function Card_Profi({titulo, descricao, categoria, categoria2, img} : Props){
    return(
        <div>
            <div className="flex flex-col w-105 h-150.5 border border-gray-400 rounded-2xl gap-4 p-8">
                
                <div className="flex items-center justify-center my-4">
                    <img src={img} className="rounded-full bg-green-700 w-20 justify-center"/>
                </div>

                        <h1 className="font-semibold font-fraunces text-[18px] text-center">{titulo}</h1>

                    <div className="mt-4 h-37.5">
                        <h2>{descricao}</h2>
                    </div>


                <div className="flex flex-col gap-5">
                    <div className="bg-[#ACFFCE] text-[#3B8F7E] rounded-full px-3 py-2 text-[13px] text-center">
                        <h2>{categoria}</h2>
                    </div>

                    <div className="bg-[#ACFFCE] text-[#3B8F7E] rounded-full px-3 py-2 text-[13px] text-center">
                        <h2>{categoria2}</h2>
                    </div>
                </div>


                <p className="underline">Ver perfil</p>
            </div>




        </div>
    )
}