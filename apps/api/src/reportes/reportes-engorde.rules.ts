import type { DatoFaltanteConversion } from '@gestion-granjas/shared/schemas/reportes-engorde.schemas';

export { assertPeriodoReporte, round2, round4 } from './reportes-alimentacion.rules';

export function diasEntre(fechaInicio: string, fechaFin: string): number {
  const desde = new Date(`${fechaInicio}T00:00:00.000Z`);
  const hasta = new Date(`${fechaFin}T00:00:00.000Z`);
  return Math.max(
    0,
    Math.floor((hasta.getTime() - desde.getTime()) / (24 * 60 * 60 * 1000)),
  );
}

export function engordeSolapaPeriodo(
  fechaInicio: string,
  fechaFinEfectiva: string | null,
  periodoDesde: string,
  periodoHasta: string,
): boolean {
  const fin = fechaFinEfectiva ?? '9999-12-31';
  return fechaInicio <= periodoHasta && fin >= periodoDesde;
}

export function gananciaPromedioKg(
  pesoInicial: number | null,
  pesoFinal: number | null,
): number | null {
  if (pesoInicial === null || pesoFinal === null) return null;
  return pesoFinal - pesoInicial;
}

export function gananciaTotalEstimadaKg(
  gananciaPromedio: number | null,
  cantidadFinal: number | null,
): number | null {
  if (gananciaPromedio === null || cantidadFinal === null || cantidadFinal <= 0) {
    return null;
  }
  return gananciaPromedio * cantidadFinal;
}

export function calcularConversionAlimenticia(input: {
  pesoInicial: number | null;
  pesoFinal: number | null;
  cantidadFinal: number | null;
  consumoAcumuladoKg: number;
}): { conversionAlimenticia: number | null; datosFaltantes: DatoFaltanteConversion[] } {
  const faltantes: DatoFaltanteConversion[] = [];
  if (input.pesoInicial === null) faltantes.push('PESO_INICIAL');
  if (input.pesoFinal === null) faltantes.push('PESO_FINAL');
  if (input.cantidadFinal === null || input.cantidadFinal <= 0) {
    faltantes.push('CANTIDAD_FINAL');
  }
  if (input.consumoAcumuladoKg <= 0) faltantes.push('CONSUMO');

  if (
    input.pesoInicial !== null &&
    input.pesoFinal !== null &&
    input.pesoFinal <= input.pesoInicial
  ) {
    faltantes.push('GANANCIA_POSITIVA');
  }

  if (faltantes.length > 0) {
    return { conversionAlimenticia: null, datosFaltantes: faltantes };
  }

  const gananciaPromedio = (input.pesoFinal as number) - (input.pesoInicial as number);
  const gananciaTotal = gananciaPromedio * (input.cantidadFinal as number);
  return {
    conversionAlimenticia: input.consumoAcumuladoKg / gananciaTotal,
    datosFaltantes: [],
  };
}

export function calcularMortalidad(
  cantidadInicial: number,
  bajas: Array<{ cantidad: number; anulado: boolean; cuentaComoMortalidad: boolean }>,
): { bajasMortalidad: number; otrasBajas: number; mortalidadPct: number | null } {
  let bajasMortalidad = 0;
  let otrasBajas = 0;
  for (const baja of bajas) {
    if (baja.anulado) continue;
    if (baja.cuentaComoMortalidad) {
      bajasMortalidad += baja.cantidad;
    } else {
      otrasBajas += baja.cantidad;
    }
  }
  return {
    bajasMortalidad,
    otrasBajas,
    mortalidadPct:
      cantidadInicial > 0 ? (bajasMortalidad / cantidadInicial) * 100 : null,
  };
}
