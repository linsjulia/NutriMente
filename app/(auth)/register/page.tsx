import RegisterProfessional from '../components/auth/forms/RegisterProfessional';

export default function Register(){
    return(
        // id="conteudo": destino do link "Pular para o conteúdo" (SkipLink)
        <main id="conteudo">
            <div className='flex flex-row'>
                <RegisterProfessional/>
            </div>
        </main>
    )
}
