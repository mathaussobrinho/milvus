export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10 text-foreground">
      <p className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
        VisoHelp
      </p>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
