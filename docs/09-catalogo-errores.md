# Catalogo de Errores del Producto

Este documento define codigos estables, mensajes y mapeo HTTP. Debe usarse en servicios
NestJS (`AppError`) y en el filtro global `AppErrorFilter`.

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
| `AUTH_TOKEN_EXPIRED` | 401 | Su sesion expiro. Vuelva a iniciar sesion. |
| `AUTH_TOKEN_INVALID` | 401 | Sesion no valida. Vuelva a iniciar sesion. |
| `AUTH_REFRESH_INVALID` | 401 | Sesion no valida. Vuelva a iniciar sesion. |

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
| `USUARIO_CONTRASENA_DEBIL` | 422 | La contrasena debe tener al menos 8 caracteres, una mayuscula, un numero y un caracter especial. |
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
| `LOTE_ENGORDE_ACTIVO` | 409 | No puede cambiar cantidad o fecha porque el lote tiene un engorde. |
| `LOTE_ESTADO_GESTIONADO_POR_ENGORDE` | 409 | Cierre o reabra el lote desde el proceso de engorde. |

## Movimientos de ubicacion

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `MOV_UBICACION_DESTINO_IGUAL` | 422 | La ubicacion destino es la misma que la actual. |
| `MOV_UBICACION_ENTIDAD_INACTIVA` | 409 | No puede mover un lote inactivo o cerrado. |
| `MOV_UBICACION_YA_ANULADO` | 409 | El movimiento ya fue anulado. |
| `MOV_UBICACION_MOTIVO_REQUERIDO` | 422 | Debe indicar el motivo del movimiento. |
| `MOV_UBICACION_MOTIVO_ANULACION_REQUERIDO` | 422 | Debe indicar el motivo de anulacion. |
| `MOV_UBICACION_FECHA_INVALIDA` | 422 | La fecha no respeta el inicio ni el ultimo movimiento del lote. |
| `MOV_UBICACION_DESTINO_INVALIDO` | 422 | La ubicacion destino no pertenece a la granja. |
| `MOV_UBICACION_MOTIVO_INVALIDO` | 422 | Seleccione un motivo de movimiento activo. |
| `MOV_UBICACION_NO_ES_ULTIMO` | 409 | Solo puede anular el ultimo movimiento vigente. |
| `MOV_UBICACION_EDICION_DIRECTA` | 409 | Registre un movimiento para cambiar la ubicacion del lote. |

## Animales

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `ANIMAL_IDENTIFICACION_DUPLICADA` | 409 | Esta identificacion ya fue utilizada en la granja. |
| `ANIMAL_FECHA_INVALIDA` | 422 | Revise las fechas de nacimiento e ingreso. |
| `ANIMAL_RAZA_INVALIDA` | 422 | La raza no corresponde al tipo de animal. |
| `ANIMAL_PARENTESCO_INVALIDO` | 422 | Los progenitores informados no son validos. |
| `ANIMAL_PARENTESCO_CICLICO` | 409 | El parentesco generaria un ciclo genealogico. |
| `ANIMAL_SEXO_REPRODUCCION_INVALIDO` | 409 | Defina el sexo antes de usar el animal en reproduccion. |
| `ANIMAL_ESTADO_NO_ACTIVO` | 409 | El animal no esta activo para esta operacion. |
| `ANIMAL_EVENTO_TERMINAL_EXISTENTE` | 409 | El animal ya tiene un evento de salida vigente. |
| `ANIMAL_RETIRO_SANITARIO_VIGENTE` | 409 | El animal tiene un periodo de retiro sanitario vigente. |
| `ANIMAL_EVENTO_CON_DEPENDENCIAS` | 409 | El evento tiene actividad posterior y no puede anularse. |

## Sanidad

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `SANIDAD_SUJETO_INVALIDO` | 422 | Seleccione un animal o lote valido. |
| `SANIDAD_FECHA_INVALIDA` | 422 | La fecha del evento sanitario no es valida. |
| `SANIDAD_VETERINARIO_REQUERIDO` | 422 | Debe indicar un veterinario responsable. |
| `SANIDAD_VETERINARIO_INVALIDO` | 422 | El usuario seleccionado no puede actuar como veterinario. |
| `SANIDAD_CANTIDAD_TRATADA_INVALIDA` | 422 | La cantidad tratada no es valida para el lote. |
| `SANIDAD_DETALLE_TIPO_INVALIDO` | 422 | Complete los datos requeridos para el tipo de evento. |
| `SANIDAD_RETIRO_INVALIDO` | 422 | El periodo de retiro no es valido. |
| `SANIDAD_EVENTO_INMUTABLE` | 409 | Anule el evento y registre uno nuevo para corregirlo. |
| `SANIDAD_DIAGNOSTICO_CON_TRATAMIENTOS` | 409 | Anule primero los tratamientos asociados. |
| `SANIDAD_EVENTO_YA_ANULADO` | 409 | El evento sanitario ya fue anulado. |

