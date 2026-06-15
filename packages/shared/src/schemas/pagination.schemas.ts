import { z } from 'zod';

export const LIST_PAGE_SIZE = 5;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(LIST_PAGE_SIZE),
  search: z.string().trim().optional(),
  estadoRegistro: z.enum(['ACTIVO', 'INACTIVO', 'TODOS']).default('ACTIVO'),
});

export type ListQuery = z.infer<typeof listQuerySchema>;

export type PaginatedMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginatedMeta;
};
