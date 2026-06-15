import { ConflictError } from '@gestion-granjas/shared/errors';
import { Lote, Raza, Ubicacion } from '@gestion-granjas/database/entities';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import { Repository } from 'typeorm';

export async function assertTipoAnimalCanInactivate(
  tipoAnimalId: string,
  razaRepo: Repository<Raza>,
  loteRepo: Repository<Lote>,
): Promise<void> {
  const razasActivas = await razaRepo.count({
    where: { tipoAnimalId, estadoRegistro: EstadoRegistro.ACTIVO },
  });

  if (razasActivas > 0) {
    throw new ConflictError(
      'MAESTRA_EN_USO',
      'No puede inactivar el tipo de animal: tiene razas activas asociadas.',
    );
  }

  const lotesActivos = await loteRepo.count({
    where: { tipoAnimalId, estadoRegistro: EstadoRegistro.ACTIVO },
  });

  if (lotesActivos > 0) {
    throw new ConflictError(
      'MAESTRA_EN_USO',
      'No puede inactivar el tipo de animal: esta siendo usado por lotes activos.',
    );
  }
}

export async function assertFinalidadCanInactivate(
  finalidadId: string,
  loteRepo: Repository<Lote>,
): Promise<void> {
  const lotesActivos = await loteRepo.count({
    where: { finalidadProductivaId: finalidadId, estadoRegistro: EstadoRegistro.ACTIVO },
  });

  if (lotesActivos > 0) {
    throw new ConflictError(
      'MAESTRA_EN_USO',
      'No puede inactivar la finalidad: esta siendo usada por lotes activos.',
    );
  }
}

export async function assertTipoUbicacionCanInactivate(
  tipoUbicacionId: string,
  ubicacionRepo: Repository<Ubicacion>,
): Promise<void> {
  const ubicacionesActivas = await ubicacionRepo.count({
    where: { tipoUbicacionId, estadoRegistro: EstadoRegistro.ACTIVO },
  });

  if (ubicacionesActivas > 0) {
    throw new ConflictError(
      'MAESTRA_EN_USO',
      'No puede inactivar el tipo de ubicacion: tiene ubicaciones activas asociadas.',
    );
  }
}

export async function assertUbicacionCanInactivate(
  ubicacionId: string,
  loteRepo: Repository<Lote>,
): Promise<void> {
  const lotesActivos = await loteRepo.count({
    where: { ubicacionId, estadoRegistro: EstadoRegistro.ACTIVO },
  });

  if (lotesActivos > 0) {
    throw new ConflictError(
      'MAESTRA_EN_USO',
      'No puede inactivar la ubicacion: esta siendo usada por lotes activos.',
    );
  }
}
