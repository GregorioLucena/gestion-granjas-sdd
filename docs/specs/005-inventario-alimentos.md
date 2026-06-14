# Spec 005: Inventario de Alimentos

## Estado

Borrador inicial

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

## Preguntas abiertas

- El MVP permitira inventario negativo o siempre lo bloqueara?
- El costo se manejara como ultimo costo, costo promedio ponderado o costo manual por movimiento?
- Se necesitara controlar fecha de vencimiento desde el MVP?
- Los alimentos podran manejar conversion entre presentacion y unidad base, por ejemplo saco de 40 kg?
- Se registraran mezclas de alimentos en el MVP o quedaran para una fase posterior?

## Decisiones tomadas

- El inventario de alimentos se manejara separado del consumo diario.
- Los movimientos de inventario son eventos historicos, no maestras.
- Los alimentos, proveedores y almacenes se gestionaran desde ABM.
- La existencia se controla por compania, granja, almacen y alimento.
- En el MVP no se permitira salida que deje existencia negativa.
- El inventario de medicamentos queda fuera de esta especificacion.
