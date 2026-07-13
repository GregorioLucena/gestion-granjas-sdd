# Spec 014: Reportes de Reproduccion

## Estado

Lista para implementar MVP v2 (2026-07-13)

## Objetivo

Consultar actividad e indicadores del ciclo reproductivo sin contar multiples servicios de
un mismo celo como intentos independientes.

## Dependencias

- `008-montas.md`
- `009-gestacion.md`
- `010-partos.md`
- `011-destete.md`
- `docs/decisions/0010-ciclo-reproductivo.md`

## Alcance

- Servicios por periodo.
- Cohortes de ciclos reproductivos.
- Confirmaciones y fallos.
- Gestaciones activas.
- Partos y nacimientos.
- Bajas de lactancia y destetes.
- Indicadores basicos.
- Historial por hembra.

No incluye comparacion de periodos, formulas configurables, graficos, exportacion, filtros
favoritos, genetica o economia.

## Periodos

- Reportes de actividad filtran por fecha del evento.
- Tasas filtran cohortes cuyo primer servicio cae entre `fechaDesde` y `fechaHasta`.
- Periodo maximo: 366 dias.
- Granja obligatoria.

## Indicadores

### Confirmacion de gestacion

```text
ciclosConfirmados = resultado POSITIVA o parto no confirmado
ciclosNoGestantes = resultado NEGATIVA
elegiblesConfirmacion = confirmados + noGestantes
tasaConfirmacionPct = confirmados / elegiblesConfirmacion * 100
```

Dudosos y pendientes se muestran aparte y no entran al denominador.

### Fallo reproductivo

Resultados finales de cohorte:

- `PARTO`
- `PARTO_SIN_VIVOS`
- `NO_GESTANTE`
- `ABORTO`
- `REABSORCION`
- `OTRO_FALLO`
- `PENDIENTE`

```text
fallos = PARTO_SIN_VIVOS + NO_GESTANTE + ABORTO + REABSORCION + OTRO_FALLO
resultadosFinales = PARTO + fallos
tasaFalloPct = fallos / resultadosFinales * 100
```

### Nacimientos

```text
promedioVivosPorParto = SUM(nacidosVivos) / partos
promedioTotalPorParto = SUM(totalNacidos) / partos
```

### Lactancia

```text
mortalidadLactanciaPct = SUM(bajasLactancia) / SUM(nacidosVivos) * 100
promedioDestetados = SUM(cantidadDestetada) / destetes
```

Todo denominador cero devuelve `null` con `No disponible`.

## Reportes

### Servicios

Servicios por tipo, hembra y responsable, distinguiendo cantidad de servicios y cantidad de
ciclos.

### Cohorte reproductiva

Por ciclo: hembra, primer/ultimo servicio, cantidad de servicios, confirmacion, gestacion,
resultado final y dias transcurridos.

### Gestaciones

Activas, fechas probables, confirmaciones negativas/dudosas y fallos por causa.

### Partos

Partos, vivos, muertos, debiles, totales y promedios.

### Lactancia y destete

Bajas por causa, mortalidad, destetados y pesos disponibles.

### Historial por hembra

Linea cronologica de ciclos, servicios, confirmaciones, gestaciones, partos, bajas y
destetes.

## Reglas

1. Toda consulta filtra por tenant y granjas permitidas.
2. Registros anulados se excluyen siempre de indicadores.
3. Un ciclo cuenta una vez aunque tenga varios servicios.
4. Cohortes pendientes no se mezclan con resultados finales.
5. Parto no confirmado cuenta como gestacion comprobada para tasa.
6. Un parto con vivos fija resultado reproductivo `PARTO` aunque el ciclo siga
   operativamente `EN_LACTANCIA`; no queda pendiente. Sin vivos fija `PARTO_SIN_VIVOS`.
7. Datos faltantes no se sustituyen por cero.
8. Backend calcula tasas, promedios y estados.
9. Metadatos declaran formulas, cohorte, periodo y fecha de consulta.
10. Sin datos devuelve listas vacias e indicadores `null`.

## Permiso

- `reportes.reproduccion.ver`

## API

| Metodo | Ruta |
|--------|------|
| `GET` | `/reportes/reproduccion/servicios` |
| `GET` | `/reportes/reproduccion/cohortes` |
| `GET` | `/reportes/reproduccion/gestaciones` |
| `GET` | `/reportes/reproduccion/partos` |
| `GET` | `/reportes/reproduccion/lactancia-destete` |
| `GET` | `/reportes/reproduccion/hembras/:id` |

Filtros: granja, periodo, tipo de animal, hembra, tipo/estado y paginacion. Respuesta separa
`data`, `summary` y `meta`.

## UX

Hub `/reportes/reproduccion`, una pantalla por reporte:

- Granja y periodo visibles.
- Diferenciar `Servicios` de `Intentos/ciclos`.
- Pendientes destacados sin contarlos como fallos.
- Indicadores no disponibles explicados.
- Tablas/resumenes mobile-first.
- Sin graficos ni exportacion.

## Criterios de aceptacion

1. Dos servicios del mismo ciclo cuentan como un intento.
2. Cohorte se selecciona por primer servicio.
3. Pendientes/dudosos se excluyen de denominadores.
4. Parto no confirmado cuenta positivo.
5. Fallo usa resultados terminales definidos.
6. Partos/destetes calculan promedios sin anulados.
7. Denominador cero devuelve null.
8. Historial se ordena cronologicamente.
9. Tenant, granja y periodo se validan.

## Verificacion

- Cohortes con uno/multiples servicios.
- Positivo, negativo, dudoso, aborto y parto no confirmado.
- Anulaciones y denominadores cero.
- Multi-tenant y mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v2.

## Decisiones

- Tasas por cohorte de primer servicio.
- Pendientes separados.
- Sin dato es null, no 0%.
- Sin graficos/exportacion.
