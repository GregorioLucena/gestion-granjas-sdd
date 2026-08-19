# Spec 015: Reportes de Alimentacion

## Estado

Implementado MVP v1 (2026-07-14)

## Objetivo

Consolidar inventario y consumos por lote para consultar cantidades, existencias,
movimientos y costos disponibles respetando tenant, granjas, periodos y anulaciones.

## Dependencias

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `005-inventario-alimentos.md`
- `007-consumo-alimento.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

No depende de animales individuales, etapas productivas, engorde ni pesos.

## Alcance MVP v1

Incluye:

- Consumo por lote.
- Consumo agregado por alimento.
- Consumo por granja y periodo.
- Existencias por almacen y alimento.
- Movimientos de inventario.
- Resumen de entradas, salidas y ajustes.
- Costo conocido por consumo, lote y alimento.
- Cobertura de costos cuando faltan valores.
- Filtros, totales y detalle en pantalla.

No incluye:

- Consumo por animal.
- Etapas productivas.
- Graficos.
- Exportacion Excel/PDF.
- Costeo promedio, FIFO o contabilidad.
- Predicciones o comparativas entre companias.
- Alertas accionables con feedback (ver `018-asistente-recomendaciones.md`).

## Fuente de datos

- `ConsumoAlimento` no anulado.
- `MovimientoInventario` no anulado asociado al consumo.
- Movimientos validos de entradas, salidas y ajustes.
- Alimentos, almacenes, lotes, granjas y unidades historicas, aunque esten inactivos.

Se usa `fecha` productiva para filtros; `createdAt` solo sirve para auditoria y desempate.

## Unidades

- Consumos se presentan en kg usando la unidad base y factor de conversion ya definidos en
  inventario.
- Existencias se presentan en la unidad base del alimento.
- No se suman cantidades de unidades incompatibles.
- La respuesta indica unidad en cada total.

## Costos

### Costo de un consumo

Se toma del movimiento de inventario asociado al consumo:

```text
costoConsumo = cantidadBaseConsumida * costoUnitario
```

Solo se calcula cuando el movimiento tiene costo unitario valido.

### Cobertura

Si existen consumos sin costo:

```text
coberturaCostoPct = cantidadKgConCosto / cantidadKgTotal * 100
```

La UI muestra:

- Costo conocido parcial.
- Cantidad con costo.
- Cantidad sin costo.
- Porcentaje de cobertura.
- Etiqueta `Costo parcial`, nunca un total aparentemente completo.

Un costo faltante no se trata como cero.

## Filtros

| Filtro | Regla |
|--------|-------|
| `granjaId` | Obligatorio y accesible |
| `fechaDesde`, `fechaHasta` | Obligatorios para consumo/movimientos; no aplican a existencia actual |
| `loteId` | Opcional |
| `alimentoId` | Opcional |
| `almacenId` | Opcional |
| `tipoMovimientoId` | Opcional en movimientos |
| `page`, `limit` | Para detalle paginado |

El periodo no puede superar 366 dias en una consulta MVP para proteger rendimiento.

## Reportes

### Consumo por lote

- Lote.
- Alimento.
- Cantidad total en kg.
- Almacen origen.
- Periodo.
- Costo conocido y cobertura.

### Consumo por alimento

- Alimento.
- Cantidad total en kg.
- Cantidad de lotes.
- Costo conocido y cobertura.

### Existencias

- Granja.
- Almacen.
- Alimento.
- Existencia actual.
- Unidad base.
- Costo de referencia, claramente diferenciado del costo historico.

### Movimientos de inventario

- Fecha, tipo, alimento y almacen.
- Cantidad y unidad.
- Costo unitario/total cuando exista.
- Proveedor, referencia, responsable y estado.

### Resumen de movimientos

- Entradas.
- Salidas manuales.
- Salidas por consumo.
- Ajustes positivos y negativos.
- Totales separados por unidad compatible.

## Reglas

1. Toda consulta filtra por compania y granjas permitidas.
2. La granja es obligatoria en MVP; no se consolidan granjas sin seleccion explicita.
3. Registros anulados se excluyen siempre de indicadores y totales.
4. Historiales pueden incluir anulados solo en el detalle auditable, nunca en agregados.
5. Maestras inactivas conservan su nombre historico.
6. Los filtros por lote, alimento y almacen validan pertenencia al tenant/granja.
7. Rango invalido o excesivo se rechaza.
8. Sin datos se devuelve estructura vacia con totales en cero, no error.
9. Costos parciales se etiquetan con cobertura.
10. Todos los calculos se realizan en backend; la UI solo presenta.

## Permiso

- `reportes.alimentacion.ver`

## API

Rutas sin prefijo global `/api`:

| Metodo | Ruta |
|--------|------|
| `GET` | `/reportes/alimentacion/consumo-lotes` |
| `GET` | `/reportes/alimentacion/consumo-alimentos` |
| `GET` | `/reportes/alimentacion/existencias` |
| `GET` | `/reportes/alimentacion/movimientos` |
| `GET` | `/reportes/alimentacion/resumen` |

Todas reciben los filtros que correspondan al reporte. Las respuestas separan:

```text
data: detalle o agrupaciones
summary: totales, unidad, costoConocido, cantidadConCosto,
         cantidadSinCosto, coberturaCostoPct
