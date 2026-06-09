"use client";

import Image from "next/image";
import { getSession, signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    const resultado = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });

    if (!resultado?.ok) {
      setErro("Email ou senha invalidos, ou usuario bloqueado.");
      setCarregando(false);
      return;
    }

    const sessao = await getSession();
    const perfil = sessao?.user?.perfil;
    const callbackUrl = searchParams.get("callbackUrl");

    router.replace(callbackUrl || `/dashboard/${perfil}`);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7FA] px-6 py-10">
      <section className="w-full max-w-[420px] rounded-[8px] border border-gray-200 bg-white p-8 shadow-card">
        <div className="mb-8 flex justify-center">
          <Image src="/logo.png" alt="Portus" width={190} height={70} className="h-auto w-44 object-contain" priority />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input"
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label htmlFor="senha" className="mb-2 block text-sm font-semibold text-gray-700">
              Senha
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="input"
              placeholder="Digite sua senha"
              autoComplete="current-password"
              required
            />
          </div>

          {erro && <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{erro}</div>}

          <button type="submit" className="btn-primary justify-center" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

function LoginShell() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7FA] px-6 py-10">
      <section className="h-[430px] w-full max-w-[420px] rounded-[8px] border border-gray-200 bg-white p-8 shadow-card" />
    </main>
  );
}
