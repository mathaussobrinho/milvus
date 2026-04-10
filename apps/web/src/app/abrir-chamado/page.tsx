import { Suspense } from "react";
import { AbrirChamadoClient } from "./AbrirChamadoClient";

export default function AbrirChamadoPage() {
  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-surface px-4 py-4">
        <p className="text-center text-sm font-semibold text-primary">VisoHelp</p>
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
