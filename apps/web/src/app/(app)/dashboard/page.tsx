const metrics = [
  { label: 'Lotes activos', value: '—' },
  { label: 'Stock bajo', value: '—' },
  { label: 'Engordes en curso', value: '—' },
  { label: 'Consumo hoy', value: '—' },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted">Resumen productivo de la granja activa.</p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5"
          >
            <p className="text-xs text-muted">{metric.label}</p>
            <p className="mt-2 text-2xl font-bold text-primary">{metric.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5">
        <h2 className="font-semibold">Accesos rapidos</h2>
        <p className="mt-2 text-sm text-muted">
          Registrar consumo, peso, crear lote e inventario se habilitaran en los siguientes sprints.
        </p>
      </section>
    </div>
  );
}
