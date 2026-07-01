import "./globals.css";
import AppShell from "@/components/AppShell";
import Providers from "@/components/Providers";

export const metadata = {
  title: "Portus - Condominium Management",
  description: "Sistema de gestao de condominios",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
