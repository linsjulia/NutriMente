"use client";
import { useState, useMemo } from "react";
import GenderButton from "../../buttons/GenderButton";
import Button from "../../buttons/Button";
import RegisterIconNumbers from "../../icons/RegisterIconNumbers";
import { ArrowRight, User } from "lucide-react";
import Logo from "../../Logo";


  type RegisterData = {
    name: string;
    email: string;
    password: string;
    telephone: string;
    cpf: string;
    birth_date: string;
    bio: string;
    professional_type: string;
    document_professional: string;
  };

  const initialData: RegisterData = {
    name: "",
    email: "",
    password: "",
    telephone: "",
    cpf: "",
    birth_date: "",
    bio: "",
    professional_type: "",
    document_professional: "",
  };

  function maskCpf(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
 
function maskPhone(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export default function RegisterProfessional() {  
  const [step, setStep] = useState(1);
  const [data, setData] = useState<RegisterData>(initialData);
  const [done, setDone] = useState(false);


  const stepValid = useMemo(() => {
    if (step === 1)
      return (
        data.name.trim().length > 2 &&
        /\S+@\S+\.\S+/.test(data.email) &&
        data.password.length >= 6
      );
    if (step === 2)
      return (
        data.cpf.replace(/\D/g, "").length === 11 &&
        data.birth_date &&
        data.telephone.replace(/\D/g, "").length >= 10
      );
    if (step === 3)
      return (
        data.professional_type && data.document_professional.trim().length >= 3
      );
    return false;
  }, [step, data]);

  const next = () => step < 3 && setStep(step + 1);
  const back = () => step > 1 && setStep(step - 1);
  const submit = () => stepValid && setDone(true);
  console.log("state atual:", data);
  
  return (
    <section className="min-h-screen flex flex-row min-w-screen">
      <div className="bg-blue1 flex flex-col gap-10 p-20 text-white w-230 relative min-h-screen">
        <h1 className="text-white font-fraunces text-3xl">
          Cadastro de Profissionais
        </h1>
        <p className="text-[18px]">Sua jornada profissional começa aqui</p>

        <div className="flex flex-col gap-10">
          <RegisterIconNumbers number="1" title="Acesso" />
          <RegisterIconNumbers number="2" title="Identificação" />
          <RegisterIconNumbers number="3" title="Atuação" />
        </div>
        <img
          src="/icons/line.svg"
          className="absolute inset-0 w-full h-full pointer-none z-1"
        />
        <img
          src="/logo/nutrimente-v1.png"
          className="w-30 absolute bottom-10 left-10 z-2"
        />

        {/* <img src="/logo/nutrimente-v1.png" cl/> */}
      </div>

      <div className="bg-blue-100 p-20 px-60 w-full">
        {/* {step === 1 && (
          <>
            <div className="flex flex-col p-10 gap-5">
              <p className="tracking-widest text-green-600 font-bold">ETAPA 1 de 3</p>
              <h2 className="font-bold text-2xl">Dados de Acesso</h2>
              <form action="" className="form-register">
                <div className="flex flex-col gap-5">
                  <label htmlFor="name">Nome Completo</label>
                  <User size={16} />
                  <input
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Digite seu nome completo"
                  />
                </div>

                <div className="flex flex-col gap-5">
                  <label htmlFor="email">E-mail</label>
                  <input
                    value={data.email}
                    onChange={(e) =>
                      setData({ ...data, email: e.target.value })
                    }
                    type="email"
                    name="email"
                    id="email"
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </div>

                <div className="flex flex-col gap-5">
                  <label htmlFor="password">Senha</label>
                  <input
                    value={data.password}
                    onChange={(e) =>
                      setData({ ...data, password: e.target.value })
                    }
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Digite sua senha"
                  />
                </div>
              </form>
            </div>
          </>
        )}

        {step === 2 && (
          <>
              <div className="flex flex-col p-10 gap-5">
                <p className="tracking-widest text-green-600 font-bold">ETAPA 2 de 3</p>

                <h2 className="font-bold text-2xl">Identificação</h2>

                <form action="" className="form-register ">
                  <div className="flex flex-row w-full gap-5">
                    <div className="flex-1 flex flex-col gap-3">
                      <label htmlFor="name">Telefone</label>
                      <input
                        value={data.telephone}
                        onChange={(e) => setData({...data, telephone: maskPhone(e.target.value)})}
                        type="text"
                        name="name"
                        id="name"
                        placeholder="11 99999-9999"
                      />
                    </div>

                    <div className="flex-1 flex flex-col gap-3">
                      <label htmlFor="email">CPF</label>
                      <input
                        value={data.cpf}
                        onChange={(e) =>
                          setData({ ...data, cpf: maskCpf(e.target.value) })
                        }
                        type="email"
                        name="email"
                        id="email"
                        placeholder="000.000.000-00"
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-5">
                    <label htmlFor="password">Data de Nascimento</label>
                    <input 
                      onChange={(e) => setData({...data, birth_date: e.target.value})}
                      type="date" 
                      name="birthdate" 
                      id="birthdate" />
                  </div>

                  <div className="flex flex-col gap-5">
                    <label htmlFor="password">Bio</label>
                    <textarea
                      value={data.bio}
                      onChange={(e) =>
                        setData({ ...data, bio: e.target.value })
                      }
                      id="bio"
                      name="bio"
                      maxLength={500}
                      rows={4}
                      placeholder="Uma breve apresentação para seus pacientes"
                      className="bio"
                    />
                  </div>
                </form>
              </div>
          </>
        )} */}


              <div className="flex flex-col gap-5 m-0 p-0">
                <p className="tracking-widest text-green-600 font-bold">ETAPA 3 de 3</p>
                <h2 className="font-bold text-2xl">Atuação Profissional</h2>

                <div className="flex flex-row gap-10 m-0 p-0">
                  {/* <div className={`professional_type ${data.professional_type === "Nutricionista" ? "selected" : ""}`}>
                    <input type="radio" name="professional_type" value="Nutricionista" checked={data.professional_type === "Nutricionista"} 
                     onChange={(e) => {console.log('Valor digitado: ', e.target.value)
                     setData({...data, professional_type: e.target.value})}} 
                     className="input_type"/>
                    <img src="/doctor/nutricionista-register.png"/>
                  </div> */}

                  <div 
                    className={`professional_type ${data.professional_type === "Nutricionista" ? "selected" : ""}`}
                    onClick={() => setData({...data, professional_type: "Nutricionista"})}
                  > 
                    <img src="/doctor/nutricionista-register.png"/>
                    <span className="overlay-text nutri">Acompanhamento alimentar e nutricional</span>
                  </div>

                  <div 
                    className={`professional_type ${data.professional_type === "Psicologo" ? "selected" : ""}`}
                    onClick={() => setData({...data, professional_type: "Psicologo"})}
                  > 
                    <img src="/doctor/psicologo-register.png"/>
                    <span className="overlay-text psi">Acompanhamento psicológico</span>
                  </div>
                </div>

              </div>
    


        {step > 1 && (
          <div className="flex justify-end">
            <button 
            className="flex flex-row bg-green1 p-5 rounded-2xl text-white font-bold items-center gap-3 w-35 cursor-pointer"
            onClick={back}
            >
              Voltar <ArrowRight size={20}/>
            </button>
          </div>
        )} 

        {step < 3 ? (
          <div className="flex justify-end">
            <button
            className="flex flex-row bg-blue-500 p-5 rounded-2xl text-white font-bold items-center gap-3 w-35 cursor-pointer"
            onClick={next}
            disabled={!stepValid}
            >
              Continuar <ArrowRight size={20}/>
            </button>
          </div>

        ) : (
          <div className="flex justify-end">
            <button 
            className="flex flex-row bg-green1 p-5 rounded-2xl text-white font-bold items-center gap-3 w-35 cursor-pointer"
            onClick={submit}
            disabled={!stepValid}
            >
              Concluir cadastro <ArrowRight size={20}/>
            </button>
          </div>
        )}
        
      </div>
    </section>
  );
}
