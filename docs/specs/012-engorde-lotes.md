# Spec 012: Engorde de Lotes

## Estado

Implementado MVP v1 (2026-07-14)

## Objetivo

Permitir iniciar, controlar y cerrar el proceso de engorde de un lote, registrando bajas,
pesos de inicio y cierre, cantidades y resultado productivo con trazabilidad completa.

Esta especificacion implementa el ciclo definido en
`docs/decisions/0009-ciclo-engorde-y-cantidad-lote.md` y prepara los datos para
`013-controles-peso.md` y `017-reportes-engorde.md`.

## Dependencias

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `007-consumo-alimento.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0004-estado-registro-vs-estado-operativo.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`
- `docs/decisions/0009-ciclo-engorde-y-cantidad-lote.md`

`006-movimientos-ubicacion.md` no bloquea esta especificacion.

## Alcance MVP v1

Incluye:

- Inicio manual de un engorde para un lote.
- Un unico proceso de engorde valido por lote.
- Fecha, cantidad y peso promedio inicial opcional.
- Objetivo de peso opcional.
- Registro y anulacion de bajas.
- Cantidad actual calculada.
- Cierre con cantidad final, motivo y peso promedio final opcional.
- Anulacion trazable del cierre con reapertura del engorde y lote.
- Anulacion del proceso cuando aun no tiene eventos asociados.
- Resumen por lote con cantidades, bajas, pesos y consumos del periodo.
- Generacion automatica de controles de peso inicial y final cuando se informa peso.
- Seguridad por compania, granja y permisos.

No incluye:

- Animales individuales.
- Division, fusion o traslado entre lotes.
- Traslados entre granjas.
- Venta, facturacion o sacrificio como transaccion comercial.
- Edicion de bajas o cierres historicos.
- Conversion alimenticia o ganancia diaria promedio.
- Reapertura directa sin anulacion.
- Varios ciclos de engorde validos para el mismo lote.

## Conceptos y estados

### Proceso de engorde

Proceso productivo asociado a un lote. Usa:

- `EN_CURSO`: acepta bajas, consumos y controles.
- `CERRADO`: tiene un cierre vigente y el lote esta cerrado.
- `ANULADO`: inicio invalidado antes de registrar actividad.

### Cierre de engorde

Evento historico separado del proceso. Un engorde puede conservar cierres anulados, pero
solo uno puede estar vigente.

### Baja de engorde

Evento que reduce la cantidad actual. Puede representar muerte, descarte, venta parcial u
otra salida. El motivo determina si cuenta como mortalidad.

### Cantidad actual

```text
cantidadActual = cantidadInicial - SUM(bajas no anuladas)
```

No se persiste como campo editable.

### Cantidad final

Cantidad de animales que completan el proceso al momento del cierre, antes de una eventual
venta o sacrificio comercial. Debe coincidir con la cantidad actual previa al cierre.

## Maestras requeridas

### Motivo de cierre de engorde

- Alcance por compania.
- Nombre y descripcion.
- Estado de registro.
- Ejemplos iniciales: Venta, Sacrificio, Fin de ciclo, Otro.

### Motivo de baja de engorde

- Alcance por compania.
- Nombre y descripcion.
- `cuentaComoMortalidad` obligatorio.
- Estado de registro.
- Ejemplos iniciales:
  - Muerte (`cuentaComoMortalidad = true`).
  - Descarte (`false`).
  - Venta parcial (`false`).
  - Otra salida (`false`).

Los motivos inactivos se conservan en historiales, pero no pueden usarse en eventos nuevos.

Ambas maestras requieren seed inicial y ABM por compania:

- `/configuracion/maestras/motivos-cierre-engorde`
- `/configuracion/maestras/motivos-baja-engorde`

El ABM usa `maestras.administrar`; los usuarios operativos solo consultan opciones activas
mediante los endpoints del modulo.

## Datos requeridos

### Inicio

