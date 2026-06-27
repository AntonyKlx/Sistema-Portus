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
  ShieldCheck,
  UserCog,
  ScrollText,
  LogOut,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Encomendas", href: "/encomendas", icon: Package },
  { label: "Reservas", href: "/reservas", icon: CalendarDays },
  { label: "Moradores", href: "/moradores", icon: Users },
  { label: "Apartamentos", href: "/apartamentos", icon: Building2 },
  { label: "Áreas Comuns", href: "/areas-comuns", icon: Layers },
  { label: "Perfis de Acesso", href: "/administradores", icon: ShieldCheck },
  { label: "Administradores", href: "/admins", icon: UserCog, perfis: ["adminMaster"] },
  { label: "Logs", href: "/logs", icon: ScrollText },
];

const moradorNavItems = [
  { label: "Encomendas", href: "/encomendas", icon: Package },
  { label: "Painel", href: "/dashboard/morador", icon: LayoutDashboard },
  { label: "Reservas", href: "/reservas", icon: CalendarDays },
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
    // 1. Aumentamos a largura para 260px (w-[260px]) e removemos o padding horizontal (px-4)
    <aside className="flex flex-col w-[260px] min-h-screen bg-[#FDFDFD] border-r border-gray-200">
      
      {/* Logo */}
      <div className="flex items-center justify-center pt-8 pb-10">
        <Image
          src="/logo.png"
          alt="Portus"
          width={220} // Largura original de referência
          height={80} // Altura original de referência para não forçar um quadrado
          // 2. Usamos w-48 (192px) e h-auto para a imagem escalar corretamente sem perder proporção
          className="w-48 h-auto object-contain"
          priority
        />
      </div>

      {/* Navigation */}
      {/* O flex-1 empurra o botão de logout lá para o final */}
      <nav className="flex flex-col flex-1">
        {itensVisiveis.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href.startsWith("/dashboard") && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              // 3. Adicionamos pl-8 para empurrar o texto, e removemos os cantos arredondados para ficar igual ao protótipo
              className={`flex items-center gap-4 py-3.5 pl-8 text-[15px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-[#F3E8FF] text-[#5B21B6] border-l-4 border-[#5B21B6]" // Roxo do Next/Tailwind
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

      {/* Logout */}
      {/* 4. Removemos as bordas de cima para o visual mais limpo visto no Figma */}
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
