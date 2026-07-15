import { BusinessRuleError, ConflictError } from '@gestion-granjas/shared/errors';
import type { BajaEngorde } from '@gestion-granjas/database/entities';

export function calcularCantidadActual(
  cantidadInicial: number,
  bajas: Array<Pick<BajaEngorde, 'cantidad' | 'anulado'>>,
): number {
  const bajasVigentes = bajas
    .filter((baja) => !baja.anulado)
    .reduce((sum, baja) => sum + baja.cantidad, 0);
  return cantidadInicial - bajasVigentes;
}

export function assertFechaNoFutura(fecha: string, codigo: string, mensaje: string): void {
  const hoy = new Date().toISOString().slice(0, 10);
  if (fecha > hoy) {
    throw new BusinessRuleError(codigo, mensaje);
  }
}

export function assertFechaInicioEngorde(
  fechaInicio: string,
  fechaInicioLote: string,
): void {
  assertFechaNoFutura(
    fechaInicio,
    'ENGORDE_FECHA_INICIO_INVALIDA',
    'La fecha de inicio debe ser valida y no puede ser futura.',
  );
  if (fechaInicio < fechaInicioLote) {
    throw new BusinessRuleError(
      'ENGORDE_FECHA_INICIO_INVALIDA',
      'La fecha de inicio no puede ser anterior a la fecha de inicio del lote.',
    );
  }
}

export function assertObjetivoPesoValido(
  objetivoPesoKg?: number,
  pesoInicialPromedioKg?: number,
): void {
  if (
    objetivoPesoKg !== undefined &&
    pesoInicialPromedioKg !== undefined &&
    objetivoPesoKg <= pesoInicialPromedioKg
  ) {
    throw new BusinessRuleError(
      'ENGORDE_OBJETIVO_PESO_INVALIDO',
      'El objetivo debe ser mayor que el peso inicial.',
    );
  }
}

export function assertFechaBaja(fecha: string, fechaInicioEngorde: string): void {
  assertFechaNoFutura(
    fecha,
    'ENGORDE_BAJA_FECHA_INVALIDA',
    'La fecha de la baja no es valida para este engorde.',
  );
  if (fecha < fechaInicioEngorde) {
    throw new BusinessRuleError(
      'ENGORDE_BAJA_FECHA_INVALIDA',
      'La fecha de la baja no es valida para este engorde.',
    );
  }
}

export function assertCantidadBajaValida(cantidad: number): void {
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw new BusinessRuleError(
      'ENGORDE_BAJA_CANTIDAD_INVALIDA',
      'La cantidad de baja debe ser mayor que cero.',
    );
  }
}

export function assertBajaNoExcedeCantidad(cantidad: number, cantidadActual: number): void {
  if (cantidad > cantidadActual) {
    throw new ConflictError(
      'ENGORDE_BAJA_EXCEDE_CANTIDAD',
      'La baja supera la cantidad actual del engorde.',
      { cantidadActual, cantidadSolicitada: cantidad },
    );
  }
}

export function assertFechaCierre(fechaCierre: string, fechaInicioEngorde: string): void {
  assertFechaNoFutura(
    fechaCierre,
    'ENGORDE_FECHA_CIERRE_INVALIDA',
    'La fecha de cierre no puede ser anterior al inicio ni futura.',
  );
  if (fechaCierre < fechaInicioEngorde) {
    throw new BusinessRuleError(
      'ENGORDE_FECHA_CIERRE_INVALIDA',
      'La fecha de cierre no puede ser anterior al inicio ni futura.',
    );
  }
}

export function assertCantidadFinalValida(cantidadFinal: number, cantidadActual: number): void {
  if (cantidadFinal !== cantidadActual) {
    throw new BusinessRuleError(
      'ENGORDE_CANTIDAD_FINAL_INVALIDA',
      'La cantidad final debe coincidir con la cantidad actual del engorde.',
      { cantidadActual, cantidadFinal },
    );
  }
}

export function assertPesoFinalAplicabilidad(cantidadFinal: number, tienePeso: boolean): void {
  if (cantidadFinal === 0 && tienePeso) {
    throw new BusinessRuleError(
      'ENGORDE_PESO_FINAL_NO_APLICA',
      'No puede registrar peso final cuando no quedan animales.',
    );
  }
}

export function assertMuestraPeso(
  modalidad: 'PROMEDIO_LOTE' | 'MUESTRA',
  cantidadMuestra: number | undefined,
  cantidadDisponible: number,
): void {
  if (modalidad === 'PROMEDIO_LOTE' && cantidadMuestra !== undefined) {
    throw new BusinessRuleError(
      'PESO_MUESTRA_NO_APLICA',
      'No informe cantidad de muestra para un promedio de lote.',
    );
  }
  if (modalidad === 'MUESTRA') {
    if (cantidadMuestra === undefined || !Number.isInteger(cantidadMuestra) || cantidadMuestra <= 0) {
      throw new BusinessRuleError(
        'PESO_MUESTRA_INVALIDA',
        'La cantidad de muestra debe ser mayor que cero.',
      );
    }
    if (cantidadMuestra > cantidadDisponible) {
      throw new ConflictError(
        'PESO_MUESTRA_EXCEDE_CANTIDAD',
        'La muestra supera la cantidad permitida para este control.',
        { cantidadDisponible, cantidadMuestra },
      );
    }
  }
}