| Campo | Regla |
|-------|-------|
| `companiaId` | Derivado del tenant autenticado |
| `granjaId` | Obligatorio; granja permitida |
| `loteId` | Obligatorio; lote elegible |
| `fechaInicio` | Obligatoria |
| `cantidadInicial` | Se toma de la cantidad inicial del lote |
| `pesoInicialPromedioKg` | Opcional; mayor que cero |
| `modalidadPesoInicial` | Obligatoria si hay peso: `PROMEDIO_LOTE` o `MUESTRA` |
| `metodoPesajeInicialId` | Obligatorio si hay peso |
| `cantidadMuestraInicial` | Obligatoria si modalidad es `MUESTRA` |
| `objetivoPesoKg` | Opcional; mayor que cero |
| `observaciones` | Opcional |
| auditoria | Responsable y fecha |

### Baja

| Campo | Regla |
|-------|-------|
| `companiaId`, `granjaId` | Derivados del engorde y validados contra tenant |
| `engordeId`, `loteId` | Obligatorios y coherentes |
| `fecha` | Obligatoria |
| `cantidad` | Entero mayor que cero |
| `motivoId` | Obligatorio, activo y de la misma compania |
| `observaciones` | Opcional |
| auditoria/anulacion | Responsable, fecha y motivo |

### Cierre

| Campo | Regla |
|-------|-------|
| `companiaId`, `granjaId` | Derivados del engorde |
| `engordeId`, `loteId` | Obligatorios y coherentes |
| `fechaCierre` | Obligatoria |
| `cantidadFinal` | Obligatoria e igual a cantidad actual |
| `motivoCierreId` | Obligatorio, activo y de la misma compania |
| `pesoFinalPromedioKg` | Opcional; mayor que cero |
| `modalidadPesoFinal` | Obligatoria si hay peso |
| `metodoPesajeFinalId` | Obligatorio si hay peso |
| `cantidadMuestraFinal` | Obligatoria si modalidad es `MUESTRA` |
| `observaciones` | Opcional |
| auditoria/anulacion | Responsable, fecha y motivo |

## Reglas de negocio

### Inicio

1. El usuario debe tener `engorde.iniciar` y acceso a la granja.
2. El lote debe pertenecer a la compania y granja del contexto.
3. El lote debe tener estados de registro y operativo `ACTIVO`.
4. La finalidad productiva activa del lote debe tener `codigoSistema = ENGORDE`; nunca se
   valida por el nombre visible.
5. No puede existir otro engorde no anulado para el lote.
6. `fechaInicio` no puede ser anterior a la fecha de inicio del lote ni futura.
7. La cantidad inicial del engorde debe copiar la cantidad inicial del lote y ser mayor que
   cero.
8. Si se informa peso, se aplican las reglas de `013-controles-peso.md` y el control
   `INICIAL` se crea en la misma transaccion.
9. Si se informan peso inicial y objetivo, el objetivo debe ser mayor que el peso inicial.

### Bajas

1. Solo se registran en engordes `EN_CURSO` y lotes operativamente activos.
2. El lote tambien debe tener `estadoRegistro = ACTIVO`.
3. La fecha debe estar entre el inicio del engorde y la fecha actual.
4. La cantidad no puede superar la cantidad actual previa a la baja.
5. La baja es inmutable. Una correccion requiere anulacion y nuevo registro.
6. Al anular una baja se recalcula la cantidad actual.
7. No se puede anular una baja si eso vuelve inconsistente un cierre vigente; primero se
   debe anular el cierre.
8. Registrar una baja requiere `engorde.bajas.crear`; anularla requiere
   `engorde.anular`.

### Cierre

1. El usuario debe tener `engorde.cerrar`.
2. Solo puede cerrarse un engorde `EN_CURSO`.
3. La fecha no puede ser anterior al inicio ni futura.
4. No pueden existir bajas, controles o consumos no anulados posteriores a la fecha de
   cierre.
