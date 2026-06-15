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
    <header className="space-y-2">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary"
      >
        <ChevronLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
      </div>
    </header>
  );
}
