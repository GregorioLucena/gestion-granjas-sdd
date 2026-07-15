# Spec 017: Reportes de Engorde

## Estado

Implementado MVP v1 (2026-07-14)

## Objetivo

Consolidar procesos de engorde, bajas, consumos y pesos para consultar estado, crecimiento,
mortalidad y conversion alimenticia basica por lote.

## Dependencias

- `001-usuarios-perfiles.md`
- `003-gestion-lotes.md`
- `007-consumo-alimento.md`
- `012-engorde-lotes.md`
- `013-controles-peso.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`
- `docs/decisions/0009-ciclo-engorde-y-cantidad-lote.md`

## Alcance MVP v1

Incluye:

- Engordes en curso y cerrados.
- Duracion.
- Cantidades inicial, actual y final.
- Evolucion y ganancia promedio de peso.
- Consumo acumulado en kg.
- Bajas y mortalidad.
- Conversion alimenticia basica.
- Resumen productivo por lote.
- Filtros, totales y detalle.

No incluye:

- Costos financieros; pertenecen a `015`.
- Comparativas avanzadas entre lotes.
- Graficos o exportacion.
- Ganancia diaria promedio.
- Predicciones o recomendaciones.
- Ventas/facturacion.

## Fuente de datos

Solo registros no anulados:

- `EngordeLote`.
- `CierreEngorde`.
- `BajaEngorde`.
- `ControlPeso`.
- `ConsumoAlimento`.
- Lote, granja y maestras historicas.

Los cierres, bajas, pesos y consumos anulados nunca participan en indicadores.

## Indicadores

### Cantidad actual

```text
cantidadActual = cantidadInicial - SUM(bajas no anuladas)
```

### Duracion

```text
duracionDias = fechaCierreVigente - fechaInicio
```

Para engorde en curso se usa la fecha de consulta. Un proceso iniciado y cerrado el mismo
dia tiene duracion 0.

### Ganancia promedio

```text
gananciaPromedioKg = pesoFinalPromedioKg - pesoInicialPromedioKg
```

En procesos en curso puede mostrarse `ultimoPeso - pesoInicial` con etiqueta
`Ganancia hasta el ultimo control`.

### Ganancia total estimada

Para un engorde cerrado:

```text
gananciaTotalEstimadaKg = gananciaPromedioKg * cantidadFinal
```

Representa la ganancia de los animales que completaron el proceso. No estima el peso ganado
por animales dados de baja.

### Consumo acumulado

Suma en kg de consumos no anulados del lote con fecha entre inicio y cierre vigente; si esta
en curso, hasta la fecha de consulta.

### Conversion alimenticia basica

```text
conversionAlimenticia = consumoAcumuladoKg / gananciaTotalEstimadaKg
```

Solo se calcula para engordes cerrados cuando:

- Existen controles vigentes inicial y final.
- Peso final > peso inicial.
- Cantidad final > 0.
- Consumo acumulado > 0.

Si falta una condicion, se devuelve `null` con una lista `datosFaltantes`.

### Mortalidad

```text
bajasMortalidad = SUM(bajas cuyo motivo.cuentaComoMortalidad = true)
mortalidadPct = bajasMortalidad / cantidadInicial * 100
```

Otras bajas se muestran separadas y no cuentan como mortalidad.

## Filtros

| Filtro | Regla |
|--------|-------|
| `granjaId` | Obligatorio y accesible |
| `fechaDesde`, `fechaHasta` | Obligatorios para listados por periodo; maximo 366 dias |
| `loteId` | Opcional |
| `tipoAnimalId` | Opcional |
| `estadoEngorde` | Opcional |
| `page`, `limit` | Paginacion |

El periodo selecciona engordes cuyo intervalo se superpone con el rango consultado.

## Reportes

### Engordes en curso

- Lote, granja, inicio y dias.
- Cantidad inicial/actual.
- Peso inicial y ultimo control.
- Ganancia hasta ultimo control cuando exista.
- Consumo acumulado.
- Objetivo y avance informativo.

### Engordes cerrados

- Inicio, cierre y duracion.
- Cantidades inicial/final.
- Pesos inicial/final.
- Ganancia promedio y total estimada.
- Consumo, mortalidad y conversion.
- Motivo de cierre.

### Bajas y mortalidad

- Fecha, lote, cantidad y motivo.
- Indicador `Cuenta como mortalidad`.
- Total de mortalidad y otras salidas.
- Porcentaje sobre cantidad inicial.

### Resumen por lote

