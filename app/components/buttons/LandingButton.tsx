import { useRouter } from 'next/navigation';

interface Router{
  router_string: string;
}


export default function LandingButton({router_string}: Router) {
  const router = useRouter();
  return (
    <div>
      <button className="button-test flex items-center rounded-4xl mb-10 p-2font-bold"
        onClick={() => router.push(router_string)}
      >
        <img src="/icons/cronograma.png" alt="" className="w-10 mx-2"/>
        <span className="button__text">Agendar uma consulta</span>
      </button>
    </div>
  );
}
