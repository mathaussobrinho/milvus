import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Limpar dados do navegador | VisoHelp",
  description:
    "Remove dados locais do portal Abrir chamado apos desinstalar o agente.",
  robots: { index: false, follow: false },
};

export default function LimparDadosPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
