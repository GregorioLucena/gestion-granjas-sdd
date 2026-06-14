# Spec 014: Reportes de Reproduccion

## Estado

Borrador inicial

## Objetivo

Permitir consultar indicadores y reportes reproductivos a partir de montas, gestaciones, partos y destetes registrados, facilitando la evaluacion productiva de hembras, granjas y periodos.

Esta especificacion convierte los eventos reproductivos en informacion util para la toma de decisiones.

## Dependencias

Esta especificacion depende de:

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `002-gestion-animales.md`
- `008-montas.md`
- `009-gestacion.md`
- `010-partos.md`
- `011-destete.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance

Incluye:

- Reporte de servicios reproductivos por periodo.
- Reporte de gestaciones confirmadas.
- Reporte de partos por periodo.
- Reporte de nacidos vivos, nacidos muertos y total nacido.
- Reporte de crias destetadas.
- Reporte de mortalidad durante lactancia.
- Promedio de nacidos vivos por parto.
- Promedio de destetados por parto.
- Tasa basica de confirmacion de gestacion.
- Tasa basica de fallos reproductivos.
- Consulta de historial reproductivo consolidado por hembra.
- Filtros por compania, granja, tipo de animal, hembra y periodo.

No incluye en esta version:

- Graficos avanzados.
- Predicciones reproductivas.
- Comparativas economicas.
- Exportaciones avanzadas.
- Indicadores personalizados por usuario.
- Analisis genetico.

## Conceptos principales

### Indicador reproductivo

Medida calculada a partir de eventos reproductivos registrados.

### Historial reproductivo consolidado

Vista que agrupa servicios, gestaciones, partos y destetes de una hembra.

### Tasa de confirmacion

Relacion entre servicios reproductivos registrados y gestaciones confirmadas.

### Tasa de fallo reproductivo

Relacion entre servicios o gestaciones que terminaron como fallidos, no gestantes, abortos u otros fallos.

### Productividad al destete

Resultado basado en la cantidad de crias destetadas por parto o por hembra.

## Datos de entrada

Los reportes se alimentan de:

- Servicios reproductivos.
- Confirmaciones de gestacion.
- Fallos reproductivos.
- Partos.
- Destetes.
- Animales reproductores.
- Compania y granja.

## Filtros requeridos

- Compania.
- Granja opcional.
- Periodo desde.
- Periodo hasta.
- Tipo de animal opcional.
- Hembra opcional.
- Estado opcional del evento.

## Reportes iniciales

### Reporte de servicios reproductivos

Debe mostrar:

- Cantidad de servicios.
- Servicios por tipo: monta natural, inseminacion u otro.
- Servicios por hembra.
- Servicios por responsable.
- Servicios anulados excluidos por defecto.

### Reporte de gestacion

Debe mostrar:

- Gestaciones confirmadas.
- Confirmaciones negativas.
- Resultados dudosos o pendientes.
- Fallos reproductivos por causa.
- Tasa basica de confirmacion.

### Reporte de partos

Debe mostrar:

- Cantidad de partos.
- Nacidos vivos.
- Nacidos muertos.
- Total nacido.
- Crias debiles.
- Promedio de nacidos vivos por parto.
- Promedio total nacido por parto.

### Reporte de destete

Debe mostrar:

- Cantidad de destetes.
- Crias destetadas.
- Mortalidad durante lactancia.
- Promedio de destetados por parto.
- Peso promedio al destete cuando exista.

### Historial reproductivo por hembra

Debe mostrar:

- Servicios reproductivos.
- Gestaciones.
- Partos.
- Destetes.
- Fallos reproductivos.
- Promedios por hembra.

## Reglas de negocio

- Todo reporte debe respetar la compania del usuario.
- Todo reporte debe respetar las granjas a las que el usuario tiene acceso.
- Los registros anulados deben excluirse por defecto.
- El usuario puede incluir anulados solo si tiene permiso especifico futuro.
- Los calculos deben usar datos historicos, aunque maestras o animales hayan quedado inactivos.
- Los reportes deben indicar claramente el periodo consultado.
- Las tasas deben evitar division por cero y mostrar resultado vacio o cero segun definicion de presentacion.
- Los promedios deben calcularse solo con registros validos y no anulados.
- El historial de una hembra debe mostrar eventos en orden cronologico.

## Permisos requeridos

- `reportes.reproduccion.ver`: consultar reportes reproductivos.

## Criterios de aceptacion

### CA-001: Consultar reporte de servicios

Dado un usuario con permiso y acceso a una granja, cuando consulta servicios reproductivos por periodo, entonces el sistema muestra la cantidad de servicios agrupados por tipo, hembra y responsable.

### CA-002: Consultar reporte de gestacion

Dado un periodo con servicios y confirmaciones, cuando el usuario consulta el reporte de gestacion, entonces el sistema muestra gestantes, no gestantes, dudosos, fallos y tasa basica de confirmacion.

### CA-003: Consultar reporte de partos

Dado un periodo con partos registrados, cuando el usuario consulta el reporte de partos, entonces el sistema muestra partos, nacidos vivos, nacidos muertos, total nacido y promedios.

### CA-004: Consultar reporte de destete

Dado un periodo con destetes registrados, cuando el usuario consulta el reporte de destete, entonces el sistema muestra destetados, mortalidad de lactancia, peso promedio y promedio de destetados por parto.

### CA-005: Consultar historial reproductivo de hembra

Dado una hembra con eventos reproductivos, cuando el usuario consulta su historial consolidado, entonces el sistema muestra servicios, gestaciones, partos, destetes y fallos en orden cronologico.

### CA-006: Respetar acceso por granja

Dado un usuario sin acceso a una granja, cuando consulta reportes reproductivos, entonces el sistema no debe incluir datos de esa granja.

### CA-007: Excluir registros anulados

Dado que existen eventos reproductivos anulados, cuando el usuario consulta reportes, entonces esos eventos no se incluyen por defecto en los calculos.

## Preguntas abiertas

- Los reportes del MVP se mostraran solo en pantalla o tambien se exportaran?
- Se requiere comparar periodos, por ejemplo mes actual contra mes anterior?
- Las tasas reproductivas se calcularan de forma simple o con formulas configurables por especie?
- Los reportes mostraran graficos desde el MVP o solo tablas/resumenes?
- Se permitira guardar filtros favoritos por usuario?

## Decisiones tomadas

- Los reportes reproductivos se basan en eventos historicos no anulados.
- Los reportes deben respetar seguridad multi-compania y acceso por granja.
- El historial reproductivo consolidado se organizara por hembra.
- Los indicadores avanzados pueden agregarse despues de validar el MVP.
