"use client";

import { usePathname } from "next/navigation";

import Sidebar from "@/components/Sidebar";
import InactivityMonitor from "@/components/InactivityMonitor";

export default function AppShell({ children }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return children;
  }

  return (
    <div className="flex min-h-screen bg-white">
      <InactivityMonitor />
      <Sidebar />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}