type Props = {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function AppHeader({ title, subtitle, action }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          VisoHelp
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-3">{action}</div>
    </header>
  );
}
