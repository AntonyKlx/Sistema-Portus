import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function AcessoNegadoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert size={32} className="text-red-500" />
      </div>
      <h1 className="text-2xl font-semibold text-gray-900">Acesso negado</h1>
      <p className="max-w-md text-sm text-gray-500">
        Seu perfil não tem permissão para acessar esta funcionalidade. Se você
        acredita que isso é um erro, procure o administrador do sistema.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-[8px] bg-[#6B2FA0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#5a2688]"
      >
        Voltar ao início
      </Link>
    </main>
  );
}