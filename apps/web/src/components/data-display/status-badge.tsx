type Estado = 'ACTIVO' | 'INACTIVO' | 'CERRADO' | 'CANCELADO' | 'ANULADO' | 'EN_CURSO';

const styles: Record<Estado, string> = {
  ACTIVO: 'bg-success/15 text-success ring-success/25',
  INACTIVO: 'bg-muted/10 text-muted ring-primary/10',
  CERRADO: 'bg-muted/10 text-muted ring-primary/10',
  CANCELADO: 'bg-danger/10 text-danger ring-danger/20',
  ANULADO: 'bg-danger/10 text-danger ring-danger/20',
  EN_CURSO: 'bg-success/15 text-success ring-success/25',
};

type StatusBadgeProps = {
  estado: Estado | string;
};

export function StatusBadge({ estado }: StatusBadgeProps) {
  const label = labels[estado as Estado] ?? estado;
  const style = styles[estado as Estado] ?? styles.INACTIVO;

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}

const labels: Record<Estado, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  CERRADO: 'Cerrado',
  CANCELADO: 'Cancelado',
  ANULADO: 'Anulado',
  EN_CURSO: 'En curso',
};
