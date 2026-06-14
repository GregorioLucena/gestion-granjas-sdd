# Convenciones de Implementacion — MVP v1

Este documento define como escribir codigo en el proyecto. Complementa `07-diseno-tecnico-inicial.md` y debe consultarse antes de implementar cualquier modulo.

## Referencias

- Diseno tecnico: `07-diseno-tecnico-inicial.md`
- Catalogo de errores: `09-catalogo-errores.md`
- Guia UX/UI: `11-guia-ux-ui.md`
- Git y calidad: `12-convenciones-git-y-calidad.md`
- Specs funcionales: `docs/specs/`
- Decisiones: `docs/decisions/`

## Principios generales

1. **La spec manda.** Si el codigo contradice una spec, el codigo esta mal.
2. **Logica en servicios, no en UI.** React solo presenta y captura datos.
3. **Tenant first.** Toda operacion valida compania y granja antes de tocar datos.
4. **Eventos no se borran.** Se anulan con motivo y trazabilidad.
5. **Validacion duplicada con proposito.** Zod en borde (API/UI); reglas de negocio en servicios.
6. **UI con identidad propia.** Toda pantalla debe respetar la guia visual elegante, divertida y mobile-first.
7. **Codigo prolijo y rastreable.** Cada cambio debe vivir en una rama con prefijo y seguir las convenciones Git/calidad.

## Idioma y estilo

| Aspecto | Convencion |
|---------|------------|
| Codigo fuente | Ingles (archivos, funciones, variables, tipos) |
| Comentarios | Espanol solo si explican regla de negocio no obvia |
| UI visible al usuario | Espanol |
| Mensajes de error al usuario | Espanol claro y accionable |
| Codigos de error internos | Ingles en `SCREAMING_SNAKE_CASE` (ver doc 09) |
| Commits | Espanol o ingles, consistente por repo; imperativo breve |

## Nomenclatura

### Archivos y carpetas

| Tipo | Patron | Ejemplo |
|------|--------|---------|
| Modulo de dominio | `src/modules/<dominio>/` | `src/modules/lotes/` |
| Servicio | `<dominio>.service.ts` | `lotes.service.ts` |
| Reglas puras | `<dominio>.rules.ts` | `lotes.rules.ts` |
| Schemas Zod | `<dominio>.schemas.ts` | `lotes.schemas.ts` |
| Permisos del modulo | `<dominio>.permissions.ts` | `lotes.permissions.ts` |
| Tipos del modulo | `<dominio>.types.ts` | `lotes.types.ts` |
| Route Handler | `src/app/api/<ruta>/route.ts` | `api/lotes/route.ts` |
| Pagina | `src/app/(app)/<ruta>/page.tsx` | `(app)/lotes/page.tsx` |
| Componente | `PascalCase.tsx` | `LoteForm.tsx` |
| Hook | `use<Nombre>.ts` | `useLotes.ts` |
| Entidad TypeORM | `<nombre>.entities.ts` o agrupada | `operacion.entities.ts` |

### TypeScript

| Elemento | Convencion | Ejemplo |
|----------|------------|---------|
| Clases / tipos / interfaces | PascalCase | `TenantContext`, `CrearLoteInput` |
| Funciones / variables | camelCase | `crearLote`, `granjaActivaId` |
| Constantes | UPPER_SNAKE_CASE | `PERMISO_LOTES_CREAR` |
| Enums TS | PascalCase + miembros UPPER | `EstadoLote.ACTIVO` |
| IDs en BD | uuid v4, columna `id` | `@PrimaryGeneratedColumn('uuid')` |
| FKs | `<entidad>Id` | `companiaId`, `granjaId` |
| Fechas en API JSON | ISO 8601 string | `"2026-06-14"` o `"2026-06-14T10:30:00.000Z"` |
| Decimales en API | string | `"40.5000"` (evita perdida de precision) |

### Base de datos

- Tablas en `snake_case` plural: `lotes`, `movimientos_inventario`.
- Columnas en `camelCase` mapeadas con TypeORM (default) o `@Column({ name: 'snake_case' })` si se prefiere snake en BD — **elegir uno y mantenerlo**. Para MVP v1: **camelCase en entidades**, nombres de tabla explicitos con `@Entity('nombre_tabla')`.
- Indices unicos documentados en entidad con `@Unique`.

## Estructura de un modulo

Cada modulo de dominio sigue esta forma minima:

