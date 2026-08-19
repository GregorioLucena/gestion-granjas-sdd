import { ConflictError, NotFoundError } from '@gestion-granjas/shared/errors';
import {
  PERMISOS,
  requireGranjaAccess,
  requirePermission,
} from '@gestion-granjas/shared/permissions';
import type { TenantContext } from '@gestion-granjas/shared';
import {
  decidirRecomendacionSchema,
  listarRecomendacionesFiltroSchema,
  type DecidirRecomendacionInput,
  type ListarRecomendacionesFiltro,
} from '@gestion-granjas/shared/schemas/asistente.schemas';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BajaEngorde,
  ConsumoAlimento,
  FeedbackRecomendacion,
  Lote,
  Recomendacion,
} from '@gestion-granjas/database/entities';
import {
  CicloRecomendacion,
  DecisionFeedback,
  EstadoRecomendacion,
  TipoRecomendacion,
} from '@gestion-granjas/database/enums';
import { LlmRedaccionService } from './llm-redaccion.service';
import { In, Repository } from 'typeorm';
import {
  UMBRALES_DEFAULT,
  accionSugeridaPara,
  analizarDesvioConsumo,
  construirMensajePlantilla,
} from './asistente.rules';

@Injectable()
export class AsistenteService {
  private readonly logger = new Logger(AsistenteService.name);

  constructor(
    @InjectRepository(Recomendacion)
    private readonly recomendacionRepo: Repository<Recomendacion>,
    @InjectRepository(FeedbackRecomendacion)
    private readonly feedbackRepo: Repository<FeedbackRecomendacion>,
    @InjectRepository(ConsumoAlimento)
    private readonly consumoRepo: Repository<ConsumoAlimento>,
    @InjectRepository(BajaEngorde)
    private readonly bajaRepo: Repository<BajaEngorde>,
    @InjectRepository(Lote) private readonly loteRepo: Repository<Lote>,
    private readonly llmRedaccion: LlmRedaccionService,
  ) {}

  async listar(ctx: TenantContext, filtroRaw: ListarRecomendacionesFiltro) {
    requirePermission(ctx, PERMISOS.ASISTENTE_RECOMENDACIONES_VER);
    const filtro = listarRecomendacionesFiltroSchema.parse(filtroRaw);

    const granjasPermitidas = ctx.granjaIds;
    if (granjasPermitidas.length === 0) {
      return { items: [] };
    }

    let granjasFiltro = granjasPermitidas;
    if (filtro.granjaId) {
      requireGranjaAccess(ctx, filtro.granjaId);
      granjasFiltro = [filtro.granjaId];
    }

    const items = await this.recomendacionRepo.find({
      where: {
        companiaId: ctx.companiaId,
        granjaId: In(granjasFiltro),
        ...(filtro.estado ? { estado: filtro.estado as EstadoRecomendacion } : {}),
        ...(filtro.tipo ? { tipo: filtro.tipo as TipoRecomendacion } : {}),
      },
      order: { prioridad: 'DESC', createdAt: 'DESC' },
      take: 100,
    });

    return { items };
  }

  async obtener(ctx: TenantContext, id: string) {
    requirePermission(ctx, PERMISOS.ASISTENTE_RECOMENDACIONES_VER);
    const recomendacion = await this.buscarAccesible(ctx, id);
    const feedback = await this.feedbackRepo.find({
      where: { recomendacionId: recomendacion.id },
      order: { createdAt: 'DESC' },
    });
    return { recomendacion, feedback };
  }

  async decidir(ctx: TenantContext, id: string, input: DecidirRecomendacionInput) {
    requirePermission(ctx, PERMISOS.ASISTENTE_RECOMENDACIONES_DECIDIR);
    const parsed = decidirRecomendacionSchema.parse(input);
    const recomendacion = await this.buscarAccesible(ctx, id);

    if (
      recomendacion.estado !== EstadoRecomendacion.PENDIENTE &&
      recomendacion.estado !== EstadoRecomendacion.EN_COLA
    ) {
      throw new ConflictError(
        'RECOMENDACION_NO_PENDIENTE',
        'Esa recomendacion ya fue resuelta.',
      );
    }

    const decision =
      parsed.decision === 'aceptada'
        ? DecisionFeedback.ACEPTADA
        : DecisionFeedback.DESCARTADA;

    await this.feedbackRepo.save(
      this.feedbackRepo.create({
        recomendacionId: recomendacion.id,
        decision,
        motivo: parsed.motivo,
        usuarioId: ctx.userId,
      }),
    );

    recomendacion.estado =
      decision === DecisionFeedback.ACEPTADA
        ? EstadoRecomendacion.ACEPTADA_EN_EVALUACION
        : EstadoRecomendacion.DESCARTADA;

    return this.recomendacionRepo.save(recomendacion);
  }

