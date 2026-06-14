# Spec 015: Reportes de Alimentacion

## Estado

Borrador inicial

## Objetivo

Permitir consultar indicadores y reportes de alimentacion e inventario, consolidando consumos, costos, existencias y movimientos de alimentos por compania, granja, almacen, animal, lote y periodo.

Esta especificacion convierte los registros de inventario y consumo en informacion util para control productivo y costos.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `005-inventario-alimentos.md`
- `007-consumo-alimento.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Reporte de consumo por animal.
- Reporte de consumo por lote.
- Reporte de consumo por alimento.
- Reporte de consumo por etapa productiva.
- Reporte de consumo por granja y periodo.
- Reporte de existencias por almacen.
- Reporte de movimientos de inventario.
- Reporte de costos de consumo cuando exista costo registrado.
- Resumen de entradas, salidas y ajustes.
- Filtros por compania, granja, almacen, alimento, animal, lote y periodo.

No incluye en esta version:

- Conversion alimenticia avanzada.
- Costeo contable completo.
- Graficos avanzados.
- Predicciones de consumo.
- Alertas automaticas de stock minimo.
- Exportaciones avanzadas.
- Comparativas financieras entre companias.

## Conceptos principales

### Reporte de consumo

Vista que muestra alimento consumido por animal, lote, granja, alimento o periodo.

### Reporte de existencia

Vista que muestra cantidad disponible por alimento, almacen y granja.

### Costo de consumo

Valor estimado del alimento consumido, calculado desde el costo unitario del movimiento de inventario o desde una regla de costo definida.

### Movimiento de inventario reportable

Entrada, salida, consumo, ajuste o devolucion que afecta la existencia de alimento y puede incluir costo.

## Datos de entrada

Los reportes se alimentan de:

- Alimentos.
- Almacenes.
- Movimientos de inventario.
- Consumos de alimento.
- Animales.
- Lotes.
- Etapas productivas.
- Compania y granja.

## Filtros requeridos

- Compania.
- Granja opcional.
- Periodo desde.
- Periodo hasta.
- Almacen opcional.
- Alimento opcional.
- Animal opcional.
- Lote opcional.
- Etapa productiva opcional.

## Reportes iniciales

### Reporte de consumo por lote

Debe mostrar:

- Lote.
- Alimento.
- Cantidad consumida.
- Unidad.
- Periodo.
- Almacen origen.
- Costo estimado cuando exista.

### Reporte de consumo por animal

Debe mostrar:

- Animal.
- Alimento.
- Cantidad consumida.
- Unidad.
- Etapa productiva.
- Periodo.
- Costo estimado cuando exista.

### Reporte de consumo por alimento

Debe mostrar:

- Alimento.
- Cantidad total consumida.
- Granjas donde se consumio.
- Animales o lotes asociados.
- Costo total estimado cuando exista.

### Reporte de existencias

Debe mostrar:

- Granja.
- Almacen.
- Alimento.
- Existencia actual.
- Unidad de medida.
- Ultimo costo o costo de referencia cuando exista.

### Reporte de movimientos de inventario

Debe mostrar:

- Fecha.
- Tipo de movimiento.
- Alimento.
- Almacen.
- Cantidad.
- Costo unitario.
- Costo total.
- Referencia.
- Responsable.

### Resumen de costos de alimentacion

Debe mostrar:

- Costo total por periodo.
- Costo por alimento.
- Costo por lote.
- Costo por animal cuando aplique.
- Costo por etapa productiva cuando aplique.

## Reglas de negocio

- Todo reporte debe respetar la compania del usuario.
- Todo reporte debe respetar las granjas a las que el usuario tiene acceso.
- Los consumos anulados deben excluirse por defecto.
- Los movimientos de inventario anulados deben excluirse por defecto.
- Los calculos deben usar datos historicos aunque alimentos, almacenes, animales o lotes esten inactivos.
- Las existencias deben calcularse desde movimientos validos no anulados.
- Los costos deben mostrarse solo cuando exista informacion suficiente.
- Si no existe costo, el reporte debe mostrar cantidad sin costo estimado.
- Los reportes deben indicar claramente periodo, filtros y fecha de consulta.
- Las cantidades deben respetar la unidad de medida del registro o una unidad base definida.

## Permisos requeridos

- `reportes.alimentacion.ver`: consultar reportes de alimentacion e inventario.

## Criterios de aceptacion

### CA-001: Consultar consumo por lote

Dado un lote con consumos registrados, cuando el usuario consulta consumo por lote en un periodo, entonces el sistema muestra alimentos, cantidades, unidades, almacenes y costo estimado cuando exista.

### CA-002: Consultar consumo por animal

Dado un animal con consumos registrados, cuando el usuario consulta consumo por animal en un periodo, entonces el sistema muestra alimentos, cantidades, unidades, etapa productiva y costo estimado cuando exista.

### CA-003: Consultar consumo por alimento

Dado un alimento con consumos registrados, cuando el usuario consulta consumo por alimento, entonces el sistema muestra cantidad total consumida, granjas, animales o lotes asociados y costo total cuando exista.

### CA-004: Consultar existencias

Dado movimientos de inventario validos, cuando el usuario consulta existencias, entonces el sistema muestra cantidad disponible por granja, almacen y alimento.

### CA-005: Consultar movimientos de inventario

Dado movimientos de inventario registrados, cuando el usuario consulta movimientos por periodo, entonces el sistema muestra fecha, tipo, alimento, cantidad, costo, referencia y responsable.

### CA-006: Consultar resumen de costos

Dado consumos con costo disponible, cuando el usuario consulta resumen de costos, entonces el sistema muestra costo total por periodo, alimento, lote, animal o etapa productiva segun filtros.

### CA-007: Respetar acceso por granja

Dado un usuario sin acceso a una granja, cuando consulta reportes de alimentacion, entonces el sistema no debe incluir datos de esa granja.

### CA-008: Excluir anulados

Dado consumos o movimientos anulados, cuando el usuario consulta reportes, entonces esos registros no deben incluirse por defecto en cantidades ni costos.

## Preguntas abiertas

- El costo del consumo se calculara con ultimo costo, costo promedio o costo del movimiento asociado?
- Los reportes permitiran convertir unidades, por ejemplo sacos a kg?
- Se mostraran graficos desde el MVP o solo tablas y totales?
- Se permitira exportar a Excel o PDF en el MVP?
- Se definiran costos por etapa productiva desde el MVP?

## Decisiones tomadas

- Los reportes de alimentacion usaran consumos y movimientos historicos no anulados.
- Los reportes deben respetar seguridad multi-compania y acceso por granja.
- Los costos se mostraran solo cuando existan datos suficientes.
- Las existencias se calcularan desde movimientos de inventario validos.
