import Hero from "../components/landing/HeroSection";
import FadeScrollProps from "../components/fade-effect/FadeScroll";
import Footer from "../components/Footer";
import CTASection from "../components/landing/CTASection";
import GettingStartedSection from "../components/landing/GettingStartedSection";
import PatientFeaturesSection from "../components/landing/PatientFeaturesSection";
import ProfessionalFeaturesSection from "../components/landing/ProfessionalFeaturesSection";
import SpecialistsSection from "../components/landing/SpecialistsSection";
import ReviewsSection from "../components/landing/ReviewsSection";
import TestButton from "../components/buttons/LandingButton";


export default function Landing() {
  return (
    <main>
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
      <CTASection/>


      {/* Footer  */}
      <Footer/>

      
    </main>
  );
}
