export type TenantContext = {
  userId: string;
  companiaId: string;
  granjaIds: string[];
  permisos: string[];
  granjaActivaId?: string;
};
