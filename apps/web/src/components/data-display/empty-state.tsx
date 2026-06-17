type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-primary/25 bg-primary/5 px-4 py-8 text-center shadow-sm shadow-primary/5">
      <div className="mx-auto mb-3 size-10 rounded-2xl bg-primary/10 ring-1 ring-primary/15" />
      <p className="font-semibold text-foreground">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
