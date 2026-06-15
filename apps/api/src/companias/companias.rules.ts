import { ConflictError } from '@gestion-granjas/shared/errors';
import { Granja } from '@gestion-granjas/database/entities';
import { EstadoRegistro } from '@gestion-granjas/database/enums';
import { Repository } from 'typeorm';

export async function assertCompaniaCanInactivate(
  companiaId: string,
  granjaRepo: Repository<Granja>,
): Promise<void> {
  const granjasActivas = await granjaRepo.count({
    where: { companiaId, estadoRegistro: EstadoRegistro.ACTIVO },
  });

  if (granjasActivas > 0) {
    throw new ConflictError(
      'MAESTRA_EN_USO',
      'No puede inactivar la compania: tiene granjas activas asociadas.',
    );
  }
}
