import type { ListQuery, PaginatedResponse } from '@gestion-granjas/shared/schemas/pagination.schemas';
import { listQuerySchema } from '@gestion-granjas/shared/schemas/pagination.schemas';
import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export async function paginate<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  query: ListQuery,
  alias = 'entity',
): Promise<PaginatedResponse<T>> {
  if (query.search) {
    qb.andWhere(`${alias}.nombre ILIKE :search`, { search: `%${query.search}%` });
  }

  if (query.estadoRegistro !== 'TODOS') {
    qb.andWhere(`${alias}.estadoRegistro = :estadoRegistro`, {
      estadoRegistro: query.estadoRegistro,
    });
  }

  qb.orderBy(`${alias}.nombre`, 'ASC');

  const skip = (query.page - 1) * query.limit;
  const [items, total] = await qb.skip(skip).take(query.limit).getManyAndCount();

  return {
    items,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export function parseListQuery(input: Record<string, unknown>): ListQuery {
  return listQuerySchema.parse(input);
}
