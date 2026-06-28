import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const perfil = session.user.perfil;

  if (perfil === "morador") {
    redirect("/morador/encomendas");
  } else {

    redirect("/porteiro/dashboard");
  }
}