# Catalogo de Errores — MVP v1

Este documento define codigos de error estables, mensajes al usuario y mapeo HTTP. Debe usarse en servicios (`AppError`) y en `handleApiError`.

## Formato de respuesta de error

```typescript
{
  error: {
    code: 'LOTE_CODIGO_DUPLICADO',
    message: 'Ya existe un lote con ese codigo en la granja.',
    details?: { field: 'codigo' } | Record<string, unknown>
  }
}
```

## Reglas generales

| HTTP | Cuando usar |
|------|-------------|
| 400 | Validacion de forma (Zod), parametros invalidos |
| 401 | Sin sesion o sesion expirada |
| 403 | Sin permiso o sin acceso a granja/compania |
| 404 | Recurso no existe **en el tenant del usuario** |
| 409 | Conflicto de negocio (duplicado, estado invalido, stock) |
| 422 | Regla de negocio que no es conflicto de duplicado (ej. cantidad invalida) |
| 500 | Error inesperado; no exponer detalle interno |

**Nota:** Usar 404 (no 403) cuando el recurso existe pero pertenece a otro tenant — evita filtrar informacion.

## Errores transversales

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `VALIDATION_ERROR` | 400 | Los datos enviados no son validos. |
| `UNAUTHORIZED` | 401 | Debe iniciar sesion para continuar. |
| `SESSION_EXPIRED` | 401 | Su sesion expiro. Inicie sesion nuevamente. |
| `FORBIDDEN` | 403 | No tiene permiso para realizar esta accion. |
| `GRANJA_ACCESS_DENIED` | 403 | No tiene acceso a esta granja. |
| `TENANT_MISMATCH` | 403 | El recurso no pertenece a su compania. |
| `NOT_FOUND` | 404 | El registro solicitado no existe. |
| `INTERNAL_ERROR` | 500 | Ocurrio un error inesperado. Intente nuevamente. |

### Validacion Zod (400)

```typescript
{
  code: 'VALIDATION_ERROR',
  message: 'Los datos enviados no son validos.',
  details: {
    fields: {
      cantidadInicial: ['Debe ser mayor que cero'],
      codigo: ['Campo requerido']
    }
  }
}
```

## Autenticacion

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Correo o contrasena incorrectos. |
| `AUTH_USER_INACTIVE` | 403 | Su usuario esta inactivo. Contacte al administrador. |
| `AUTH_USER_BLOCKED` | 403 | Su usuario esta bloqueado. Contacte al administrador. |
| `AUTH_GRANJA_REQUIRED` | 400 | Debe seleccionar una granja para continuar. |

## Compania y granja

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `COMPANIA_NOMBRE_DUPLICADO` | 409 | Ya existe una compania con ese nombre. |
| `COMPANIA_INACTIVA` | 409 | La compania esta inactiva. |
| `GRANJA_NOMBRE_DUPLICADO` | 409 | Ya existe una granja con ese nombre en la compania. |
| `GRANJA_INACTIVA` | 409 | La granja esta inactiva. |
| `GRANJA_NO_PERTENECE_COMPANIA` | 422 | La granja no pertenece a la compania indicada. |

## Usuarios y perfiles

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `USUARIO_EMAIL_DUPLICADO` | 409 | Ya existe un usuario con ese correo. |
| `USUARIO_SIN_PERFIL` | 422 | El usuario debe tener al menos un perfil activo. |
| `USUARIO_SIN_GRANJA` | 422 | El usuario debe tener acceso a al menos una granja. |
| `USUARIO_GRANJA_EXTERNA` | 422 | No puede asignar una granja de otra compania. |
| `PERFIL_INACTIVO` | 409 | El perfil esta inactivo. |
| `PERFIL_NOMBRE_DUPLICADO` | 409 | Ya existe un perfil con ese nombre. |

## Maestras

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `MAESTRA_NOMBRE_DUPLICADO` | 409 | Ya existe un registro con ese nombre. |
| `MAESTRA_INACTIVA` | 409 | El registro esta inactivo y no puede usarse. |
| `MAESTRA_EN_USO` | 409 | No puede inactivar un registro usado en operaciones activas. |
| `UBICACION_NOMBRE_DUPLICADO` | 409 | Ya existe una ubicacion con ese nombre en la granja. |
| `UBICACION_GRANJA_INVALIDA` | 422 | La ubicacion no pertenece a la granja indicada. |

## Lotes

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `LOTE_CODIGO_DUPLICADO` | 409 | Ya existe un lote con ese codigo en la granja. |
| `LOTE_CANTIDAD_INVALIDA` | 422 | La cantidad inicial debe ser mayor que cero. |
| `LOTE_INACTIVO` | 409 | El lote no esta activo. |
| `LOTE_CERRADO` | 409 | El lote esta cerrado y no admite nuevos eventos. |
| `LOTE_CANCELADO` | 409 | El lote esta cancelado. |
| `LOTE_TIPO_ANIMAL_INACTIVO` | 409 | El tipo de animal seleccionado esta inactivo. |
| `LOTE_FINALIDAD_INACTIVA` | 409 | La finalidad productiva esta inactiva. |

## Movimientos de ubicacion

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `MOV_UBICACION_DESTINO_IGUAL` | 422 | La ubicacion destino es la misma que la actual. |
| `MOV_UBICACION_ENTIDAD_INACTIVA` | 409 | No puede mover un lote inactivo o cerrado. |
| `MOV_UBICACION_YA_ANULADO` | 409 | El movimiento ya fue anulado. |
| `MOV_UBICACION_MOTIVO_REQUERIDO` | 422 | Debe indicar el motivo de anulacion. |

