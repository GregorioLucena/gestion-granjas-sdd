import { ConflictError } from '@gestion-granjas/shared/errors';
import { Lote, Ubicacion } from '@gestion-granjas/database/entities';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import { Repository } from 'typeorm';

export async function assertGranjaCanInactivate(
  granjaId: string,
  ubicacionRepo: Repository<Ubicacion>,
  loteRepo: Repository<Lote>,
): Promise<void> {
  const ubicacionesActivas = await ubicacionRepo.count({
    where: { granjaId, estadoRegistro: EstadoRegistro.ACTIVO },
  });

  if (ubicacionesActivas > 0) {
    throw new ConflictError(
      'MAESTRA_EN_USO',
      'No puede inactivar la granja: tiene ubicaciones activas asociadas.',
    );
  }

  const lotesActivos = await loteRepo.count({
    where: { granjaId, estadoRegistro: EstadoRegistro.ACTIVO },
  });

  if (lotesActivos > 0) {
    throw new ConflictError(
      'MAESTRA_EN_USO',
      'No puede inactivar la granja: tiene lotes activos asociados.',
    );
  }
}
