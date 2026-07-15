import { z } from 'zod';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const reporteAlimentacionBaseFiltersSchema = z.object({
  granjaId: z.string().uuid(),
  loteId: z.string().uuid().optional(),
  alimentoId: z.string().uuid().optional(),
  almacenId: z.string().uuid().optional(),
});

export const reporteAlimentacionPeriodoFiltersSchema = reporteAlimentacionBaseFiltersSchema.extend({
  fechaDesde: dateSchema,
  fechaHasta: dateSchema,
});

export const reporteMovimientosFiltersSchema = reporteAlimentacionPeriodoFiltersSchema.extend({
  tipoMovimientoId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reporteExistenciasFiltersSchema = reporteAlimentacionBaseFiltersSchema;

export type ReporteAlimentacionPeriodoFilters = z.infer<
  typeof reporteAlimentacionPeriodoFiltersSchema
>;
export type ReporteMovimientosFilters = z.infer<typeof reporteMovimientosFiltersSchema>;
export type ReporteExistenciasFilters = z.infer<typeof reporteExistenciasFiltersSchema>;

export type CoberturaCostoSummary = {
  costoConocido: number;
  cantidadConCosto: number;
  cantidadSinCosto: number;
  coberturaCostoPct: number | null;
  etiquetaCosto: 'Costo completo' | 'Costo parcial' | 'Sin costo';
};

export type ReporteCantidadSummary = CoberturaCostoSummary & {
  cantidadTotalKg: number;
  unidad: string;
};

export type ReporteResponse<TData, TSummary = ReporteCantidadSummary> = {
  data: TData;
  summary: TSummary;
  meta: {
    periodo?: { desde: string; hasta: string };
    filtros: Record<string, string | undefined>;
    fechaConsulta: string;
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};
