import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Carregando...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
