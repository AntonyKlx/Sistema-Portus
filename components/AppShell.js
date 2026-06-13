"use client";

import { usePathname } from "next/navigation";

import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return children;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
