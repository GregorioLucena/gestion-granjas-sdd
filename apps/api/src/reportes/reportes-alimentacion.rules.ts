import { BusinessRuleError } from '@gestion-granjas/shared/errors';
import type { CoberturaCostoSummary } from '@gestion-granjas/shared/schemas/reportes-alimentacion.schemas';

const MAX_PERIODO_DIAS = 366;

export function assertPeriodoReporte(fechaDesde: string, fechaHasta: string): void {
  if (fechaDesde > fechaHasta) {
    throw new BusinessRuleError(
      'REPORTE_RANGO_FECHAS_INVALIDO',
      'La fecha inicial no puede ser posterior a la final.',
    );
  }

  const desde = new Date(`${fechaDesde}T00:00:00.000Z`);
  const hasta = new Date(`${fechaHasta}T00:00:00.000Z`);
  const dias = Math.floor((hasta.getTime() - desde.getTime()) / (24 * 60 * 60 * 1000)) + 1;
  if (dias > MAX_PERIODO_DIAS) {
    throw new BusinessRuleError(
      'REPORTE_PERIODO_EXCEDIDO',
      'El periodo de consulta no puede superar 366 dias.',
    );
  }
}

export function assertUnidadKg(codigoUnidad: string | undefined | null): void {
  if (!codigoUnidad || codigoUnidad.toUpperCase() !== 'KG') {
    throw new BusinessRuleError(
      'REPORTE_UNIDADES_INCOMPATIBLES',
      'No se pueden sumar cantidades con unidades incompatibles.',
    );
  }
}

export function calcularCoberturaCosto(
  cantidadTotalKg: number,
  cantidadConCostoKg: number,
  costoConocido: number,
): CoberturaCostoSummary {
  const cantidadSinCosto = Math.max(0, cantidadTotalKg - cantidadConCostoKg);
  const coberturaCostoPct =
    cantidadTotalKg > 0 ? (cantidadConCostoKg / cantidadTotalKg) * 100 : null;

  let etiquetaCosto: CoberturaCostoSummary['etiquetaCosto'] = 'Sin costo';
  if (cantidadTotalKg > 0 && cantidadSinCosto === 0) {
    etiquetaCosto = 'Costo completo';
  } else if (cantidadConCostoKg > 0) {
    etiquetaCosto = 'Costo parcial';
  }

  return {
    costoConocido: round4(costoConocido),
    cantidadConCosto: round4(cantidadConCostoKg),
    cantidadSinCosto: round4(cantidadSinCosto),
    coberturaCostoPct:
      coberturaCostoPct === null ? null : round2(coberturaCostoPct),
    etiquetaCosto,
  };
}

export function costoDesdeMovimiento(
  cantidadBase: number,
  costoUnitario?: string | null,
): number | null {
  if (costoUnitario === undefined || costoUnitario === null || costoUnitario === '') {
    return null;
  }
  const unitario = Number(costoUnitario);
  if (!Number.isFinite(unitario) || unitario < 0) {
    return null;
  }
  return cantidadBase * unitario;
}

export function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function emptyCantidadSummary() {
  return {
    cantidadTotalKg: 0,
    unidad: 'kg',
    ...calcularCoberturaCosto(0, 0, 0),
  };
}