meta: periodo, filtros, fechaConsulta, paginacion cuando aplique
```

## UX

Hub `/reportes/alimentacion` con una tarjeta por reporte. Cada reporte vive en su pantalla,
sin apilar varios reportes extensos:

- `/reportes/alimentacion/consumo-lotes`
- `/reportes/alimentacion/consumo-alimentos`
- `/reportes/alimentacion/existencias`
- `/reportes/alimentacion/movimientos`
- `/reportes/alimentacion/resumen`

Patron:

- Granja activa y periodo visibles.
- Filtros colapsables.
- Totales en tarjetas.
- Detalle mobile-first.
- Estado loading, empty y error inline.
- Etiquetas `Costo completo`, `Costo parcial` o `Sin costo`.
- Sin graficos ni botones de exportacion en MVP.

## Errores

Usar `REPORTE_*` de `docs/09-catalogo-errores.md`: rango, periodo maximo, granja, filtros de
otro tenant y unidades incompatibles.

## Criterios de aceptacion

### CA-001: Consumo por lote

Dado consumos validos en un periodo, cuando se consulta, entonces se agrupan por lote y
alimento en kg.

### CA-002: Consumo por alimento

Dado consumo de varios lotes, cuando se agrupa por alimento, entonces se muestran cantidad,
lotes y costo conocido.

### CA-003: Existencias

Dado inventario valido, cuando se consulta una granja, entonces se muestra existencia por
almacen/alimento en unidad base.

### CA-004: Movimientos

Dado un periodo, cuando se consulta detalle, entonces se muestran movimientos paginados con
costos disponibles y auditoria.

### CA-005: Excluir anulados

Dado consumo o movimiento anulado, cuando se calculan totales, entonces no participa.

### CA-006: Mostrar costo parcial

Dado un conjunto con costos faltantes, cuando se consulta, entonces se informa costo
conocido, cantidades con/sin costo y cobertura; faltantes no valen cero.

### CA-007: Normalizar unidades

Dadas presentaciones convertibles, cuando se agregan consumos, entonces se convierten a kg
sin sumar unidades incompatibles.

### CA-008: Respetar tenant

Dado un filtro de otra compania o granja no permitida, cuando se consulta, entonces se
rechaza o no se exponen datos.

### CA-009: Sin datos

Dado un periodo sin registros, cuando se consulta, entonces se devuelve `data: []`,
resumen cero y metadatos de filtros.

### CA-010: Validar periodo

Dado un rango invertido o mayor a 366 dias, cuando se consulta, entonces se rechaza con
codigo de reporte.

## Verificacion

- Pruebas de agregacion, conversion y exclusiones.
- Pruebas de cobertura de costo completa/parcial/nula.
- Pruebas multi-tenant.
- Prueba de rendimiento con periodo maximo y paginacion.
- Prueba manual mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v1.

Futuro:

- Animales y etapas.
- Costeo promedio/FIFO.
- Graficos, exportacion y comparativas.
- Alertas y predicciones.

## Decisiones MVP v1

- Solo lotes.
- Fecha productiva para periodos.
- Cantidades normalizadas a kg.
- Costo desde movimiento asociado.
- Costo parcial con cobertura.
- Tablas y totales, sin graficos/exportacion.
