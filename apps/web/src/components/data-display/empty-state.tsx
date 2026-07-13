type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-primary/25 bg-primary/[0.04] px-4 py-10 text-center shadow-sm shadow-primary/5">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary/40 ring-1 ring-secondary/50">
        <span className="size-2.5 rounded-full bg-primary" aria-hidden />
      </div>
      <p className="font-display text-xl font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
