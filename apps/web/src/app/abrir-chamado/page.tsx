import { Suspense } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AbrirChamadoClient } from "./AbrirChamadoClient";

export default function AbrirChamadoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-4">
        <span className="w-24 shrink-0" aria-hidden />
        <p className="flex-1 text-center text-sm font-semibold text-primary">
          VisoHelp
        </p>
        <div className="w-24 shrink-0 flex justify-end">
          <ThemeToggle />
        </div>
      </header>
      <Suspense
        fallback={
          <p className="p-8 text-center text-sm text-muted">Carregando...</p>
        }
      >
        <AbrirChamadoClient />
      </Suspense>
    </div>
  );
}