## Reproduccion

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `REPRO_HEMBRA_NO_ELEGIBLE` | 409 | La hembra no esta disponible para reproduccion. |
| `REPRO_CICLO_ABIERTO_EXISTENTE` | 409 | La hembra ya tiene un ciclo reproductivo abierto. |
| `REPRO_CICLO_CERRADO` | 409 | El ciclo ya tiene un resultado definitivo. |
| `REPRO_SERVICIO_FECHA_INVALIDA` | 422 | La fecha del servicio no respeta el orden del ciclo. |
| `REPRO_SERVICIO_REFERENCIA_REQUERIDA` | 422 | Indique el macho o material genetico correspondiente. |
| `REPRO_MACHO_INVALIDO` | 422 | El macho seleccionado no es valido para el servicio. |
| `REPRO_GESTACION_ACTIVA_EXISTENTE` | 409 | La hembra ya tiene una gestacion activa. |
| `REPRO_CONFIRMACION_INVALIDA` | 422 | La confirmacion no es valida para el estado del ciclo. |
| `REPRO_CONTROL_FECHA_INVALIDA` | 422 | La fecha del control no es valida. |
| `REPRO_PARTO_DUPLICADO` | 409 | El ciclo ya tiene un parto vigente. |
| `REPRO_PARTO_CANTIDADES_INVALIDAS` | 422 | Revise los conteos de crias del parto. |
| `REPRO_CRIA_IDENTIFICACION_DUPLICADA` | 409 | Una identificacion de cria ya fue utilizada. |
| `REPRO_BAJA_LACTANCIA_EXCESIVA` | 409 | La baja supera las crias disponibles. |
| `REPRO_DESTETE_NO_CONCILIA` | 422 | Destetadas y bajas deben coincidir con las nacidas vivas. |
| `REPRO_EVENTO_CON_DEPENDENCIAS` | 409 | Anule primero los eventos posteriores del ciclo. |
| `REPRO_EVENTO_YA_ANULADO` | 409 | El evento reproductivo ya fue anulado. |

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
| `ENGORDE_YA_EXISTE` | 409 | El lote ya tiene un proceso de engorde valido. |
| `ENGORDE_NO_EN_CURSO` | 409 | El lote no tiene un engorde activo. |
| `ENGORDE_YA_CERRADO` | 409 | El engorde ya fue cerrado. |
| `ENGORDE_LOTE_NO_ELEGIBLE` | 409 | Solo puede iniciar engorde en un lote activo con finalidad Engorde. |
| `ENGORDE_FECHA_INICIO_INVALIDA` | 422 | La fecha de inicio debe ser valida y no puede ser futura. |
| `ENGORDE_OBJETIVO_PESO_INVALIDO` | 422 | El objetivo debe ser mayor que el peso inicial. |
| `ENGORDE_FECHA_CIERRE_INVALIDA` | 422 | La fecha de cierre no puede ser anterior al inicio ni futura. |
| `ENGORDE_EVENTOS_POSTERIORES` | 409 | Existen eventos posteriores a la fecha de cierre. |
| `ENGORDE_CANTIDAD_FINAL_INVALIDA` | 422 | La cantidad final debe coincidir con la cantidad actual del engorde. |
| `ENGORDE_PESO_FINAL_NO_APLICA` | 422 | No puede registrar peso final cuando no quedan animales. |
| `ENGORDE_BAJA_CANTIDAD_INVALIDA` | 422 | La cantidad de baja debe ser mayor que cero. |
| `ENGORDE_BAJA_EXCEDE_CANTIDAD` | 409 | La baja supera la cantidad actual del engorde. |
| `ENGORDE_BAJA_FECHA_INVALIDA` | 422 | La fecha de la baja no es valida para este engorde. |
| `ENGORDE_BAJA_YA_ANULADA` | 409 | La baja ya fue anulada. |
| `ENGORDE_BAJA_CON_CIERRE` | 409 | Anule primero el cierre para corregir esta baja. |
| `ENGORDE_MOTIVO_BAJA_INVALIDO` | 422 | Seleccione un motivo de baja activo. |
| `ENGORDE_MOTIVO_CIERRE_REQUERIDO` | 422 | Debe indicar el motivo de cierre. |
| `ENGORDE_MOTIVO_CIERRE_INVALIDO` | 422 | Seleccione un motivo de cierre activo. |
| `ENGORDE_CIERRE_YA_ANULADO` | 409 | El cierre ya fue anulado. |
| `ENGORDE_CIERRE_NO_VIGENTE` | 409 | El cierre indicado no es el cierre vigente. |
| `ENGORDE_ANULACION_CON_DEPENDENCIAS` | 409 | El engorde tiene actividad y no puede anularse completo. |
| `ENGORDE_MOTIVO_ANULACION_REQUERIDO` | 422 | Debe indicar el motivo de anulacion. |
| `ENGORDE_YA_ANULADO` | 409 | El engorde ya fue anulado. |

