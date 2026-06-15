type EstadoRegistro = 'ACTIVO' | 'INACTIVO';

const styles: Record<EstadoRegistro, string> = {
  ACTIVO: 'bg-success/15 text-success ring-success/20',
  INACTIVO: 'bg-muted/10 text-muted ring-black/10',
};

type StatusBadgeProps = {
  estado: EstadoRegistro | string;
};

export function StatusBadge({ estado }: StatusBadgeProps) {
  const label = estado === 'ACTIVO' ? 'Activo' : estado === 'INACTIVO' ? 'Inactivo' : estado;
  const style = styles[estado as EstadoRegistro] ?? styles.INACTIVO;

  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full px-2.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
  );
}
