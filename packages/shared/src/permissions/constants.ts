export const PERMISOS = {
  COMPANIAS_VER: 'companias.ver',
  COMPANIAS_CREAR: 'companias.crear',
  COMPANIAS_EDITAR: 'companias.editar',
  GRANJAS_VER: 'granjas.ver',
  GRANJAS_CREAR: 'granjas.crear',
  GRANJAS_EDITAR: 'granjas.editar',
  MAESTRAS_ADMINISTRAR: 'maestras.administrar',
} as const;

export type PermisoCodigo = (typeof PERMISOS)[keyof typeof PERMISOS];