## Controles de peso

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `PESO_VALOR_INVALIDO` | 422 | El peso debe ser mayor que cero. |
| `PESO_LOTE_SIN_ANIMALES` | 409 | No puede registrar peso porque el lote no tiene animales disponibles. |
| `PESO_ENGORDE_REQUERIDO` | 422 | Debe seleccionar un engorde en curso. |
| `PESO_ENGORDE_NO_EN_CURSO` | 409 | Solo puede registrar controles en un engorde activo. |
| `PESO_LOTE_CERRADO` | 409 | No puede registrar peso en un lote cerrado. |
| `PESO_YA_ANULADO` | 409 | El control de peso ya fue anulado. |
| `PESO_MUESTRA_INVALIDA` | 422 | La cantidad de muestra debe ser mayor que cero. |
| `PESO_MUESTRA_EXCEDE_CANTIDAD` | 409 | La muestra supera la cantidad permitida para este control. |
| `PESO_MUESTRA_NO_APLICA` | 422 | No informe cantidad de muestra para un promedio de lote. |
| `PESO_MODALIDAD_INVALIDA` | 422 | Seleccione una modalidad de control valida. |
| `PESO_MOMENTO_PROTEGIDO` | 409 | Los pesos inicial y final se registran desde el engorde. |
| `PESO_METODO_REQUERIDO` | 422 | Debe indicar el metodo de pesaje. |
| `PESO_METODO_INVALIDO` | 422 | Seleccione un metodo de pesaje activo. |
| `PESO_FECHA_INVALIDA` | 422 | La fecha del control no es valida para este engorde. |
| `PESO_UNIDAD_INVALIDA` | 422 | Los controles del MVP deben registrarse en kilogramos. |
| `PESO_ORIGEN_PROTEGIDO` | 409 | Este control se corrige desde el inicio o cierre que lo genero. |
| `PESO_MOTIVO_ANULACION_REQUERIDO` | 422 | Debe indicar el motivo de anulacion. |

## Reportes

| Codigo | HTTP | Mensaje al usuario |
|--------|------|-------------------|
| `REPORTE_RANGO_FECHAS_INVALIDO` | 422 | La fecha inicial no puede ser posterior a la final. |
| `REPORTE_PERIODO_EXCEDIDO` | 422 | El periodo de consulta no puede superar 366 dias. |
| `REPORTE_GRANJA_REQUERIDA` | 422 | Debe seleccionar una granja para el reporte. |
| `REPORTE_FILTRO_INVALIDO` | 422 | Uno de los filtros no pertenece a la granja seleccionada. |
| `REPORTE_UNIDADES_INCOMPATIBLES` | 422 | No se pueden sumar cantidades con unidades incompatibles. |
| `REPORTE_SIN_DATOS` | 200 | No es error; retornar `{ data: [], meta: { total: 0 } }` |

## Implementacion en codigo

### Clases de error (`packages/shared/src/errors`)

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

### Filtro API NestJS (`apps/api/src/common/filters/app-error.filter.ts`)

```typescript
@Catch()
export class AppErrorFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();

    if (error instanceof AppError) {
      response.status(error.status).json({
        error: { code: error.code, message: error.message, details: error.details },
      });
      return;
    }

    // Registrar el error interno con el logger del servidor, sin exponerlo.
    response.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Ocurrio un error inesperado. Intente nuevamente.',
      },
    });
  }
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

## Errores especificados para MVP v2

Las familias `ANIMAL_*`, `SANIDAD_*` y `REPRO_*` ya estan definidas en este catalogo. Se
incorporan al codigo al implementar cada modulo; no crear un prefijo alternativo
`REPRODUCCION_*`.

## Mantenimiento del catalogo

Al agregar una regla de negocio nueva:

1. Definir codigo en este documento.
2. Usar ese codigo en el servicio.
3. Si el mensaje es visible en UI, verificar redaccion en espanol claro.
4. No reutilizar codigos con significado distinto.