  /**
   * Ciclo operativo: evalua un consumo recien registrado y, si detecta desvio,
   * persiste una recomendacion. Best-effort: nunca debe romper el alta de consumo.
   */
  async evaluarConsumoDesvio(
    ctx: TenantContext,
    consumo: Pick<
      ConsumoAlimento,
      'id' | 'companiaId' | 'granjaId' | 'loteId' | 'alimentoId' | 'cantidad' | 'fecha'
    >,
  ): Promise<void> {
    try {
      const cantidadActual = Number(consumo.cantidad);
      if (!Number.isFinite(cantidadActual) || cantidadActual <= 0) return;

      const desde = this.restarDias(consumo.fecha, UMBRALES_DEFAULT.ventanaDiasHistorico);

      const historicoRaw = await this.consumoRepo
        .createQueryBuilder('consumo')
        .select(['consumo.cantidad AS cantidad', 'consumo.alimentoId AS "alimentoId"'])
        .where('consumo.companiaId = :companiaId', { companiaId: consumo.companiaId })
        .andWhere('consumo.loteId = :loteId', { loteId: consumo.loteId })
        .andWhere('consumo.id != :id', { id: consumo.id })
        .andWhere('consumo.anulado = false')
        .andWhere('consumo.fecha >= :desde', { desde })
        .andWhere('consumo.fecha <= :hasta', { hasta: consumo.fecha })
        .getRawMany<{ cantidad: string; alimentoId: string }>();

      const historico = historicoRaw.map((row) => ({
        cantidad: Number(row.cantidad),
        alimentoId: row.alimentoId,
      }));

      const bajasRecientes = await this.bajaRepo
        .createQueryBuilder('baja')
        .where('baja.loteId = :loteId', { loteId: consumo.loteId })
        .andWhere('baja.anulado = false')
        .andWhere('baja.fecha >= :desde', { desde })
        .andWhere('baja.fecha <= :hasta', { hasta: consumo.fecha })
        .getCount();

      const analisis = analizarDesvioConsumo({
        cantidadActual,
        alimentoActualId: consumo.alimentoId,
        historico,
        bajasRecientes,
      });

      if (!analisis.hayDesvio) return;

      const yaExiste = await this.recomendacionRepo.findOne({
        where: {
          companiaId: consumo.companiaId,
          loteId: consumo.loteId,
          tipo: TipoRecomendacion.CONSUMO_DESVIO,
          estado: EstadoRecomendacion.PENDIENTE,
        },
      });
      if (yaExiste) return;

      const lote = await this.loteRepo.findOne({ where: { id: consumo.loteId } });
      const loteCodigo = lote?.codigo ?? 'sin codigo';
      const hipotesisPrincipal = analisis.hipotesis[0];
      const accionSugerida = accionSugeridaPara(hipotesisPrincipal);
      const plantilla = construirMensajePlantilla(
        loteCodigo,
        analisis.desvioPct,
        analisis.promedioHistorico,
        hipotesisPrincipal,
      );
      const redaccion = await this.llmRedaccion.redactar(
        {
          loteCodigo,
          desvioPct: analisis.desvioPct,
          promedioHistorico: analisis.promedioHistorico,
          cantidadActual,
          registrosHistoricos: historico.length,
          ventanaDias: UMBRALES_DEFAULT.ventanaDiasHistorico,
          hipotesis: analisis.hipotesis,
          accionSugerida,
        },
        plantilla,
      );

      await this.recomendacionRepo.save(
        this.recomendacionRepo.create({
          companiaId: consumo.companiaId,
          granjaId: consumo.granjaId,
          loteId: consumo.loteId,
          tipo: TipoRecomendacion.CONSUMO_DESVIO,
          ciclo: CicloRecomendacion.OPERATIVO,
          severidad: analisis.severidad,
          estado: EstadoRecomendacion.PENDIENTE,
          titulo: `Consumo elevado en el lote ${loteCodigo}`,
          mensaje: redaccion.mensaje,
          fuenteMensaje: redaccion.fuenteMensaje,
          modeloMensaje: redaccion.modeloMensaje,
          hipotesis: analisis.hipotesis,
          accionSugerida,
          evidencia: {
            desvioPct: analisis.desvioPct,
            promedioHistorico: analisis.promedioHistorico,
            cantidadActual,
            registrosHistoricos: historico.length,
            ventanaDias: UMBRALES_DEFAULT.ventanaDiasHistorico,
            bajasRecientes,
          },
          consumoId: consumo.id,
          prioridad: analisis.severidad === 'CRITICA' ? 80 : 50,
        }),
      );
    } catch (error) {
      this.logger.error(
        `No se pudo evaluar el consumo ${consumo.id} para recomendaciones`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private async buscarAccesible(
    ctx: TenantContext,
    id: string,
  ): Promise<Recomendacion> {
    const recomendacion = await this.recomendacionRepo.findOne({
      where: { id, companiaId: ctx.companiaId },
    });
    if (!recomendacion) {
      throw new NotFoundError('No encontramos esa recomendacion.');
    }
    requireGranjaAccess(ctx, recomendacion.granjaId);
    return recomendacion;
  }

  private restarDias(fecha: string, dias: number): string {
    const base = new Date(`${fecha}T00:00:00.000Z`);
    base.setUTCDate(base.getUTCDate() - dias);
    return base.toISOString().slice(0, 10);
  }
}
