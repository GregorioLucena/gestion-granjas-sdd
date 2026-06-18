import { BusinessRuleError, ConflictError } from '@gestion-granjas/shared/errors';
import type { TipoMovimientoInventario } from '@gestion-granjas/database/entities';
import { SignoMovimiento } from '@gestion-granjas/database/enums';

export const TIPOS_ENTRADA = ['ENTRADA_COMPRA', 'ENTRADA_MANUAL'] as const;
export const TIPOS_SALIDA_MANUAL = ['SALIDA_MANUAL'] as const;
export const TIPOS_AJUSTE = ['AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO'] as const;

export function assertCantidadValida(cantidad: number): void {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new BusinessRuleError(
      'INVENTARIO_CANTIDAD_INVALIDA',
      'La cantidad debe ser mayor que cero.',
    );
  }
}

export function assertMotivoAjusteRequerido(
  tipoMovimiento: Pick<TipoMovimientoInventario, 'esAjuste' | 'codigo'>,
  motivoAjuste?: string,
): void {
  if (tipoMovimiento.esAjuste && !motivoAjuste?.trim()) {
    throw new BusinessRuleError(
      'INVENTARIO_TIPO_MOVIMIENTO_INVALIDO',
      'Debe indicar el motivo del ajuste.',
    );
  }
}

export function assertStockSuficiente(existenciaActual: number, cantidad: number): void {
  if (existenciaActual < cantidad) {
    throw new ConflictError(
      'INVENTARIO_STOCK_INSUFICIENTE',
      'No hay existencia suficiente en el almacen.',
    );
  }
}

export function resolveSignoDelta(
  tipoMovimiento: Pick<TipoMovimientoInventario, 'signo'>,
  cantidad: number,
): number {
  return tipoMovimiento.signo === SignoMovimiento.ENTRADA ? cantidad : -cantidad;
}

export function computeCostoTotal(
  cantidad: number,
  costoUnitario?: number,
): string | undefined {
  if (costoUnitario === undefined || costoUnitario === null) {
    return undefined;
  }
  return (cantidad * costoUnitario).toFixed(4);
}

export function isTipoEntrada(codigo: string): boolean {
  return (TIPOS_ENTRADA as readonly string[]).includes(codigo);
}

export function isTipoSalidaManual(codigo: string): boolean {
  return (TIPOS_SALIDA_MANUAL as readonly string[]).includes(codigo);
}

export function isTipoAjuste(codigo: string): boolean {
  return (TIPOS_AJUSTE as readonly string[]).includes(codigo);
}

export function requiresStockCheck(tipoMovimiento: Pick<TipoMovimientoInventario, 'signo'>): boolean {
  return tipoMovimiento.signo === SignoMovimiento.SALIDA;
}
