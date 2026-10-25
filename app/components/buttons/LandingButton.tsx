import Link from "next/link";
import { CalendarCheck } from "lucide-react";

type LandingButtonProps = {
  href: string;
  label?: string;
  className?: string;
};

export default function LandingButton({
  href,
  className = "",
}: LandingButtonProps) {
  return (
    <Link
      href={href}
      // Texto azul-escuro sobre o verde (branco dava 1,76:1; o mínimo é 4,5:1)
      className={`group inline-flex w-fit items-center gap-3 rounded-full bg-[#00e15c] px-8 py-4 text-base font-bold text-blue2 shadow-[0_10px_25px_-5px_rgba(0,225,92,0.55)] transition-all hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue1 ${className}`}
    >
      <CalendarCheck className="h-6 w-6" aria-hidden="true" />
      <span>Agendar consulta</span>
    </Link>
  );
}