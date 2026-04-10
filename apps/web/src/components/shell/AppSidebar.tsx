"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SidebarProfile } from "@/components/shell/SidebarProfile";

const mainNav = [
  { href: "/dashboard", label: "Painel" },
  { href: "/tickets", label: "Tickets" },
  { href: "/inventario", label: "Inventario" },
];

const cadastrosSub = [
  { href: "/cadastros/perfis-operadores", label: "Perfis de analistas" },
  { href: "/cadastros/analistas", label: "Analistas" },
  { href: "/cadastros/equipes-operadores", label: "Equipes de analistas" },
  { href: "/cadastros/clientes", label: "Clientes" },
  { href: "/cadastros/setores-solicitantes", label: "Setores dos solicitantes" },
  { href: "/cadastros/feriados", label: "Feriados" },
  { href: "/cadastros/expedientes", label: "Expedientes" },
  { href: "/cadastros/documentos", label: "Documentos" },
];

const configSub = [
  { href: "/configuracoes/perfil", label: "Perfil" },
  { href: "/configuracoes/agente", label: "Agente" },
  { href: "/configuracoes/integracoes", label: "Integracoes" },
  { href: "/configuracoes/automacoes", label: "Automacoes" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const cadastrosActive = pathname.startsWith("/cadastros");
  const configActive = pathname.startsWith("/configuracoes");
  const [cadastrosOpen, setCadastrosOpen] = useState(cadastrosActive);
  const [configOpen, setConfigOpen] = useState(configActive);

  function collapseSubmenus() {
    setCadastrosOpen(false);
    setConfigOpen(false);
  }

  useEffect(() => {
    if (!pathname.startsWith("/cadastros")) setCadastrosOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!pathname.startsWith("/configuracoes")) setConfigOpen(false);
  }, [pathname]);

  return (
    <aside className="relative flex min-h-screen w-56 shrink-0 flex-col border-r border-border bg-surface text-foreground shadow-[inset_-1px_0_0_rgba(0,72,255,0.06)]">
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-danger via-primary to-surface"
        aria-hidden
      />
      <div className="relative shrink-0 border-b border-border px-4 py-5 pl-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
          VisoHelp
        </p>
        <p className="mt-1.5 text-lg font-semibold leading-tight text-foreground">
          Service Desk
        </p>
      </div>

      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col pl-1">
        <nav className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="flex flex-col gap-1">
            {mainNav.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={collapseSubmenus}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-white shadow-[0_4px_14px_rgba(0,72,255,0.28)]"
                      : "text-foreground/80 hover:bg-background hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setCadastrosOpen((o) => !o)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                cadastrosActive
                  ? "bg-primary/10 text-foreground"
                  : "text-foreground/80 hover:bg-background"
              }`}
              aria-expanded={cadastrosOpen}
            >
              <span>Cadastros</span>
              <span className="text-xs text-muted" aria-hidden>
                {cadastrosOpen ? "▾" : "▸"}
              </span>
            </button>
            {cadastrosOpen ? (
              <div className="ml-2 flex flex-col gap-0.5 border-l border-danger/35 pl-2">
                {cadastrosSub.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`) ||
                    (item.href === "/cadastros/clientes" &&
                      pathname.startsWith("/cadastros/clientes/"));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "bg-primary text-white"
                          : "text-muted hover:bg-background hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setConfigOpen((o) => !o)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                configActive
                  ? "bg-primary/10 text-foreground"
                  : "text-foreground/80 hover:bg-background"
              }`}
              aria-expanded={configOpen}
            >
              <span>Configuracoes</span>
              <span className="text-xs text-muted" aria-hidden>
                {configOpen ? "▾" : "▸"}
              </span>
            </button>
            {configOpen ? (
              <div className="ml-2 flex flex-col gap-0.5 border-l border-primary/35 pl-2">
                {configSub.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "bg-primary text-white"
                          : "text-muted hover:bg-background hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        </nav>
      </div>

      <div className="relative shrink-0 border-t border-border bg-background/40 p-3 pl-4">
        <SidebarProfile />
      </div>
    </aside>
  );
}
