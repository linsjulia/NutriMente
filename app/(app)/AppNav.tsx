"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Menu da área logada. aria-current="page" marca a página atual
// (o leitor de tela diz "página atual" e o CSS sublinha).
export default function AppNav({ links }: { links: { href: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Área logada" className="order-last w-full sm:order-none sm:w-auto">
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {links.map((link) => {
          const current = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`font-semibold underline-offset-8 hover:underline ${current ? "underline decoration-2" : ""}`}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