5. La cantidad final debe coincidir exactamente con la cantidad actual.
6. El motivo de cierre es obligatorio.
7. Si la cantidad final es cero, no se permite informar peso final.
8. Si se informa peso final, se crea un control `FINAL` en la misma transaccion.
9. La creacion del cierre, el control final y los cambios de estado de engorde/lote son
   atomicos.

### Anulacion del cierre

1. Requiere `engorde.anular` y motivo no vacio.
2. Solo puede anularse el cierre vigente.
3. El cierre permanece en historial como anulado.
4. El engorde vuelve a `EN_CURSO` y el lote a `ACTIVO`.
5. El control final generado por el cierre se anula con el mismo motivo.
6. Toda la operacion es transaccional.

### Anulacion del proceso

1. Requiere `engorde.anular` y motivo.
2. Solo aplica a un engorde `EN_CURSO` sin bajas, consumos ni controles manuales no
   anulados. El control inicial automatico no bloquea esta operacion.
3. Si existe un control inicial generado, se anula en la misma transaccion.
4. El proceso queda `ANULADO` y el lote permanece `ACTIVO`.
5. Luego puede iniciarse un nuevo proceso correcto para el lote.

### Resumen

El resumen debe mostrar:

- Lote, granja y estado.
- Fecha y cantidad inicial.
- Cantidad actual calculada.
- Bajas vigentes y anuladas claramente diferenciadas.
- Peso inicial, ultimo peso vigente y peso final cuando exista.
- Objetivo de peso.
- Consumo no anulado del lote cuya fecha este entre el inicio y el cierre vigente, o hasta
  la fecha actual si sigue en curso.
- Cierre vigente y cierres anulados.
- Ganancia promedio simple en kg por animal:
  `pesoFinalVigente - pesoInicialVigente`.

### Integracion con lotes y consumo

1. Mientras exista un engorde no anulado, `cantidadInicial` y `fechaInicio` del lote no son
   editables.
2. Un lote con engorde `EN_CURSO` o cierre vigente no puede cambiar manualmente su estado
   operativo desde el ABM.
3. El cierre y la reapertura del lote se realizan exclusivamente desde engorde.
4. El consumo sigue permitido para cualquier lote activo segun `007`; no exige un engorde.
5. Los consumos anteriores a `fechaInicio` no forman parte del resumen ni bloquean la
   anulacion del proceso.
6. Los consumos no anulados desde `fechaInicio` hasta hoy si bloquean la anulacion completa
   del proceso.

## Permisos

- `engorde.ver`
- `engorde.iniciar`
- `engorde.bajas.crear`
- `engorde.cerrar`
- `engorde.anular`

La API valida permisos y acceso por granja. La UI oculta o deshabilita acciones sin permiso,
pero nunca reemplaza la autorizacion del backend.

Los controles inicial/final son efectos del inicio/cierre: no exigen adicionalmente
`pesos.crear`. Se registran con el mismo usuario responsable de la operacion de engorde.

## API esperada

Las rutas se muestran sin el prefijo global `/api` configurado por NestJS.

| Metodo | Ruta | Uso |
|--------|------|-----|
| `GET` | `/engordes` | Lista paginada por granja, estado y lote |
| `GET` | `/engordes/:id` | Resumen del proceso |
| `POST` | `/engordes` | Iniciar engorde |
| `POST` | `/engordes/:id/bajas` | Registrar baja |
| `POST` | `/engordes/:id/bajas/:bajaId/anular` | Anular baja |
| `POST` | `/engordes/:id/cerrar` | Registrar cierre |
| `POST` | `/engordes/:id/cierres/:cierreId/anular` | Anular cierre |
| `POST` | `/engordes/:id/anular` | Anular proceso sin actividad |
| `GET/POST/PATCH` | `/motivos-cierre-engorde` | ABM y catalogo activo |
| `GET/POST/PATCH` | `/motivos-baja-engorde` | ABM y catalogo activo |

Todos los listados filtran por `companiaId` y granjas permitidas.

### Contratos principales

`GET /engordes` acepta `granjaId` obligatorio, y opcionalmente `loteId`, `estado`,
`incluirAnulados`, `page` y `limit`.

