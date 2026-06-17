import type { LucideIcon } from 'lucide-react';

type MetricTone = 'primary' | 'success' | 'warning' | 'accent' | 'info';

type MetricCardProps = {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  tone?: MetricTone;
};

const toneClasses: Record<MetricTone, string> = {
  primary: 'bg-primary/10 text-primary ring-primary/15',
  success: 'bg-success/10 text-success ring-success/15',
  warning: 'bg-warning/15 text-warning ring-warning/20',
  accent: 'bg-accent/10 text-accent ring-accent/15',
  info: 'bg-info/10 text-info ring-info/15',
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = 'primary',
}: MetricCardProps) {
  return (
    <article className="rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <span
          className={`flex size-10 items-center justify-center rounded-xl ring-1 ${toneClasses[tone]}`}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      {helper ? <p className="mt-3 text-xs text-muted">{helper}</p> : null}
    </article>
  );
}
