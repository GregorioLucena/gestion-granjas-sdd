import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

type PageHeaderProps = {
  backHref: string;
  backLabel?: string;
  title: string;
  description?: string;
};

export function PageHeader({
  backHref,
  backLabel = 'Volver',
  title,
  description,
}: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-surface/90 p-5 shadow-sm ring-1 ring-primary/10">
      <div className="absolute -right-12 -top-16 size-40 rounded-full bg-secondary/25 blur-2xl" />
      <div className="absolute -bottom-16 left-8 size-32 rounded-full bg-primary/12 blur-2xl" />

      <div className="relative space-y-3">
        <Link
          href={backHref}
          className="inline-flex min-h-9 items-center gap-1 rounded-full bg-primary/10 px-3 text-sm font-semibold text-primary ring-1 ring-primary/15 transition hover:bg-primary/15"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {backLabel}
        </Link>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">{description}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
