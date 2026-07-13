# Spec 003: Gestion de Lotes

## Estado

Implementado MVP v1 (2026-06-17)

## Objetivo

Permitir registrar y consultar lotes de animales manejados como una unidad productiva dentro de una granja. Esta especificacion soporta procesos como engorde, cria grupal y otros manejos donde no se requiere identificar individualmente a cada animal.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`

## Alcance

Incluye:

- Registro de lotes.
- Asignacion de lote a compania y granja.
- Asignacion de tipo de animal.
- Asignacion de finalidad productiva.
- Registro de cantidad inicial.
- Registro de fecha de inicio.
- Consulta de ficha basica del lote.
- Cambio de estado del lote.
- Asignacion opcional de ubicacion interna.

No incluye en esta version:

- Consumo de alimento por lote.
- Controles de peso.
- Cierre productivo detallado.
- Veterinario tratante, vacunaciones, enfermedades o tratamientos.
- Inventario.
- Reportes avanzados.

## Conceptos principales

### Lote

Grupo de animales manejado como unidad productiva. Puede representar animales de engorde, crias agrupadas, aves o cualquier grupo donde el control individual no sea necesario.

### Cantidad inicial

Numero de animales con los que inicia el lote.

### Cantidad actual

Numero de animales disponibles. En MVP v1 se calcula segun ADR `0009` como cantidad
inicial del engorde menos bajas no anuladas; no es editable.

## Datos requeridos

### Lote

- Codigo o identificacion unica.
- Compania.
- Granja.
- Tipo de animal.
- Finalidad productiva.
- Fecha de inicio.
- Cantidad inicial.
- `ubicacionInicialId` opcional e inmutable al habilitar spec `006`; `ubicacionId` conserva
  la ubicacion actual.
- Estado.
- Observaciones opcionales.

## Reglas de negocio

- Todo lote debe pertenecer a una compania y a una granja.
- La granja del lote debe pertenecer a la compania seleccionada.
- El usuario debe tener permiso para registrar o modificar lotes.
- El usuario solo puede operar sobre lotes de granjas a las que tiene acceso.
- Todo lote debe tener una identificacion unica dentro de la granja.
- Todo lote debe pertenecer a un tipo de animal.
- Todo lote debe tener una finalidad productiva.
- La cantidad inicial debe ser mayor que cero.
- Si se asigna ubicacion interna, la ubicacion debe pertenecer a la misma granja del lote.
- Al implementar spec `006`, la ubicacion de alta se copia a `ubicacionInicialId` inmutable y
  `ubicacionId` representa la actual.
- Los estados iniciales permitidos para un lote son: activo, cerrado, cancelado.
- Un lote cerrado no debe recibir nuevos eventos productivos, salvo que una especificacion futura indique lo contrario.
- Cuando existe un engorde no anulado, cantidad inicial y fecha de inicio quedan bloqueadas.
- Un lote con engorde en curso o cierre vigente no cambia estado operativo desde el ABM;
  cierre y reapertura se gestionan desde `012-engorde-lotes.md`.

## Criterios de aceptacion

### CA-001: Registrar lote

Dado que existe una compania activa, una granja activa, un tipo de animal activo y una finalidad productiva activa, cuando un usuario con permisos registra un lote con datos validos, entonces el lote queda guardado en estado activo.

### CA-002: Evitar identificacion duplicada por granja

Dado que existe un lote con codigo `LOT-001` dentro de una granja, cuando el usuario intenta registrar otro lote con el mismo codigo en esa granja, entonces el sistema debe rechazarlo.

### CA-003: Validar cantidad inicial

Dado un usuario registrando un lote, cuando informa cantidad inicial menor o igual a cero, entonces el sistema debe rechazar el registro.

### CA-004: Consultar ficha del lote

Dado un lote registrado, cuando el usuario consulta su ficha, entonces el sistema muestra codigo, compania, granja, tipo de animal, finalidad, fecha de inicio, cantidad inicial, ubicacion, estado y observaciones.

### CA-005: Cambiar estado del lote

Dado un lote activo sin engorde no anulado, cuando el usuario cambia su estado a cerrado o
cancelado, entonces el lote deja de estar disponible para nuevos eventos productivos. Si
tiene engorde, la API rechaza el cambio y exige usar el flujo de engorde.

### CA-006: Validar acceso del usuario a la granja

Dado un usuario sin acceso a una granja, cuando intenta consultar o modificar lotes de esa granja, entonces el sistema debe impedir la accion.

## Cierre de implementacion MVP v1

**Fecha de cierre:** 2026-06-17  
**Rama de trabajo:** `feature/lotes-gestion`

### Entregables implementados

| Capa | Alcance |
|------|---------|
| API (`apps/api`) | Modulo `/lotes`: listar (por granja activa o `granjaId`), crear, actualizar; permisos `lotes.ver`, `lotes.crear`, `lotes.editar`; validacion tenant y acceso por granja; codigo unico por granja; maestras activas; ubicacion opcional de la misma granja |
| Web (`apps/web`) | Pantalla `/lotes` con ABM, filtros por estado de registro y estado operativo, busqueda por codigo, paginacion, toasts, confirmacion de inactivacion, campos obligatorios; usa granja activa del header |
| Datos | Entidad `Lote` en migracion inicial (`estadoOperativo`, `estadoRegistro`, auditoria basica) |
| Shared | Schemas Zod `crearLoteSchema` / `actualizarLoteSchema`; permisos en `PERMISOS` |

### Pantallas web

- `/lotes` — listado por granja activa, crear lote, editar, inactivar registro, cambiar estado operativo (`ACTIVO` / `CERRADO` / `CANCELADO`)

### Verificacion de criterios de aceptacion

| ID | Estado | Notas |
|----|--------|-------|
| CA-001 | OK | Alta con granja, tipo de animal y finalidad activos; `estadoOperativo` inicial `ACTIVO` |
| CA-002 | OK | Unicidad `(granjaId, codigo)`; error `LOTE_CODIGO_DUPLICADO` |
| CA-003 | OK | `cantidadInicial` > 0 en API y validacion cliente |
| CA-004 | OK | Ficha basica en tarjeta de listado y formulario de edicion (codigo, tipo, finalidad, fecha, cantidad, ubicacion, estados, observaciones) |
| CA-005 | OK base | Cambio manual disponible sin engorde; `012` agregara bloqueo y gestionara cierre/reapertura cuando exista proceso |
| CA-006 | OK | `requireGranjaAccess` en listado y mutaciones; sin acceso a granja ajena |

### Verificacion tecnica

- [x] `pnpm run typecheck`
- [x] Prueba manual funcional (usuario con permisos de lotes)

### Dependencias para modulos siguientes (no bloquean cierre de spec)

- **Cantidad actual:** no se muestra ni calcula en esta version; queda para `012-engorde-lotes.md` (bajas) y modulos de movimiento.
- **Bloqueo operativo en API:** lotes `CERRADO` / `CANCELADO` rechazaran nuevos consumos, pesos o engordes cuando existan esos modulos.
- **Movimientos de ubicacion:** cambio de ubicacion con historial en `006-movimientos-ubicacion.md` (hoy solo asignacion directa opcional al crear/editar).

### Mejoras opcionales pospuestas

- Endpoint `GET /lotes/:id` dedicado para ficha detallada.
- Generacion automatica de codigo de lote.
- Tarjeta resumen en dashboard con conteo de lotes activos (hoy placeholder).
- Tests automatizados de reglas en `lotes.rules.ts`.

## Preguntas abiertas

Resueltas para MVP v1 (ver tambien `docs/06-cierre-sdd.md`):

- Identificacion del lote manual, automatica o ambas → **Manual en v1.** El modelo permite codigo automatico en el futuro.
- Cantidad actual calculada o manual → **Calculada** a partir de bajas de engorde (`012`); **no editable manualmente.** En v1 solo se persiste y muestra `cantidadInicial` hasta implementar engorde.
- Traslados entre lotes → **No en v1.**
- Division o fusion de lotes → **No en v1.**

## Decisiones tomadas

- Codigo de lote **manual** y unico por granja.
- Separacion **estado de registro** (`ACTIVO` / `INACTIVO`, ABM) y **estado operativo** (`ACTIVO` / `CERRADO` / `CANCELADO`, productivo), segun `docs/decisions/0004-estado-registro-vs-estado-operativo.md`.
- Los lotes se registran sobre la **granja activa** del usuario en la UI; la API valida acceso por `granjaId`.
- Ubicacion interna **opcional**; si se informa, debe pertenecer a la misma granja y estar activa.
- Inactivacion de registro (`estadoRegistro = INACTIVO`) con confirmacion y toast; reactivacion desde edicion.
- Permisos: `lotes.ver`, `lotes.crear`, `lotes.editar` (seed y constantes shared).
- Patron ABM, paginacion, toasts y campos obligatorios alineados con specs `000` y `001`.

## Notas para futuras specs

- El consumo de alimento por lote se definira en `007-consumo-alimento.md`.
- El veterinario tratante y el historial sanitario del lote se gestionan en `004-sanidad-animal.md`.
- Los movimientos de ubicacion se gestionan en `006-movimientos-ubicacion.md`.
- Los controles de peso se definen en `013-controles-peso.md`.
- El cierre productivo detallado se define en `012-engorde-lotes.md`.
