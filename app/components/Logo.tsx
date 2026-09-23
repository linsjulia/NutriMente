import Image from "next/image";


export default function Logo(){
    return(
        <Image
        src="/logo/nutrimente-v1.png"
        width={200}
        height={80}
        draggable={false}
        alt="Logo do NutriMente"
        className="h-full w-auto select-none"
        />
    )
}   