`POST /engordes` recibe:

```text
granjaId
loteId
fechaInicio
pesoInicialPromedioKg?
modalidadPesoInicial?
metodoPesajeInicialId?
cantidadMuestraInicial?
objetivoPesoKg?
observaciones?
```

`POST /engordes/:id/bajas` recibe `fecha`, `cantidad`, `motivoId` y `observaciones?`.

`POST /engordes/:id/cerrar` recibe:

```text
fechaCierre
cantidadFinal
motivoCierreId
pesoFinalPromedioKg?
modalidadPesoFinal?
metodoPesajeFinalId?
cantidadMuestraFinal?
observaciones?
```

Todos los endpoints de anulacion reciben `{ motivo }`. Compania, estados, cantidades
calculadas, auditoria y campos de controles automaticos son datos de servidor y los schemas
estrictos rechazan intentos de sobrescribirlos.

## Impacto sobre el modelo preliminar

La migracion inicial ya contiene tablas de engorde, pero fue creada antes de estas
decisiones. La implementacion debe crear una migracion nueva; no editar la migracion inicial:

- Crear `cierres_engorde` como entidad de evento.
- Mover los campos de cierre fuera de `engordes_lote` o marcarlos obsoletos tras migrar
  datos existentes.
- No persistir pesos duplicados en `engordes_lote`; `ControlPeso` es la fuente canonica.
- Agregar `companiaId` y `granjaId` a bajas y cierres.
- Agregar `cuentaComoMortalidad` a motivos de baja.
- Agregar `codigoSistema = ENGORDE` a la finalidad productiva correspondiente y sembrarlo
  por compania; el codigo es inmutable y unico por compania cuando no es nulo.
- Crear restriccion o indice que garantice un solo engorde no anulado por lote.
- Garantizar un solo cierre no anulado por engorde.
- Usar `EngordeLote.estado = ANULADO` como fuente de verdad del proceso y retirar el booleano
  redundante `anulado`; conservar campos de auditoria de anulacion.
- Ajustar la actualizacion de lotes para bloquear cantidad, fecha y estado operativo cuando
  exista un engorde no anulado.

## Errores funcionales

Los codigos `ENGORDE_*` se definen en `docs/09-catalogo-errores.md`. La API debe usar esos
codigos para lote no elegible, proceso existente, fechas, cantidades, motivos, bajas,
dependencias y anulaciones; no debe exponer errores genericos de base de datos.

## UX MVP

### Pantalla `/engorde`

- Contexto visible de granja activa.
- Listado de lotes elegibles, en curso y cerrados.
- Filtros `Todos | En curso | Cerrados`.
- Inicio de engorde mediante formulario colapsable.
- Resumen del engorde seleccionado.
- Acciones separadas para registrar baja y cerrar.
- Historial de bajas y cierres con estado textual.
- Enlace a `/pesos` conservando lote/engorde seleccionado.
- Confirmacion y motivo para toda anulacion.
- Toast en mutaciones; errores de carga inline.

La pantalla sigue `docs/11-guia-ux-ui.md` y el patron compartido de formularios.

## Criterios de aceptacion

### CA-001: Iniciar engorde elegible

Dado un lote activo con finalidad Engorde y sin proceso valido, cuando un usuario autorizado
registra una fecha valida, entonces se crea un engorde `EN_CURSO`.

### CA-002: Rechazar lote no elegible

Dado un lote inactivo, cerrado, de otra granja o con finalidad distinta de Engorde, cuando
se intenta iniciar un proceso, entonces la API rechaza la operacion.

### CA-003: Impedir segundo proceso valido

Dado un lote con engorde no anulado, cuando se intenta iniciar otro, entonces se rechaza la
operacion.

### CA-004: Generar peso inicial

Dado un inicio con peso y datos de pesaje validos, cuando se crea el engorde, entonces se
crea en la misma transaccion un control `INICIAL` vinculado.

### CA-005: Registrar baja

