'use client';

import { RecordActions } from '@/components/data-display/record-actions';
import { StatusBadge } from '@/components/data-display/status-badge';

export type RecordDetail = {
  label: string;
  value?: string | null;
};

type RecordListItemProps = {
  title: string;
  details?: RecordDetail[];
  extra?: string | null;
  estado: 'ACTIVO' | 'INACTIVO';
  onEdit?: () => void;
  onInactivate?: () => void;
};

function buildDetailsLine(details: RecordDetail[] | undefined): RecordDetail[] {
  return details?.filter((detail) => detail.value?.trim()) ?? [];
}

export function RecordListItem({
  title,
  details,
  extra,
  estado,
  onEdit,
  onInactivate,
}: RecordListItemProps) {
  const visibleDetails = buildDetailsLine(details);
  const extraLine = extra?.trim() || null;

  return (
    <article className="flex items-start justify-between gap-3 rounded-2xl bg-surface/90 p-4 shadow-sm ring-1 ring-primary/10 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10 hover:ring-primary/20">
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold leading-snug text-foreground">{title}</p>

        {visibleDetails.length > 0 ? (
          <p className="text-sm text-muted">
            {visibleDetails.map((detail, index) => (
              <span key={detail.label}>
                {index > 0 ? ' · ' : null}
                <span className="font-medium text-foreground/70">{detail.label}:</span>{' '}
                {detail.value}
              </span>
            ))}
          </p>
        ) : null}

        {extraLine ? <p className="text-sm text-muted">{extraLine}</p> : null}

        <StatusBadge estado={estado} />
      </div>

      <RecordActions onEdit={onEdit} onInactivate={onInactivate} />
    </article>
  );
}