```text
src/modules/lotes/
├── lotes.types.ts         # DTOs, inputs/outputs del servicio
├── lotes.schemas.ts       # Zod: crear, editar, filtros
├── lotes.permissions.ts   # constantes PERMISO_* del modulo
├── lotes.rules.ts         # funciones puras testeables
├── lotes.service.ts       # orquestacion, TypeORM, transacciones
└── index.ts               # exports publicos del modulo
```

### Responsabilidades

| Capa | Responsabilidad | No debe |
|------|-----------------|---------|
| `*.schemas.ts` | Forma y tipos de datos de entrada | Contener reglas de negocio |
| `*.rules.ts` | Reglas puras sin I/O | Acceder a BD |
| `*.service.ts` | Persistencia, transacciones, autorizacion de dominio | Renderizar UI |
| `route.ts` | HTTP, parseo Zod, sesion, respuesta | Logica de negocio compleja |
| `page.tsx` / componentes | UX, formularios, estados de carga | Filtrar tenant manualmente sin servicio |

## Patron de servicio

### Firma tipica

```typescript
// lotes.service.ts
export async function crearLote(
  ctx: TenantContext,
  input: CrearLoteInput,
): Promise<Lote> {
  requirePermission(ctx, PERMISOS.LOTES_CREAR);
  requireGranjaAccess(ctx, input.granjaId);

  const parsed = crearLoteSchema.parse(input);
  await assertGranjaPerteneceACompania(ctx.companiaId, parsed.granjaId);
  // ... reglas + persistencia
}
```

### Orden interno obligatorio

1. Verificar permiso.
2. Verificar acceso a granja (si aplica).
3. Validar input (Zod).
4. Verificar pertenencia al tenant (compania/granja).
5. Aplicar reglas de negocio (`*.rules.ts`).
6. Persistir (transaccion si hay multiples escrituras).
7. Retornar DTO o entidad.

### Transacciones obligatorias

Usar `manager.transaction()` cuando una operacion:

- Crea consumo + movimiento de inventario.
- Anula consumo + revierte inventario.
- Cierra engorde + actualiza estado del lote.
- Registra baja + recalcula cantidad.

```typescript
await dataSource.manager.transaction(async (manager) => {
  // todas las escrituras aqui
});
```

## Capa API (Route Handlers)

### Plantilla

