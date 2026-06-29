'use client';

import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, Building2 } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";

export default function TopNavMorador() {
  const { data: session } = useSession();
  const [menuAberto, setMenuAberto] = useState(false);

  const inicialUsuario = session?.user?.nome ? session.user.nome.charAt(0).toUpperCase() : 'U';

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 z-20 relative">
      <div className="flex items-center justify-center pt-8 pb-10">
              <Image
                src="/logo.png"
                alt="Portus"
                width={150}
                height={100}
                className=" w-32 h-auto object-contain"
                priority
              />
            </div>  

      <div className="relative">
        <button 
          onClick={() => setMenuAberto(!menuAberto)}
          className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-[#582688] bg-gray-100 overflow-hidden focus:outline-none transition-normal hover:bg-gray-200"
        >
          {session?.user?.image ? (
            <img 
              src={session.user.image} 
              alt="Avatar do usuário" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[#582688] font-bold text-lg">{inicialUsuario}</span>
          )}
        </button>

        {menuAberto && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setMenuAberto(false)}
            />
            
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-20 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm text-gray-900 font-medium">{session?.user?.nome || 'Usuário'}</p>
                <p className="text-xs text-gray-500 truncate">{session?.user?.email || ''}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} />
                Sair do sistema
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}