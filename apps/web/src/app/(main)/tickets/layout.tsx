import { Suspense } from "react";
import { TicketsModuleShell } from "./TicketsModuleShell";

function TicketsShellFallback() {
  return (
    <div className="border-b border-border bg-surface px-6 py-4 text-sm text-muted">
      Carregando tickets…
    </div>
  );
}

export default function TicketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<TicketsShellFallback />}>
      <TicketsModuleShell>{children}</TicketsModuleShell>
    </Suspense>
  );
}