Dado un engorde en curso, cuando se registra una baja valida, entonces queda en historial y
la cantidad actual disminuye.

### CA-006: Impedir baja excesiva

Dada una cantidad actual conocida, cuando la baja la supera, entonces se rechaza sin
modificar datos.

### CA-007: Anular baja

Dada una baja incorrecta sin cierre incompatible, cuando se anula con motivo, entonces se
conserva y la cantidad actual se recalcula.

### CA-008: Cerrar engorde

Dado un engorde en curso con cantidad final igual a la calculada, cuando se registra un
cierre valido, entonces cierre, engorde y lote quedan actualizados atomicamente.

### CA-009: Generar peso final

Dado un cierre con peso y datos de pesaje validos, cuando se cierra, entonces se crea un
control `FINAL` vinculado dentro de la transaccion.

### CA-010: Rechazar cantidad final inconsistente

Dada una diferencia no registrada como baja, cuando se intenta cerrar, entonces se rechaza
la cantidad final.

### CA-011: Anular cierre y reabrir

Dado un cierre vigente incorrecto, cuando se anula con motivo, entonces el cierre y su
control final quedan anulados, el engorde vuelve a `EN_CURSO` y el lote a `ACTIVO`.

### CA-012: Anular proceso sin actividad

Dado un engorde sin bajas, consumos del periodo ni controles manuales vigentes, cuando se
anula con motivo, entonces queda `ANULADO`, su control inicial automatico se anula en la
misma transaccion y se permite iniciar un proceso correcto.

### CA-013: Bloquear anulacion con dependencias

Dado un engorde con actividad relacionada, cuando se intenta anular el proceso completo,
entonces se rechaza con `ENGORDE_ANULACION_CON_DEPENDENCIAS` y `details` informa cantidades
de bajas, consumos y controles manuales vigentes.

### CA-014: Consultar resumen

Dado un engorde registrado, cuando se consulta, entonces se muestran cantidades, bajas,
pesos, consumos y cierres respetando registros anulados.

### CA-015: Respetar tenant y granja

Dado un usuario sin acceso a la granja, cuando intenta consultar o mutar el engorde,
entonces la API no expone ni modifica sus datos.

### CA-016: Bloquear cambios directos del lote

Dado un lote con engorde no anulado, cuando se intenta editar su cantidad inicial, fecha de
inicio o estado operativo desde el ABM, entonces la API rechaza el cambio.

### CA-017: Delimitar consumos del engorde

Dado un lote con consumos anteriores y posteriores al inicio, cuando se consulta el resumen
o se valida la anulacion, entonces solo se consideran consumos no anulados con fecha desde
el inicio del engorde.

## Verificacion requerida para cierre

- Pruebas unitarias de cantidad actual, baja maxima, fechas y cantidad final.
- Pruebas de integracion para inicio unico, cierre transaccional y reapertura.
- Pruebas de integracion multi-tenant y acceso por granja.
- Prueba de rollback: si falla el control inicial/final no se crea inicio/cierre parcial.
- Prueba manual mobile-first de inicio, baja, cierre, anulaciones y enlaces con `/pesos`.
- `pnpm typecheck` y lint sin errores nuevos.

## Preguntas abiertas

No quedan preguntas abiertas que bloqueen el MVP v1.

Pendientes para fases posteriores:

- Incorporar divisiones, fusiones y traslados a la cantidad actual.
- Integrar ventas o sacrificios como transacciones comerciales.
- Permitir multiples ciclos productivos para un mismo lote.
- Calcular conversion alimenticia y ganancia diaria en reportes.

## Decisiones MVP v1

- Inicio manual.
- Solo lotes activos con finalidad Engorde.
- Un unico proceso valido por lote.
- Cantidad actual derivada exclusivamente de bajas vigentes.
- Toda diferencia de cantidad se registra como baja.
- Cierre como evento separado y anulable.
- Anular cierre reabre engorde y lote con trazabilidad.
- Pesos inicial/final opcionales generan controles vinculados.
- Conversion alimenticia fuera de esta spec.
