type Props = {
  titulo: string;
};

export function PlaceholderCadastro({ titulo }: Props) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-foreground">{titulo}</h2>
      <p className="mt-2 text-sm text-muted">Em construcao.</p>
    </div>
  );
}
