"use client"
import { useRouter } from 'next/navigation';

interface Router{
  href: string;
}


export default function LandingButton({href}: Router) {
  const router = useRouter();
  return (
    <div>
      <button className="button-test flex items-center rounded-4xl mb-10 p-2 font-bold cursor-pointer"
        onClick={() => router.push(href)}
      >
        <img src="/icons/cronograma.png" alt="" className="w-10 mx-2"/>
        <span className="button__text">Agendar uma consulta</span>
      </button>
    </div>
  );
}
