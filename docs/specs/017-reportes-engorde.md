# Spec 017: Reportes de Engorde

## Estado

Borrador inicial

## Objetivo

Permitir consultar indicadores y reportes de engorde a partir de lotes, procesos de engorde, consumos de alimento, controles de peso y bajas, facilitando la evaluacion productiva de lotes por granja y periodo.

Esta especificacion consolida informacion operativa para medir productividad, crecimiento, consumo y resultado de lotes.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `007-consumo-alimento.md`
- `012-engorde-lotes.md`
- `013-controles-peso.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Reporte de lotes en engorde.
- Reporte de lotes cerrados.
- Reporte de ganancia de peso.
- Reporte de consumo acumulado por lote.
- Reporte de bajas y mortalidad.
- Reporte de conversion alimenticia basica cuando existan datos suficientes.
- Reporte de duracion de engorde.
- Resumen productivo por lote.
- Filtros por compania, granja, lote, tipo de animal, estado y periodo.

No incluye en esta version:

- Costeo financiero completo.
- Comparativas comerciales de venta.
- Facturacion.
- Prediccion de fecha optima de salida.
- Graficos avanzados.
- Analisis estadistico avanzado.

## Conceptos principales

### Reporte de engorde

Vista que consolida indicadores productivos de uno o varios lotes en engorde.

### Duracion de engorde

Cantidad de dias entre fecha de inicio y fecha de cierre del engorde.

### Ganancia de peso promedio

Diferencia entre peso final promedio y peso inicial promedio.

### Consumo acumulado

Suma de alimento consumido por un lote durante un periodo o durante todo el proceso de engorde.

### Conversion alimenticia basica

Relacion entre alimento consumido y ganancia de peso. Solo puede calcularse cuando existen datos suficientes de consumo y peso.

### Mortalidad de engorde

Relacion entre bajas por muerte y cantidad inicial o disponible del lote.

## Datos de entrada

Los reportes se alimentan de:

- Lotes.
- Procesos de engorde.
- Bajas de engorde.
- Consumos de alimento por lote.
- Controles de peso por lote.
- Compania y granja.

## Filtros requeridos

- Compania.
- Granja opcional.
- Periodo desde.
- Periodo hasta.
- Lote opcional.
- Tipo de animal opcional.
- Estado del lote opcional.
- Estado del engorde opcional.

## Reportes iniciales

### Reporte de lotes en engorde

Debe mostrar:

- Lote.
- Granja.
- Fecha de inicio.
- Cantidad inicial.
- Cantidad actual estimada.
- Peso inicial promedio cuando exista.
- Ultimo peso promedio registrado.
- Dias en engorde.

### Reporte de lotes cerrados

Debe mostrar:

- Lote.
- Fecha de inicio.
- Fecha de cierre.
- Duracion de engorde.
- Cantidad inicial.
- Cantidad final.
- Peso inicial promedio.
- Peso final promedio.
- Motivo de cierre.

### Reporte de ganancia de peso

Debe mostrar:

- Lote.
- Peso inicial promedio.
- Peso final o ultimo peso promedio.
- Ganancia de peso promedio.
- Ganancia diaria promedio cuando existan fechas y pesos suficientes.

### Reporte de consumo acumulado

Debe mostrar:

- Lote.
- Alimento.
- Cantidad consumida.
- Unidad.
- Periodo.
- Costo estimado cuando exista.

### Reporte de bajas y mortalidad

Debe mostrar:

- Lote.
- Cantidad de bajas.
- Causa de baja.
- Fecha.
- Mortalidad estimada.

### Reporte de conversion alimenticia basica

Debe mostrar:

- Lote.
- Consumo total de alimento.
- Ganancia de peso estimada.
- Conversion alimenticia basica.
- Advertencia cuando falten datos suficientes.

### Resumen productivo por lote

Debe mostrar:

- Datos del lote.
- Fechas de engorde.
- Cantidades.
- Pesos.
- Consumos.
- Bajas.
- Conversion alimenticia basica cuando aplique.
- Resultado final.

## Reglas de negocio

- Todo reporte debe respetar la compania del usuario.
- Todo reporte debe respetar las granjas a las que el usuario tiene acceso.
- Los registros anulados deben excluirse por defecto.
- Los lotes cerrados deben mantenerse disponibles para reportes historicos.
- Los calculos deben usar datos historicos aunque alimentos, lotes o maestras hayan quedado inactivos.
- La conversion alimenticia solo debe calcularse si existe consumo acumulado y ganancia de peso valida.
- Si faltan datos de peso o consumo, el reporte debe mostrar el indicador como no disponible.
- La mortalidad debe calcularse solo con bajas clasificadas como muerte o equivalentes cuando esa causa exista.
- Los reportes deben indicar claramente periodo, filtros y fecha de consulta.

## Permisos requeridos

- `reportes.engorde.ver`: consultar reportes de engorde.

## Criterios de aceptacion

### CA-001: Consultar lotes en engorde

Dado lotes con engorde activo, cuando el usuario consulta el reporte, entonces el sistema muestra lotes, fechas, cantidades, pesos y dias en engorde.

### CA-002: Consultar lotes cerrados

Dado lotes con engorde cerrado, cuando el usuario consulta el reporte, entonces el sistema muestra fecha de inicio, cierre, duracion, cantidades, pesos y motivo de cierre.

### CA-003: Consultar ganancia de peso

Dado un lote con peso inicial y peso final o ultimo peso, cuando el usuario consulta ganancia de peso, entonces el sistema muestra ganancia promedio y ganancia diaria si aplica.

### CA-004: Consultar consumo acumulado

Dado un lote con consumos registrados, cuando el usuario consulta consumo acumulado, entonces el sistema muestra alimento, cantidad, unidad, periodo y costo estimado cuando exista.

### CA-005: Consultar bajas y mortalidad

Dado un lote con bajas registradas, cuando el usuario consulta bajas, entonces el sistema muestra cantidad, causa, fecha y mortalidad estimada.

### CA-006: Consultar conversion alimenticia basica

Dado un lote con consumo acumulado y ganancia de peso valida, cuando el usuario consulta conversion alimenticia, entonces el sistema muestra la relacion entre consumo y ganancia de peso.

### CA-007: Manejar datos insuficientes

Dado un lote sin consumo o sin pesos suficientes, cuando el usuario consulta conversion alimenticia, entonces el sistema muestra el indicador como no disponible.

### CA-008: Respetar acceso por granja

Dado un usuario sin acceso a una granja, cuando consulta reportes de engorde, entonces el sistema no debe incluir datos de esa granja.

### CA-009: Excluir anulados

Dado registros de engorde, consumo o peso anulados, cuando el usuario consulta reportes, entonces esos registros no deben incluirse por defecto.

## Preguntas abiertas

- La conversion alimenticia se calculara con peso promedio o peso total estimado del lote?
- Se requiere indicador de ganancia diaria promedio desde el MVP?
- Los costos de alimentacion se mostraran en este reporte o solo en `015-reportes-alimentacion.md`?
- Se permitiran comparativas entre lotes desde el MVP?
- Se exportaran reportes a Excel o PDF en la primera version?

## Decisiones tomadas

- Los reportes de engorde se basan en engordes, consumos, pesos y bajas no anulados.
- Los reportes deben respetar seguridad multi-compania y acceso por granja.
- La conversion alimenticia se mostrara solo cuando existan datos suficientes.
- Los reportes de engorde complementan, pero no reemplazan, los reportes de alimentacion.