## Inventario

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `INVENTARIO_ALIMENTO_DUPLICADO` | 409 | Ya existe un alimento con ese nombre. |
| `INVENTARIO_ALIMENTO_INACTIVO` | 409 | El alimento esta inactivo. |
| `INVENTARIO_ALMACEN_DUPLICADO` | 409 | Ya existe un almacen con ese nombre en la granja. |
| `INVENTARIO_ALMACEN_INACTIVO` | 409 | El almacen esta inactivo. |
| `INVENTARIO_PROVEEDOR_DUPLICADO` | 409 | Ya existe un proveedor con ese nombre. |
| `INVENTARIO_CANTIDAD_INVALIDA` | 422 | La cantidad debe ser mayor que cero. |
| `INVENTARIO_STOCK_INSUFICIENTE` | 409 | No hay existencia suficiente en el almacen. |
| `INVENTARIO_MOVIMIENTO_YA_ANULADO` | 409 | El movimiento ya fue anulado. |
| `INVENTARIO_TIPO_MOVIMIENTO_INVALIDO` | 422 | El tipo de movimiento no es valido para esta operacion. |

## Consumo de alimento

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `CONSUMO_ALMACEN_REQUERIDO` | 422 | Debe indicar el almacen de origen. |
| `CONSUMO_CANTIDAD_INVALIDA` | 422 | La cantidad consumida debe ser mayor que cero. |
| `CONSUMO_LOTE_CERRADO` | 409 | No puede registrar consumo en un lote cerrado. |
| `CONSUMO_YA_ANULADO` | 409 | El consumo ya fue anulado. |
| `CONSUMO_MOTIVO_ANULACION_REQUERIDO` | 422 | Debe indicar el motivo de anulacion. |
| `CONSUMO_STOCK_INSUFICIENTE` | 409 | No hay existencia suficiente para registrar el consumo. |

## Engorde

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `ENGORDE_YA_EN_CURSO` | 409 | El lote ya tiene un engorde en curso. |
| `ENGORDE_NO_EN_CURSO` | 409 | El lote no tiene un engorde activo. |
| `ENGORDE_YA_CERRADO` | 409 | El engorde ya fue cerrado. |
| `ENGORDE_CANTIDAD_FINAL_INVALIDA` | 422 | La cantidad final no puede ser negativa. |
| `ENGORDE_BAJA_CANTIDAD_INVALIDA` | 422 | La cantidad de baja debe ser mayor que cero. |
| `ENGORDE_BAJA_EXCEDE_CANTIDAD` | 409 | La baja supera la cantidad actual del lote. |
| `ENGORDE_MOTIVO_CIERRE_REQUERIDO` | 422 | Debe indicar el motivo de cierre. |
| `ENGORDE_YA_ANULADO` | 409 | El engorde ya fue anulado. |

## Controles de peso

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `PESO_VALOR_INVALIDO` | 422 | El peso debe ser mayor que cero. |
| `PESO_LOTE_CERRADO` | 409 | No puede registrar peso en un lote cerrado. |
| `PESO_YA_ANULADO` | 409 | El control de peso ya fue anulado. |
| `PESO_MUESTRA_INVALIDA` | 422 | La cantidad de muestra debe ser mayor que cero. |

## Reportes

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `REPORTE_RANGO_FECHAS_INVALIDO` | 422 | La fecha inicial no puede ser posterior a la final. |
| `REPORTE_GRANJA_REQUERIDA` | 422 | Debe seleccionar una granja para el reporte. |
| `REPORTE_SIN_DATOS` | 200 | No es error; retornar `{ data: [], meta: { total: 0 } }` |

## Implementacion en codigo

### Clases de error (`src/lib/errors.ts`)

```typescript
export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(details: unknown) {
    super('VALIDATION_ERROR', 'Los datos enviados no son validos.', 400, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(code = 'FORBIDDEN', message = 'No tiene permiso para realizar esta accion.') {
    super(code, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'El registro solicitado no existe.') {
    super('NOT_FOUND', message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 409, details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(code: string, message: string, details?: unknown) {
    super(code, message, 422, details);
  }
}
```

### Handler API (`src/lib/api/handle-api-error.ts`)

```typescript
export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      { error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }

  console.error(error);
  return Response.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Ocurrio un error inesperado. Intente nuevamente.' } },
    { status: 500 },
  );
}
```

### Ejemplo en servicio

```typescript
if (existente) {
  throw new ConflictError(
    'LOTE_CODIGO_DUPLICADO',
    'Ya existe un lote con ese codigo en la granja.',
    { field: 'codigo' },
  );
}
```

## Mapeo permiso → error

Cuando falla `requirePermission`:

- Codigo: `FORBIDDEN`
- HTTP: 403

Cuando falla `requireGranjaAccess`:

- Codigo: `GRANJA_ACCESS_DENIED`
- HTTP: 403

## Errores reservados para MVP v2+

No implementar handlers hasta que exista el modulo, pero reservar prefijos:

- `ANIMAL_*`
- `SANIDAD_*`
- `REPRODUCCION_*`

## Mantenimiento del catalogo

Al agregar una regla de negocio nueva:

1. Definir codigo en este documento.
2. Usar ese codigo en el servicio.
3. Si el mensaje es visible en UI, verificar redaccion en espanol claro.
4. No reutilizar codigos con significado distinto.
