import { AppHeader } from "@/components/shell/AppHeader";

export default function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader
        title="Configuracoes"
        subtitle="Preferencias, integracoes e automacoes."
      />
      <div className="flex-1">{children}</div>
    </>
  );
}
