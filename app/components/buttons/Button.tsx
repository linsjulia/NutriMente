
interface Prop{
    titulo: string
}


export default function Button({titulo} : Prop){
    return(
        <button className="bg-green1 p-5 px-8 rounded-full font-bold text-white text-[18px] cursor-pointer hover:bg-green3 transition ease-in-out duration-200">
            {titulo}
        </button>
    )
}