```typescript
export async function POST(request: Request) {
  try {
    const ctx = await getTenantContext(request);
    const body = await request.json();
    const result = await crearLote(ctx, body);
    return jsonCreated(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Helpers en `src/lib/api/`

| Helper | Uso |
|--------|-----|
| `getTenantContext()` | Sesion + permisos + granja activa |
| `jsonOk(data)` | 200 `{ data }` |
| `jsonCreated(data)` | 201 `{ data }` |
| `handleApiError(error)` | Mapea `AppError` a HTTP (ver doc 09) |
| `parseBody(schema, body)` | Zod safeParse con error 400 estandar |

### Reglas HTTP

- `GET` no modifica estado.
- `POST` crea recursos o acciones (anular, cerrar engorde).
- No usar `PUT/PATCH` en MVP v1 salvo edicion ABM explicita.
- Parametros de ruta `[id]` siempre validados como UUID.

## Autenticacion y contexto

### TenantContext

Definido en `src/lib/tenant.ts`:

```typescript
export type TenantContext = {
  userId: string;
  companiaId: string;
  granjaIds: string[];
  permisos: string[];
  granjaActivaId?: string;
};
```

### Granja activa

- Se guarda en sesion o cookie segura tras login/seleccion.
- Pantallas operativas usan `ctx.granjaActivaId` como filtro por defecto.
- API acepta `granjaId` en body/query pero **siempre** valida contra `ctx.granjaIds`.

## Permisos

- Constantes en `<modulo>.permissions.ts`.
- Codigo string igual al de la spec (`lotes.crear`).
- Nunca hardcodear strings sueltos en servicios.

```typescript
export const PERMISOS = {
  LOTES_VER: 'lotes.ver',
  LOTES_CREAR: 'lotes.crear',
} as const;
```

## Auditoria

### Al crear entidad ABM

```typescript
entity.estadoRegistro = EstadoRegistro.ACTIVO;
entity.createdById = ctx.userId;
entity.updatedById = ctx.userId;
```

### Al crear evento

```typescript
evento.createdById = ctx.userId;
evento.anulado = false;
```

### Al anular evento

```typescript
evento.anulado = true;
evento.anuladoAt = new Date();
evento.anuladoById = ctx.userId;
evento.motivoAnulacion = motivo; // requerido, min 3 caracteres
```

### Inactivar maestra

- Cambiar `estadoRegistro` a `INACTIVO`.
- No eliminar registro.
- Rechazar uso en nuevas operaciones; conservar en historial.

## Validacion con Zod

- Un schema por operacion: `crearLoteSchema`, `anularConsumoSchema`.
- Exportar tipo inferido: `type CrearLoteInput = z.infer<typeof crearLoteSchema>`.
- Mensajes de error en espanol en `.refine()` y custom errors.
- Fechas: `z.coerce.date()` en API; en formularios puede ser string `YYYY-MM-DD`.
- UUIDs: `z.string().uuid()`.
- Cantidades enteras: `z.number().int().positive()`.
- Decimales: `z.string().regex(/^\d+(\.\d{1,4})?$/)` o `z.coerce.number().positive()`.

## Manejo de errores

- Lanzar subclases de `AppError` (ver `09-catalogo-errores.md`).
- No lanzar `Error` generico en servicios.
- No devolver stack trace al cliente.
- Log interno en servidor para errores 500.

```typescript
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 400,
    public details?: unknown,
  ) {
    super(message);
  }
}
```

## UI — convenciones mobile-first

### Layout general

- Grupo `(app)` protegido por middleware de sesion.
- `AppShell`: header (titulo + selector granja) + contenido + bottom nav movil.
- Bottom nav max 5 items en MVP v1.

### Componentes base (shadcn/ui)

| Componente | Uso |
|------------|-----|
| `Button` | Acciones primarias; min height 44px en movil |
| `Input`, `Select`, `Textarea` | Formularios; font-size min 16px (evita zoom iOS) |
| `Card` | Listados en movil |
| `Sheet` | Filtros y acciones secundarias en movil |
| `Dialog` | Confirmaciones (anular, cerrar engorde) |
| `Toast` | Exito/error tras guardar |
| `Skeleton` | Estados de carga |
| `Badge` | Estados operativos (Activo, Cerrado, Anulado) |

### Patrones de pantalla

**Listado**

- Movil: stack de `Card` con accion tap → detalle.
- Desktop: `Table` con mismas columnas clave.
- Siempre: busqueda simple + filtro por estado si aplica.

**Formulario**

- Una columna en movil.
- Boton guardar fijo abajo (`sticky`) en pantallas largas.
- Validacion inline con mensajes de Zod traducidos.
- Deshabilitar submit mientras `isSubmitting`.

**Detalle**

- Resumen arriba (datos clave).
- Tabs o secciones: Historial, Eventos, Acciones.
- Acciones destructivas (anular) requieren confirmacion + motivo.

**Estados vacios**

- Mensaje claro + CTA ("No hay lotes. Crear lote").

### Colores de estado (sugerido)

| Estado | Badge |
|--------|-------|
| Activo / En curso | verde/success |
| Cerrado | gris/secondary |
| Cancelado / Anulado | rojo/destructive |
| Inactivo (ABM) | outline |

## React Query (TanStack Query)

- Query keys: `['lotes', granjaActivaId, filtros]`.
- Mutaciones invalidan queries relacionadas al exito.
- `staleTime` corto (30s) en datos operativos; maestras pueden ser 5 min.

## Variables de entorno

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `DATABASE_URL` | Si | PostgreSQL |
| `AUTH_SECRET` | Si | Secreto Auth.js |
| `NODE_ENV` | Si | development / production |

Archivo `.env.development.example` commiteado; `.env.development` nunca commiteado.

## Testing — minimo MVP v1

| Que testear | Como | Donde |
|-------------|------|-------|
| Reglas de negocio puras | Vitest unitario | `*.rules.test.ts` |
| Schemas Zod | Vitest con casos validos/invalidos | `*.schemas.test.ts` |
| Servicios criticos | Integracion con BD test (fase 2) | opcional post-MVP |
| Flujos completos | Checklist manual | specs CA-* |

Prioridad de tests unitarios antes de entregar:

1. Stock no negativo.
2. Cantidad actual de lote.
3. Un engorde en curso por lote.
4. Anulacion de consumo.

## Checklist antes de mergear un modulo

- [ ] Spec funcional leida y CA cubiertos.
- [ ] Permisos aplicados en servicio.
- [ ] Filtro tenant en todas las queries.
- [ ] Schemas Zod para entradas.
- [ ] Errores usan codigos del catalogo 09.
- [ ] Eventos anulables no se eliminan.
- [ ] UI probada en viewport 375px.
- [ ] Tests de reglas criticas si aplica.

## Orden de lectura para implementar

1. Spec funcional del modulo (`docs/specs/`).
2. Decisiones transversales (`docs/decisions/`).
3. `07-diseno-tecnico-inicial.md`.
4. Este documento (`08`).
5. `09-catalogo-errores.md`.
6. Implementar.
