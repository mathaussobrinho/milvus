import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchJson } from "@/lib/api";
import { ClientDetailView, type ClientDetail } from "./ClientDetailView";

type PageProps = { params: Promise<{ id: string }> };

export default async function ClienteDetalhePage({ params }: PageProps) {
  const { id } = await params;
  const data = await fetchJson<ClientDetail>(`/api/v1/clients/${id}`);

  if (!data) {
    notFound();
  }

  return (
    <div className="p-6">
      <nav className="mb-4 text-sm text-muted">
        <Link href="/cadastros/clientes" className="text-primary hover:underline">
          Clientes
        </Link>
        <span className="mx-2 text-border">/</span>
        <span className="text-foreground">{data.name}</span>
      </nav>
      <ClientDetailView initial={data} />
    </div>
  );
}
