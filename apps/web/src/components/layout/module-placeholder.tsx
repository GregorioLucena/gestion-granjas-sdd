import type { LucideIcon } from 'lucide-react';
import { ClipboardList } from 'lucide-react';

type ModulePlaceholderProps = {
  title: string;
  description: string;
  specPath: string;
  icon?: LucideIcon;
  nextSteps?: string[];
};

export function ModulePlaceholder({
  title,
  description,
  specPath,
  icon: Icon = ClipboardList,
  nextSteps = [],
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-surface/90 p-5 shadow-sm ring-1 ring-primary/10">
        <div className="absolute -right-12 -top-16 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
            <Icon className="size-6" aria-hidden />
          </span>
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-muted">Modulo pendiente</p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">{description}</p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-primary/[0.04] p-4 ring-1 ring-primary/10">
        <p className="text-sm font-semibold text-foreground">Guia de implementacion</p>
        <p className="mt-1 text-sm text-muted">
          Este modulo se construira siguiendo{' '}
          <span className="font-medium text-primary">{specPath}</span>.
        </p>
        {nextSteps.length > 0 ? (
          <div className="mt-4 grid gap-2">
            {nextSteps.map((step) => (
              <div
                key={step}
                className="rounded-2xl bg-surface p-3 text-sm text-muted ring-1 ring-primary/10"
              >
                {step}
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
