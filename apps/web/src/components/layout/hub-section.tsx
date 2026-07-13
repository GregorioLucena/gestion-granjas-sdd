type HubSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

/** Agrupa cards de navegacion en hubs (config, inventario, seguridad). */
export function HubSection({ title, description, children }: HubSectionProps) {
  return (
    <section className="space-y-3 rounded-3xl bg-surface/80 p-3.5 ring-1 ring-primary/10">
      <div className="px-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-muted">{description}</p> : null}
      </div>
      <div className="grid gap-2.5">{children}</div>
    </section>
  );
}