- Datos del lote y engorde.
- Linea cronologica de controles.
- Bajas.
- Consumos agregados por alimento.
- Cierre.
- Indicadores y datos faltantes.

## Reglas

1. Toda consulta filtra por compania y granjas permitidas.
2. La granja es obligatoria.
3. Filtros de entidades ajenas se rechazan.
4. Registros anulados se excluyen de todos los calculos.
5. Maestras inactivas se conservan en historiales.
6. No se sustituyen datos faltantes por cero.
7. Conversion y mortalidad se calculan exclusivamente en backend.
8. Resultados decimales se redondean a dos decimales para presentacion, conservando
   precision interna.
9. Sin datos se devuelve estructura vacia, no error.
10. Las formulas y advertencias se incluyen en metadatos para evitar interpretaciones
    ambiguas.

## Permiso

- `reportes.engorde.ver`

## API

Rutas sin prefijo `/api`:

| Metodo | Ruta |
|--------|------|
| `GET` | `/reportes/engorde/en-curso` |
| `GET` | `/reportes/engorde/cerrados` |
| `GET` | `/reportes/engorde/bajas` |
| `GET` | `/reportes/engorde/lotes/:loteId` |

Respuesta:

```text
data
summary
meta:
  periodo
  filtros
  fechaConsulta
  formulas
  paginacion?
```

El resumen por lote agrega `datosFaltantes`, por ejemplo:

- `PESO_INICIAL`
- `PESO_FINAL`
- `CANTIDAD_FINAL`
- `CONSUMO`
- `GANANCIA_POSITIVA`

## UX

Hub `/reportes/engorde` con pantallas separadas:

- `/reportes/engorde/en-curso`
- `/reportes/engorde/cerrados`
- `/reportes/engorde/bajas`
- `/reportes/engorde/lotes/[loteId]`

Cada pantalla muestra:

- Granja y periodo visibles.
- Filtros colapsables.
- Tarjetas de totales.
- Detalle mobile-first.
- Indicadores `No disponible` con explicación de datos faltantes.
- Estado loading, empty y error inline.
- Sin graficos ni exportacion en MVP.

## Errores

Usar `REPORTE_*` para rango, periodo, granja, filtros y datos no comparables. Datos
insuficientes para un indicador no son error HTTP.

## Criterios de aceptacion

### CA-001: Listar engordes en curso

Dado un periodo y granja, cuando se consulta, entonces se muestran procesos superpuestos
con cantidades, pesos y dias disponibles.

### CA-002: Listar cerrados

Dado un cierre vigente, cuando se consulta, entonces se muestran fechas, cantidades,
motivo e indicadores disponibles.

### CA-003: Calcular ganancia

Dados pesos inicial/final, cuando se consulta un cerrado, entonces ganancia promedio es la
diferencia y ganancia total estimada multiplica por cantidad final.

### CA-004: Calcular consumo

Dado consumo dentro del intervalo, cuando se consulta, entonces se suma en kg; consumos
anteriores, posteriores o anulados se excluyen.

### CA-005: Calcular mortalidad

Dadas bajas con distintos motivos, cuando se consulta, entonces solo las marcadas
`cuentaComoMortalidad` forman el porcentaje sobre cantidad inicial.

### CA-006: Calcular conversion

Dado consumo, pesos y cantidad final validos, cuando se consulta, entonces se aplica la
formula definida.

### CA-007: Manejar datos insuficientes

Dado un engorde sin datos necesarios, cuando se consulta, entonces el indicador es `null` y
`datosFaltantes` explica por que.

### CA-008: Excluir anulados

Dado cualquier evento anulado, cuando se reporta, entonces no participa.

### CA-009: Respetar tenant

Dado un usuario sin acceso, cuando consulta, entonces no se exponen datos.

### CA-010: Validar periodo

Dado un rango invertido o mayor a 366 dias, cuando se consulta, entonces se rechaza.

## Verificacion

- Pruebas unitarias de cada formula y condición de no disponibilidad.
- Pruebas de intervalos y anulaciones.
- Pruebas multi-tenant.
- Casos con mortalidad, otras bajas y cantidad final cero.
- Prueba manual mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v1.

Futuro:

- Ganancia diaria.
- Costos integrados.
- Comparativas, graficos, exportacion y predicciones.
- Ganancia de animales dados de baja cuando existan pesos de salida.

## Decisiones MVP v1

- FCR sobre ganancia promedio por cantidad final.
- Mortalidad sobre cantidad inicial.
- Registros anulados excluidos.
- Datos faltantes producen indicador no disponible.
- Tablas y totales, sin graficos/exportacion.
