export function formatNumber(value: number, digits = 2): string {
  return value.toLocaleString('es-PY', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatKg(value: number): string {
  return `${formatNumber(value, 4)} kg`;
}

export function formatMoney(value: number): string {
  return formatNumber(value, 2);
}

export function formatNullable(
  value: number | null | undefined,
  formatter: (n: number) => string = (n) => formatNumber(n, 2),
): string {
  if (value === null || value === undefined) return 'No disponible';
  return formatter(value);
}


export function coberturaTone(etiqueta: string): string {
  if (etiqueta === 'Costo completo') return 'bg-success/15 text-success ring-success/25';
  if (etiqueta === 'Costo parcial') return 'bg-warning/15 text-warning ring-warning/30';
  return 'bg-muted/10 text-muted ring-primary/10';
}
