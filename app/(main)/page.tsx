import Hero from "../components/landing/HeroSection";
import CTASection from "../components/landing/CTASection";
import GettingStartedSection from "../components/landing/GettingStartedSection";
import PatientFeaturesSection from "../components/landing/PatientFeaturesSection";
import ProfessionalFeaturesSection from "../components/landing/ProfessionalFeaturesSection";
import SpecialistsSection from "../components/landing/SpecialistsSection";
import ReviewsSection from "../components/landing/ReviewsSection";


export default function Landing() {
  return (
    // id="conteudo": destino do link "Pular para o conteúdo" (SkipLink)
    <main id="conteudo">
      <Hero/>

      {/* Primeiros passos do site */}
      <GettingStartedSection/>

      {/*Apresen. Funcionalidades Pacientes */}
      <PatientFeaturesSection/>
      

      {/* Apresent. Funcionalidades Profissionais */}
      <ProfessionalFeaturesSection/>
      
      {/* Mostra especialistas */}
      <SpecialistsSection/>


      {/* Secao cards de avaliacoes */}
      <ReviewsSection/>

      {/* Secao CTA Final */}
      {/* No desktop a chamada final ocupa uma tela e fica centralizada;
          no celular segue o fluxo normal (sem espaço vazio) */}
      <div className="grid items-center lg:min-h-screen">
        <CTASection/>
      </div>


      
    </main>
  );
}
