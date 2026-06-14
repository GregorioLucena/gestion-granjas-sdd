function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-3 rounded-2xl bg-surface p-6 shadow-sm ring-1 ring-black/5">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted">{description}</p>
    </div>
  );
}

export default function ConsumoPage() {
  return (
    <PlaceholderPage
      title="Consumo"
      description="Modulo de consumo pendiente segun docs/specs/007-consumo-alimento.md."
    />
  );
}
