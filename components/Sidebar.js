"use client";

import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  CalendarDays,
  Users,
  Building2,
  Layers,
  UserCog,
  ScrollText,
  LogOut,
  Database,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/porteiro/dashboard", icon: LayoutDashboard },
  { label: "Encomendas", href: "/porteiro/encomendas", icon: Package },
  { label: "Reservas", href: "/porteiro/reservas", icon: CalendarDays },
  { label: "Moradores", href: "/porteiro/moradores", icon: Users },
  { label: "Apartamentos", href: "/porteiro/apartamentos", icon: Building2 },
  { label: "Áreas Comuns", href: "/porteiro/areas-comuns", icon: Layers },
  { label: "Administradores", href: "/administradores", icon: ShieldCheck },
  { label: "Logs", href: "/porteiro/logs", icon: ScrollText },
];

const moradorNavItems = [
  { label: "Encomendas", href: "morador/encomendas", icon: Package },
  { label: "Painel", href: "dashboard/morador", icon: LayoutDashboard },
  { label: "Reservas", href: "morador/reservas", icon: CalendarDays },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const perfil = session?.user?.perfil;

  const itensVisiveis =
    perfil === "morador"
      ? moradorNavItems
      : navItems.filter((item) => !item.perfis || item.perfis.includes(perfil));

  return (
    <aside className="flex flex-col w-[260px] min-h-screen bg-[#FDFDFD] border-r border-gray-200">
      
      <div className="flex items-center justify-center pt-8 pb-10">
        <Image
          src="/logo.png"
          alt="Portus"
          width={220}
          height={80}
          className="w-48 h-auto object-contain"
          priority
        />
      </div>

      <nav className="flex flex-col flex-1">
        {/* Usamos o navItems direto aqui */}
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-4 py-3.5 pl-8 text-[15px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#F3E8FF] text-[#5B21B6] border-l-4 border-[#5B21B6]"
                  : "text-gray-500 hover:bg-gray-50 border-l-4 border-transparent hover:text-gray-900"
              }`}
            >
              <Icon
                size={22}
                className={isActive ? "text-[#5B21B6]" : "text-gray-400"}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pb-8">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-4 py-3.5 pl-8 text-[15px] font-medium text-gray-500 border-l-4 border-transparent hover:text-red-600 hover:bg-red-50 transition-all duration-150 w-full group"
        >
          <LogOut size={22} className="text-gray-400 group-hover:text-red-600 transition-colors" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}