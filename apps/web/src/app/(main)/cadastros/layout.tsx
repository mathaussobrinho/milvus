import { AppHeader } from "@/components/shell/AppHeader";

export default function CadastrosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader
        title="Cadastros"
        subtitle="Dados mestres do VisoHelp (entrega incremental)."
      />
      <div className="flex-1">{children}</div>
    </>
  );
}
