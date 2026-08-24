"use client"

import Logo from "./Logo"
import { useRouter } from "next/navigation";


export default function Header(){
    const router = useRouter();
    return(
        <div>
           <header className="bg-blue1 text-white h-20 flex items-center justify-between top-0 px-8 sticky z-20">
                <Logo/>
            <nav className="flex items-center gap-14 text-white">
                <a href="#">Home</a>
                <a href="#">Profissionais</a>
                <a href="#">Sobre nós</a>
            </nav>
            <button onClick={() => router.push("/cadastro")} className="bg-green1 p-3 px-10 rounded-4xl font-bold cursor-pointer">Cadastre-se</button>
            </header> 

        </div>
    )
}