import { AppHeader } from "@/components/shell/AppHeader";

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader
        title="Configurações"
        subtitle="Preferências, integrações e automações."
      />
      <div className="flex-1">{children}</div>
    </>
  );
}
