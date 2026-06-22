"use client";

import { useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

const TEMPO_INATIVIDADE_MS = 30 * 60 * 1000; // 30 minutos — RNF03
const EVENTOS_DE_ATIVIDADE = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
];

export default function InactivityMonitor() {
  const { data: session } = useSession();
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!session) return;

    function encerrarPorInatividade() {
      signOut({ callbackUrl: "/login?motivo=inatividade" });
    }

    function reiniciarTimer() {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(encerrarPorInatividade, TEMPO_INATIVIDADE_MS);
    }

    reiniciarTimer();

    EVENTOS_DE_ATIVIDADE.forEach((evento) =>
      window.addEventListener(evento, reiniciarTimer)
    );

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      EVENTOS_DE_ATIVIDADE.forEach((evento) =>
        window.removeEventListener(evento, reiniciarTimer)
      );
    };
  }, [session]);

  return null;
}