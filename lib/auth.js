import bcrypt from "bcryptjs";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

const MAX_TENTATIVAS = 5;

export const authOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 60,
    updateAge: 5 * 60, 
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credenciais",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const senha = credentials?.senha;

        if (!email || !senha) {
          throw new Error("Informe email e senha.");
        }


        const usuario = await prisma.usuario.findUnique({
          where: { email },
          include: { perfil: true },
        });

        if (!usuario) {
          throw new Error("Email ou senha inválido.");
        }

        if (!usuario.ativo) {
          throw new Error("Usuário bloqueado. Procure a administração.");
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);

        if (!senhaValida) {
          const tentativasIncorretas = usuario.tentativasIncorretas + 1;

          await prisma.usuario.update({
            where: { id: usuario.id },
            data: {
              tentativasIncorretas,
              ativo: tentativasIncorretas < MAX_TENTATIVAS,
            },
          });

          if (tentativasIncorretas >= MAX_TENTATIVAS) {
            throw new Error("Usuário bloqueado após 5 tentativas incorretas.");
          }

          throw new Error("Email ou senha inválido.");
        }


        await prisma.usuario.update({
          where: { id: usuario.id },
          data: { tentativasIncorretas: 0 },
        });


        return {
          id: String(usuario.id),
          name: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil.nome,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {

      if (user) {
        token.id = user.id;
        token.perfil = user.perfil;
      }
      return token;
    },
    async session({ session, token }) {

      if (token) {
        session.user.id = token.id;
        session.user.perfil = token.perfil;
      }
      return session;
    },
  },
};