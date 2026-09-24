"use client";
import { useState, useMemo, useEffect } from "react";
import GenderButton from "../../buttons/GenderButton";
import RegisterIconNumbers from "../../icons/RegisterIconNumbers";
import { ArrowRight, User, BadgeCheck, ArrowLeft, Mail, Lock, Smartphone, UserSearch, Cake, SquarePen } from "lucide-react";
import { Highlighter } from "@/components/ui/highlighter"

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

    useEffect(() => {
    setData((prev) => ({ ...prev, document_professional: "" }));
  }, [data.professional_type]);

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
  console.log("state atual:", data.professional_type, data.document_professional);
  
  return (
    <section className="min-h-screen flex flex-row min-w-screen">
      <div className="bg-blue-200 flex flex-col gap-10 p-20 text-blue2 w-230 relative min-h-screen">
        <h1 className="text-blue1 font-fraunces text-4xl">
          Cadastro para Profissionais
        </h1>
        <p className="text-[18px]">Sua jornada profissional começa aqui</p>

        <div className="flex flex-col gap-10">
          <RegisterIconNumbers number="1" title="Acesso" active={step >= 1} />
          <RegisterIconNumbers number="2" title="Identificação" active={step >= 2} />
          <RegisterIconNumbers number="3" title="Atuação" active={step >=3}/>
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

      <div className="flex flex-col p-15 px-60 gap-10 w-full">
        {step === 1 && (
          <>
            <div className="flex flex-col gap-5">
              <p className="info-steps">ETAPA 1 de 3</p>
              <h2 className="font-bold text-2xl">Dados de Acesso</h2>
              <form action="" className="form-register">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-row gap-5 items-center">
                    <User size={30} />
                    <label htmlFor="name">Nome Completo</label>
                  </div>

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
                  <div className="flex flex-row gap-5 items-center">
                    <Mail size={25}/>
                    <label htmlFor="email">E-mail</label>
                  </div>
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
                  <div className="flex flex-row gap-5 items-center">
                    <Lock size={25}/>
                    <label htmlFor="password">Senha</label>
                  </div>
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
              <div className="flex flex-col gap-5">
                <p className="info-steps">ETAPA 2 de 3</p>

                <h2 className="font-bold text-2xl">Identificação</h2>

                <form action="" className="form-register">
                  <div className="flex flex-row w-full gap-10">
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex flex-row gap-5 items-center">
                        <Smartphone size={30}/>
                        <label htmlFor="name">Telefone</label>
                      </div>

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
                      <div className="flex flex-row gap-5 items-center">
                        <UserSearch size={30}/>
                        <label htmlFor="email">CPF</label>
                      </div>
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
                    <div className="flex flex-row gap-5 items-center"> 
                      <Cake size={30}/>
                      <label htmlFor="password">Data de Nascimento</label>
                    </div>
                    <input 
                      onChange={(e) => setData({...data, birth_date: e.target.value})}
                      type="date" 
                      name="birthdate" 
                      id="birthdate" />
                  </div>

                   <div className="flex flex-col gap-5">
                    <label htmlFor="">Gênero</label>
                    <GenderButton/>
                  </div>     

                  <div className="flex flex-col gap-5">
                    <div className="flex flex-row gap-5 items-center">
                      <SquarePen/>
                      <label htmlFor="bio">Bio</label>
                    </div>
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
        )} 

          {step === 3 && (
              <div className="flex flex-col gap-5 m-0 p-0">
                <p className="info-steps">ETAPA 3 de 3</p>
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

                {data.professional_type === 'Nutricionista' && (
                  <>
                  <div className="form-register">
                    <label>N° do CRN</label>
                    <input type="text" placeholder="Exemplo: 0-00000" value={data.document_professional} onChange={(e) => setData({...data, document_professional: e.target.value})}/>
                  </div>
                   
                  </>
                )}
       
                {data.professional_type === 'Psicologo' && 
                  <>
                  <div className="form-register">
                    <label>N° do CRP</label>
                    <input type="text" placeholder="Exemplo: 00/000000" value={data.document_professional} onChange={(e) => setData({...data, document_professional: e.target.value})}/>
                  </div>
                  </>
                }

              </div>
          )}


        <div className="flex flex-row justify-between gap-10">
          {step > 1 ? (
            <div className="flex">
              <button 
              className="flex flex-row justify-center rounded-2xl text-blue1 text-[18px] font-bold items-center gap-3 cursor-pointer"
              onClick={back}
              >
                <ArrowLeft size={20}/>Voltar 
              </button>
            </div>
   
          ) : <span/> } 

          {step < 3 ? (
            <div className="flex">
              <button
              className="flex flex-row justify-end text-end bg-green1 p-5 rounded-2xl text-[18px] text-white font-bold items-center gap-3  cursor-pointer"
              onClick={next}
              disabled={!stepValid}
              >
                Continuar <ArrowRight size={20}/>
              </button>
            </div>

          ) : (
            <div className="flex justify-end">
              <button 
              className="flex flex-row bg-green1 p-5 rounded-2xl text-[18px] text-white font-bold items-center gap-3 cursor-pointer"
              onClick={submit}
              disabled={!stepValid}
              >
                Concluir cadastro <BadgeCheck size={30}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
