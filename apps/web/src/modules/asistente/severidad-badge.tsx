import type { Recomendacion } from './types';
import { SEVERIDAD_LABEL, severidadClassName } from './types';

type SeveridadBadgeProps = {
  severidad: Recomendacion['severidad'];
};

export function SeveridadBadge({ severidad }: SeveridadBadgeProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset ${severidadClassName(severidad)}`}
    >
      {SEVERIDAD_LABEL[severidad]}
    </span>
  );
}
