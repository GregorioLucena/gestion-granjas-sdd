import { BusinessRuleError, ConflictError } from '@gestion-granjas/shared/errors';
import type { Lote } from '@gestion-granjas/database/entities';
import { EstadoLote, EstadoRegistro } from '@gestion-granjas/database/enums';

export function assertCantidadConsumoValida(cantidad: number): void {
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    throw new BusinessRuleError(
      'CONSUMO_CANTIDAD_INVALIDA',
      'La cantidad consumida debe ser mayor que cero.',
    );
  }
}

export function assertAlmacenRequerido(almacenId?: string): void {
  if (!almacenId?.trim()) {
    throw new BusinessRuleError(
      'CONSUMO_ALMACEN_REQUERIDO',
      'Debe indicar el almacen de origen.',
    );
  }
}

export function assertLoteActivoParaConsumo(lote: Pick<Lote, 'estadoOperativo' | 'estadoRegistro'>): void {
  if (lote.estadoRegistro !== EstadoRegistro.ACTIVO) {
    throw new ConflictError('CONSUMO_LOTE_CERRADO', 'No puede registrar consumo en un lote inactivo.');
  }
  if (lote.estadoOperativo !== EstadoLote.ACTIVO) {
    throw new ConflictError('CONSUMO_LOTE_CERRADO', 'No puede registrar consumo en un lote cerrado.');
  }
}

export function assertStockSuficienteConsumo(existenciaActual: number, cantidad: number): void {
  if (existenciaActual < cantidad) {
    throw new ConflictError(
      'CONSUMO_STOCK_INSUFICIENTE',
      'No hay existencia suficiente para registrar el consumo.',
    );
  }
}

export function assertLoteMismaGranja(loteGranjaId: string, granjaId: string): void {
  if (loteGranjaId !== granjaId) {
    throw new BusinessRuleError(
      'GRANJA_ACCESS_DENIED',
      'El lote no pertenece a la granja indicada.',
    );
  }
}
