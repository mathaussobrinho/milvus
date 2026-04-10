import { Suspense } from "react";
import { RedefinirSenhaForm } from "./RedefinirSenhaForm";

export default function RedefinirSenhaPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Carregando...
        </div>
      }
    >
      <RedefinirSenhaForm />
    </Suspense>
  );
}
