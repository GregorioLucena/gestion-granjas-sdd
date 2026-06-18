# Spec 005: Inventario de Alimentos

## Estado

Implementado MVP v1 (2026-06-17)

## Objetivo

Permitir registrar, controlar y consultar el inventario de alimentos de una granja, incluyendo alimentos, presentaciones, proveedores, almacenes, entradas, salidas, ajustes, costos y existencias.

Esta especificacion crea la base para registrar consumo de alimento por animal o lote en `007-consumo-alimento.md`.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `docs/03-catalogo-maestras.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Registro de alimentos usados por una compania.
- Asociacion de alimentos con tipo, presentacion, unidad de medida y destino productivo.
- Registro de proveedores.
- Registro de almacenes o depositos por granja.
- Registro de entradas de inventario.
- Registro de salidas manuales de inventario.
- Registro de ajustes de inventario.
- Control de costo por unidad o presentacion.
- Consulta de existencia actual por alimento, granja y almacen.
- Consulta de movimientos de inventario.

No incluye en esta version:

- Consumo diario por animal o lote.
- Compras con cuentas por pagar.
- Facturacion.
- Inventario de medicamentos.
- Recetas de mezclas alimentarias.
- Alertas automaticas por stock minimo.
- Lotes de vencimiento avanzados.

## Conceptos principales

### Alimento

Producto alimenticio usado para animales o lotes. Puede estar destinado a una etapa productiva o finalidad especifica.

Ejemplos:

- Alimento gestacion.
- Alimento lactancia.
- Alimento iniciador.
- Alimento engorde.

### Presentacion

Formato comercial o forma de manejo del alimento.

Ejemplos:

- Saco.
- Granel.
- Litro.
- Mezcla.

### Almacen

Ubicacion fisica dentro de una granja donde se guarda alimento.

Ejemplos:

- Deposito principal.
- Deposito de alimentos.
- Silo 01.

### Movimiento de inventario

Registro fechado que aumenta, disminuye o ajusta la existencia de un alimento.

Tipos iniciales:

- Compra.
- Entrada manual.
- Salida manual.
- Ajuste positivo.
- Ajuste negativo.
- Devolucion.
- Vencimiento.

### Existencia

Cantidad disponible de un alimento en una granja y almacen.

### Costo unitario

Costo por unidad base o presentacion usada para valorar movimientos y consumos.

## Datos requeridos

### Alimento

- Compania.
- Nombre.
- Tipo de alimento.
- Presentacion.
- Unidad de medida base.
- Destino de alimento opcional.
- Costo de referencia opcional.
- Estado de registro.
- Observaciones opcionales.

### Proveedor

- Compania.
- Nombre.
- Identificacion fiscal opcional.
- Telefono opcional.
- Correo opcional.
- Direccion opcional.
- Estado de registro.

### Almacen

- Compania.
- Granja.
- Nombre.
- Codigo opcional.
- Ubicacion interna opcional.
- Estado de registro.
- Observaciones opcionales.

### Movimiento de inventario

- Compania.
- Granja.
- Almacen.
- Alimento.
- Tipo de movimiento de inventario.
- Fecha del movimiento.
- Cantidad.
- Unidad de medida.
- Costo unitario opcional.
- Costo total opcional.
- Proveedor opcional.
- Motivo de ajuste opcional.
- Referencia o documento opcional.
- Observaciones opcionales.

## Reglas de negocio

- Todo alimento debe pertenecer a una compania.
- Todo almacen debe pertenecer a una granja.
- La granja del almacen debe pertenecer a la compania seleccionada.
- Todo movimiento de inventario debe pertenecer a una compania, granja y almacen.
- El alimento del movimiento debe pertenecer a la misma compania del movimiento.
- El usuario debe tener permiso para registrar o consultar inventario.
- El usuario solo puede operar inventario de granjas a las que tiene acceso.
- La cantidad de un movimiento debe ser mayor que cero.
- Los movimientos de entrada aumentan existencia.
- Los movimientos de salida disminuyen existencia.
- Los ajustes positivos aumentan existencia.
- Los ajustes negativos disminuyen existencia.
- No debe permitirse una salida que deje existencia negativa, salvo que una decision futura habilite inventario negativo.
- Los alimentos inactivos no deben estar disponibles para nuevos movimientos.
- Los almacenes inactivos no deben estar disponibles para nuevos movimientos.
- Los movimientos de inventario no deben eliminarse fisicamente si afectan existencia; deben anularse o compensarse segun `0005-auditoria-y-trazabilidad.md`.
- El costo total puede calcularse como cantidad por costo unitario cuando ambos datos existan.
- La existencia debe poder consultarse por granja, almacen y alimento.

## Permisos requeridos

- `inventario.ver`: consultar existencias y movimientos.
- `inventario.alimentos.crear`: registrar alimentos.
- `inventario.alimentos.editar`: modificar alimentos.
- `inventario.proveedores.administrar`: administrar proveedores.
- `inventario.almacenes.administrar`: administrar almacenes.
- `inventario.movimientos.crear`: registrar movimientos.
- `inventario.ajustes.crear`: registrar ajustes.

## UX / pantallas web (MVP v1)

Patron hub + una pantalla por catalogo (ver `docs/11-guia-ux-ui.md`):

| Ruta | Contenido |
|------|-----------|
| `/inventario` | Hub con tarjetas de navegacion |
| `/inventario/existencias` | Consulta principal por granja activa; cantidad por almacen y alimento |
| `/inventario/movimientos` | Historial y registro de entradas, salidas y ajustes |
| `/inventario/alimentos` | ABM de alimentos |
| `/inventario/proveedores` | ABM de proveedores |
| `/inventario/almacenes` | ABM de almacenes por granja activa |
| `/inventario/tipos-alimento` | Catalogo de tipos de alimento (prerequisito) |
| `/inventario/presentaciones` | Catalogo de presentaciones (prerequisito) |

- Contexto visible: granja activa en pantallas operativas (almacenes, movimientos, existencias).
- Unidades de medida: catalogo global de solo lectura (seed); se elige al crear alimento.
- Tipos de movimiento: catalogo global de solo lectura (seed).
- Mutaciones con toast de exito o error (`error.message` del backend).
- Campos obligatorios con `*` y mensaje inline al guardar.
- Inactivacion de maestras con confirmacion y toast.
- Existencias en cero no se muestran en el listado principal (solo combinaciones con stock > 0).

## Criterios de aceptacion

### CA-001: Registrar alimento

Dado que existe una compania activa y maestras de tipo de alimento, presentacion y unidad de medida activas, cuando un usuario con permisos registra un alimento con datos validos, entonces el alimento queda disponible para movimientos de inventario.

### CA-002: Registrar proveedor

Dado un usuario con permisos, cuando registra un proveedor con nombre valido dentro de una compania, entonces el proveedor queda disponible para asociarlo a entradas de inventario.

### CA-003: Registrar almacen por granja

Dado que existe una granja activa, cuando un usuario con permisos registra un almacen con datos validos, entonces el almacen queda asociado a esa granja.

### CA-004: Registrar entrada de inventario

Dado un alimento activo y un almacen activo, cuando un usuario con permisos registra una entrada con cantidad mayor que cero, entonces la existencia del alimento aumenta en ese almacen.

### CA-005: Registrar salida manual

Dado un alimento con existencia suficiente, cuando un usuario con permisos registra una salida manual con cantidad valida, entonces la existencia del alimento disminuye en ese almacen.

### CA-006: Impedir salida con existencia insuficiente

Dado un alimento con existencia menor a la cantidad solicitada, cuando el usuario intenta registrar una salida, entonces el sistema debe rechazar el movimiento.

### CA-007: Registrar ajuste positivo

Dado un alimento y almacen activos, cuando un usuario con permisos registra un ajuste positivo, entonces la existencia aumenta y el movimiento queda en el historial.

### CA-008: Registrar ajuste negativo

Dado un alimento con existencia suficiente, cuando un usuario con permisos registra un ajuste negativo, entonces la existencia disminuye y el movimiento queda en el historial.

### CA-009: Consultar existencia

Dado que existen movimientos de inventario, cuando el usuario consulta existencias, entonces el sistema muestra cantidad disponible por compania, granja, almacen y alimento.

### CA-010: Validar acceso por granja

Dado un usuario sin acceso a una granja, cuando intenta consultar o registrar movimientos de inventario en esa granja, entonces el sistema debe impedir la accion.

### CA-011: Consultar historial de movimientos

Dado un alimento registrado, cuando el usuario consulta su historial, entonces el sistema muestra entradas, salidas, ajustes, fechas, cantidades, costos y referencias.

## Cierre de implementacion MVP v1

**Fecha de cierre:** 2026-06-17  
**Rama de trabajo:** `feature/inventario-alimentos`

### Entregables implementados

| Capa | Alcance |
|------|---------|
| API (`apps/api`) | Modulo `inventario`: tipos/presentaciones alimento, proveedores, almacenes, alimentos, movimientos, existencias, unidades y tipos de movimiento (lectura); permisos granulares; stock no negativo; anulacion con motivo; validacion tenant y granja |
| Web (`apps/web`) | Hub `/inventario` + 7 pantallas (existencias, movimientos, alimentos, proveedores, almacenes, tipos-alimento, presentaciones); patron ABM mobile-first; toasts y confirmaciones |
| Datos | Entidades `Alimento`, `Almacen`, `Proveedor`, `MovimientoInventario`, maestras `TipoAlimento`, `PresentacionAlimento`; seed demo con catalogos, almacen, alimentos y entradas iniciales |
| Shared | Schemas Zod en `inventario.schemas.ts`; permisos `INVENTARIO_*` en `PERMISOS` |

### Pantallas web

- `/inventario` — hub de navegacion
- `/inventario/existencias` — stock por granja activa, almacen y alimento
- `/inventario/movimientos` — historial; entradas, salidas manuales y ajustes; anulacion con motivo
- `/inventario/alimentos` — ABM con tipo, presentacion, unidad base y factor de conversion
- `/inventario/proveedores` — ABM de proveedores
- `/inventario/almacenes` — ABM por granja activa
- `/inventario/tipos-alimento` y `/inventario/presentaciones` — catalogos prerequisito

### Verificacion de criterios de aceptacion

| ID | Estado | Notas |
|----|--------|-------|
| CA-001 | OK | Alta con maestras activas; unicidad por nombre en compania |
| CA-002 | OK | ABM proveedores con permiso `inventario.proveedores.administrar` |
| CA-003 | OK | Almacen asociado a granja activa; ubicacion interna opcional |
| CA-004 | OK | Entradas `ENTRADA_COMPRA` / `ENTRADA_MANUAL` aumentan existencia |
| CA-005 | OK | Salida manual `SALIDA_MANUAL` disminuye existencia |
| CA-006 | OK | Error `INVENTARIO_STOCK_INSUFICIENTE` si no hay stock |
| CA-007 | OK | Ajuste positivo con permiso `inventario.ajustes.crear` |
| CA-008 | OK | Ajuste negativo valida stock suficiente |
| CA-009 | OK | `GET /existencias-inventario` agrupa por granja, almacen y alimento (stock > 0) |
| CA-010 | OK | `requireGranjaAccess` en operaciones por granja |
| CA-011 | OK | Listado paginado de movimientos con tipo, fechas, cantidades y costos |

### Verificacion tecnica

- [x] `pnpm run typecheck`
- [x] Prueba manual funcional (usuario con permisos de inventario; requiere reiniciar API tras agregar el modulo)

### Dependencias para modulos siguientes (no bloquean cierre de spec)

- **Consumo (`007`):** usara `SALIDA_CONSUMO` y descontara desde almacen origen en transaccion.
- **Reportes (`015`):** reutilizaran existencias y movimientos ya persistidos.
- **Destino productivo en alimento:** campo no modelado en v1; queda para fase posterior si se requiere.
- **Conversion en movimiento:** cantidad siempre en unidad base del alimento; el factor documenta presentacion vs base.

### Mejoras opcionales pospuestas

- Alertas de stock bajo en dashboard (hoy metrica placeholder).
- Filtros avanzados en existencias (por almacen o alimento).
- Endpoint `GET /alimentos/:id` para ficha detallada.
- Tests automatizados de reglas en `inventario.rules.ts`.
- ABM de unidades de medida (hoy solo lectura desde seed global).

## Preguntas abiertas

Resueltas para MVP v1 (ver `docs/06-cierre-sdd.md`):

| Pregunta | Decision MVP v1 |
|----------|-----------------|
| Inventario negativo? | No permitido. |
| Metodo de costo? | Costo manual por movimiento. Promedio ponderado en fase posterior. |
| Control de vencimiento? | No en v1. |
| Conversion presentacion/unidad base? | Si. Campo `factorConversion` en alimento (ej. 1 saco = 40 kg). |
| Mezclas de alimentos? | No en v1. |

Tipos de movimiento usados en v1 (seed global):

| Codigo | Uso en UI |
|--------|-----------|
| `ENTRADA_COMPRA` | Entrada con proveedor opcional |
| `ENTRADA_MANUAL` | Entrada sin compra formal |
| `SALIDA_MANUAL` | Salida manual de inventario |
| `AJUSTE_POSITIVO` / `AJUSTE_NEGATIVO` | Ajustes con motivo obligatorio |
| `SALIDA_CONSUMO` | Reservado para `007-consumo-alimento.md` (no en pantalla de inventario) |

## Decisiones tomadas

- El inventario de alimentos se manejara separado del consumo diario.
- Los movimientos de inventario son eventos historicos, no maestras.
- Los alimentos, proveedores y almacenes se gestionaran desde ABM.
- La existencia se controla por compania, granja, almacen y alimento.
- En el MVP no se permitira salida que deje existencia negativa.
- El inventario de medicamentos queda fuera de esta especificacion.
- Cantidad de movimientos siempre en unidad base del alimento (`unidadMedidaId` del alimento).
- Anulacion de movimientos con motivo; no borrado fisico (`docs/decisions/0005-auditoria-y-trazabilidad.md`).
- Tipos de alimento y presentaciones se administran desde inventario (no desde configuracion general).
- Permisos alineados con seed y `packages/shared/src/permissions/constants.ts`.
