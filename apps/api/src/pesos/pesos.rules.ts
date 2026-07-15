import { BusinessRuleError, ConflictError } from '@gestion-granjas/shared/errors';
import type { ControlPeso } from '@gestion-granjas/database/entities';
import { OrigenControlPeso } from '@gestion-granjas/database/enums';
import { assertMuestraPeso } from '../engorde/engorde.rules';

export { assertMuestraPeso };

export function assertPesoValido(pesoPromedioKg: number): void {
  if (!Number.isFinite(pesoPromedioKg) || pesoPromedioKg <= 0) {
    throw new BusinessRuleError('PESO_VALOR_INVALIDO', 'El peso debe ser mayor que cero.');
  }
}

export function assertFechaControl(fecha: string, fechaInicioEngorde: string): void {
  const hoy = new Date().toISOString().slice(0, 10);
  if (fecha > hoy || fecha < fechaInicioEngorde) {
    throw new BusinessRuleError(
      'PESO_FECHA_INVALIDA',
      'La fecha del control no es valida para este engorde.',
    );
  }
}

export function assertCantidadDisponibleParaPeso(cantidadEnFecha: number): void {
  if (cantidadEnFecha <= 0) {
    throw new ConflictError(
      'PESO_LOTE_SIN_ANIMALES',
      'No puede registrar peso porque el lote no tiene animales disponibles.',
    );
  }
}

export function assertAnulacionManualPermitida(
  control: Pick<ControlPeso, 'anulado' | 'origen'>,
): void {
  if (control.anulado) {
    throw new ConflictError('PESO_YA_ANULADO', 'El control de peso ya fue anulado.');
  }
  if (
    control.origen === OrigenControlPeso.ENGORDE_INICIO ||
    control.origen === OrigenControlPeso.ENGORDE_CIERRE
  ) {
    throw new ConflictError(
      'PESO_ORIGEN_PROTEGIDO',
      'Este control se corrige desde el inicio o cierre que lo genero.',
    );
  }
}

export function calcularDiferenciaKg(
  pesoActual: number,
  pesoAnterior: number | null,
): number | null {
  if (pesoAnterior === null) return null;
  return pesoActual - pesoAnterior;
}
