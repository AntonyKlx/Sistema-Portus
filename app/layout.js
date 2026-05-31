import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "Portus - Condominium Management",
  description: "Sistema de gestão de condomínios",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="flex min-h-screen bg-white">
          <Sidebar />
          <div className="flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}