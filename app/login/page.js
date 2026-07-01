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
  const [erro, setErro] = useState(
    searchParams.get("motivo") === "inatividade"
      ? "Sua sessão foi encerrada por inatividade. Faça login novamente."
      : ""
  );
  const [carregando, setCarregando] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

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
      setErro("Email ou senha inválidos, ou usuário bloqueado.");
      setCarregando(false);
      return;
    }

    const sessao = await getSession();
    const perfil = sessao?.user?.perfil;
    const callbackUrl = searchParams.get("callbackUrl");

    if (perfil === "morador") {
      router.push("/morador");
    } else {
      // Porteiro, sindico e adm
      router.push("/porteiro/dashboard");
    }
  }

  return (
    <main className="flex min-h-screen">
      {/* Painel esquerdo — imagem */}
      <div className="relative hidden w-[55%] flex-col lg:flex">
        <Image
          src="/login/login_image.png"
          alt="Condomínio"
          fill
          className="object-cover"
          priority
        />
        {/* Overlay degradê escuro na parte inferior */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1D0A2F]/70 via-[#1D0A2F]/20 to-transparent" />

        {/* Texto sobre a imagem */}
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <h2 className="text-3xl font-bold leading-snug">
            Precisão e Monitoramento<br />da sua Propriedade.
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Eleve o nível operacional e a eficiência da sua propriedade
            com uma infraestrutura digital e sofisticada.
          </p>
        </div>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex w-full flex-col items-center justify-center bg-gradient-to-b from-white to-[#F3F0FA] px-8 py-12 lg:w-[45%]">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <div className="mb-10 flex justify-center">
            <Image
              src="/logo.png"
              alt="Portus"
              width={130}
              height={100}
              className="h-auto object-contain"
              priority
            />
          </div>

          {/* Título */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-gray-800">
              Bem vindo ao Portus
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Faça o login para entrar na área de dashboard
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email
              </label>
              <div className="flex items-center gap-3 rounded-[8px] border border-gray-200 bg-white px-4 py-3 focus-within:border-[#6B2FA0] focus-within:ring-2 focus-within:ring-[#6B2FA0]/20">
                {/* Ícone envelope */}
                <svg
                  className="h-4 w-4 shrink-0 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0-9.75 6.75L2.25 6.75" />
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@portus.com"
                  autoComplete="email"
                  required
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label
                htmlFor="senha"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Senha
              </label>
              <div className="flex items-center gap-3 rounded-[8px] border border-gray-200 bg-white px-4 py-3 focus-within:border-[#6B2FA0] focus-within:ring-2 focus-within:ring-[#6B2FA0]/20">
                {/* Ícone cadeado */}
                <svg
                  className="h-4 w-4 shrink-0 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.5a4.5 4.5 0 10-9 0v3m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
                />
                {/* Botão olho */}
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="shrink-0 text-gray-400 hover:text-gray-600"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? (
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de erro */}
            {erro && (
              <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {erro}
              </div>
            )}

            {/* Botão de submit */}
            <button
              type="submit"
              disabled={carregando}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-[8px] bg-[#6B2FA0] px-6 py-4 text-base font-semibold text-white transition hover:bg-[#5a2688] disabled:opacity-60"
            >
              {carregando ? (
                "Entrando..."
              ) : (
                <>
                  Faça login na conta
                  <svg
                    className="h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function LoginShell() {
  return (
    <main className="flex min-h-screen">
      <div className="hidden w-[55%] bg-gray-200 lg:block" />
      <div className="flex w-full items-center justify-center bg-gradient-to-b from-white to-[#F3F0FA] lg:w-[45%]">
        <div className="h-[480px] w-full max-w-[400px] animate-pulse rounded-[8px] bg-gray-100 mx-8" />
      </div>
    </main>
  );
}
