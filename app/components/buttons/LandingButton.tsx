import Link from "next/link";
import { ArrowRight, CalendarCheck } from "lucide-react";

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
      className={`group inline-flex w-fit items-center gap-3 rounded-full bg-[#00e15c] px-8 py-4 text-base font-bold text-[#0b2545] shadow-[0_10px_25px_-5px_rgba(0,225,92,0.55)] transition-all hover:-translate-y-0.5 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00e15c] ${className}`}
    >
      <CalendarCheck className="h-5 w-5" aria-hidden="true" />
      <span>Agendar consulta</span>
      <ArrowRight
        className="h-4 w-4"
        aria-hidden="true"
      />
    </Link>
  );
}