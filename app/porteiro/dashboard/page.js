"use client";

import { Package, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { PageWrapper, PageHeader } from "@/components/ui";

export default function PorteiroDashboard() {

  const { data: session } = useSession();

  const usuarioReal = {
    name: session?.user?.name,
    role: session?.user?.perfil
      ? session.user.perfil.charAt(0).toUpperCase() + session.user.perfil.slice(1)
      : ""
  };
  
  return (
    <PageWrapper>
          <PageHeader title="Dashboard" user={usuarioReal} />
    <div className="p-6 md:p-8 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Painel da Portaria</h1>
        <p className="text-gray-500 text-sm mt-1">Bem-vindo(a) ao sistema Portus.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 text-[#582688] rounded-full shrink-0">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Encomendas Recebidas Hoje</p>
            <p className="text-2xl font-bold text-gray-900">12</p>
          </div>
        </div>

  
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-full shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Visitantes no Prédio</p>
            <p className="text-2xl font-bold text-gray-900">3</p>
          </div>
        </div>

      </div>
    </div>
  </PageWrapper>
  );
}