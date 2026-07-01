'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, Calendar } from 'lucide-react';

export default function BottomNavMorador() {
  const pathname = usePathname();

  const corAtiva = "text-[#582688]";
  const corInativa = "text-gray-500 hover:text-[#582688]";

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-[72px] px-4 pb-safe z-20">
  
      <Link 
        href="/morador/encomendas" 
        className={`flex flex-col items-center transition-colors ${pathname.includes('/morador/encomendas') ? corAtiva : corInativa}`}
      >
        <Package size={24} />
        <span className="text-[10px] font-medium mt-1">Encomendas</span>
      </Link>

      <Link 
        href="/morador" 
        className={`flex flex-col items-center transition-colors ${pathname === '/morador' ? corAtiva : corInativa}`}
      >
        <Home size={24} />
        <span className="text-[10px] font-medium mt-1">Painel</span>
      </Link>
      
      <Link 
        href="/morador/reservas" 
        className={`flex flex-col items-center transition-colors ${pathname.includes('/morador/reservas') ? corAtiva : corInativa}`}
      >
        <Calendar size={24} />
        <span className="text-[10px] font-medium mt-1">Reservas</span>
      </Link>
      
    </nav>
  );
}