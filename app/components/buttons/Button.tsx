
interface InfoButton{
    titulo: string
}


export default function Button({titulo} : InfoButton){
    return(
        <button className="bg-green1 rounded-2xl py-4 px-15 text-center text-white font-bold cursor-pointer">
            {titulo}
        </button>
    )
}