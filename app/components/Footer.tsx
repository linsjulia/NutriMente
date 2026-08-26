import { div } from "framer-motion/client"


export default function Footer(){
    return(
    
   <div>   
        <div className="p-0 border-t-1 border-b-1 border-gray-300">
            <div className="flex flex-row gap-96 p-20 mb-50 justify-center ">
                {/* Contato */}
                <div className="flex flex-col gap-10"> 
                    <h1 className="font-bold titulo-footer">Contato</h1>
                    <div className="flex flex-row gap-5 items-center">
                        <img src="/email.png" className="w-10"/>
                        <p>nutrimente@gmail.com</p>
                    </div>  
                    <img src="/nutrimenteLogo.png" className="w-40"/>
                </div>
            
                {/* Navegue */}
                <div className="flex flex-col gap-5">
                    <h1 className="font-bold titulo-footer">Navegue</h1>
                    <a className="a-footer">Home</a>
                    <a className="a-footer">Profissionais</a>
                    <a className="a-footer">Serviços</a>
                </div>

                {/* Institucional */}
                <div className="flex flex-col gap-5">
                    <h1 className="font-bold titulo-footer">Institucional</h1>
                    <a className="a-footer">Privacidade & Política</a>
                    <a className="a-footer">Termos & Condições</a>
                    <a className="a-footer">Sobre nós</a>
                </div>
            </div>
        </div>
        <div className="p-10 text-[14px]">
            <p>@Copyrights NutriMente todos os direitos reservados 2026</p>
        </div>
    </div>  
    )
}