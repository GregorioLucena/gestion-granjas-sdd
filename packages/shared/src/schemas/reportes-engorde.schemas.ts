import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const reporteEngordePeriodoFiltersSchema = z.object({
  granjaId: z.string().uuid(),
  fechaDesde: dateSchema,
  fechaHasta: dateSchema,
  loteId: z.string().uuid().optional(),
  tipoAnimalId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reporteEngordeEnCursoFiltersSchema = reporteEngordePeriodoFiltersSchema;
export const reporteEngordeCerradosFiltersSchema = reporteEngordePeriodoFiltersSchema;
export const reporteEngordeBajasFiltersSchema = reporteEngordePeriodoFiltersSchema;

export const reporteEngordeLoteParamsSchema = z.object({
  loteId: z.string().uuid(),
});

export const reporteEngordeLoteQuerySchema = z.object({
  granjaId: z.string().uuid(),
});

export type ReporteEngordePeriodoFilters = z.infer<typeof reporteEngordePeriodoFiltersSchema>;
export type ReporteEngordeLoteQuery = z.infer<typeof reporteEngordeLoteQuerySchema>;

export type DatoFaltanteConversion =
  | 'PESO_INICIAL'
  | 'PESO_FINAL'
  | 'CANTIDAD_FINAL'
  | 'CONSUMO'
  | 'GANANCIA_POSITIVA';

export type ReporteEngordeMeta = {
  periodo?: { desde: string; hasta: string };
  filtros: Record<string, string | undefined>;
  fechaConsulta: string;
  formulas: Record<string, string>;
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  datosFaltantes?: DatoFaltanteConversion[];
};

export type ReporteEngordeResponse<TData, TSummary = unknown> = {
  data: TData;
  summary: TSummary;
  meta: ReporteEngordeMeta;
};

export const FORMULAS_REPORTE_ENGORDE: Record<string, string> = {
  cantidadActual: 'cantidadInicial - SUM(bajas no anuladas)',
  duracionDias: 'fechaCierreVigente|fechaConsulta - fechaInicio (mismo dia = 0)',
  gananciaPromedioKg: 'pesoFinalPromedioKg - pesoInicialPromedioKg',
  gananciaHastaUltimoControlKg: 'ultimoPesoPromedioKg - pesoInicialPromedioKg',
  gananciaTotalEstimadaKg: 'gananciaPromedioKg * cantidadFinal',
  consumoAcumuladoKg: 'SUM(consumos no anulados del lote en el intervalo del engorde)',
  conversionAlimenticia: 'consumoAcumuladoKg / gananciaTotalEstimadaKg',
  mortalidadPct: 'SUM(bajas con cuentaComoMortalidad) / cantidadInicial * 100',
};
