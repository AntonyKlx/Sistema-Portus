import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

export default async function DashboardPerfilPage({ params }) {
  const session = await getServerSession(authOptions);
  const { perfil } = await params;

  if (!session) {
    redirect("/login");
  }

  if (session.user.perfil !== perfil) {
    redirect(`/dashboard/${session.user.perfil}`);
  }

  return (
    <main className="page-wrapper">
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard {perfil}</h1>
          <p className="mt-1 text-sm text-gray-500">Bem-vindo, {session.user.name}.</p>
        </div>
      </header>
    </main>
  );
}
