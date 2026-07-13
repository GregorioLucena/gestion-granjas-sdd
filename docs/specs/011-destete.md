# Spec 011: Lactancia y Destete

## Estado

Lista para implementar MVP v2 (2026-07-13)

## Objetivo

Registrar bajas durante lactancia y cerrar el ciclo con un destete que reconcilie todas las
crias nacidas vivas.

## Dependencias

- `002-gestion-animales.md`
- `010-partos.md`
- `docs/decisions/0010-ciclo-reproductivo.md`

## Alcance

- Bajas de lactancia fechadas.
- Causa y cantidad.
- Vinculo opcional con crias individuales.
- Un destete total por parto.
- Cantidad y peso al destete.
- Estado de lactancia de crias.
- Anulacion.

No incluye adopciones, transferencias, destetes parciales, lote post-destete ni venta.

## Datos

### Baja de lactancia

- Parto.
- Fecha.
- Cantidad positiva.
- Causa por compania.
- Crias individuales afectadas opcionales.
- Responsable y observaciones.

### Destete

- Parto y hembra derivados.
- Fecha.
- Cantidad destetada derivada/validada.
- Peso promedio opcional o pesos individuales completos.
- Crias individuales destetadas.
- Responsable y observaciones.

### Estado de lactancia

`CriaParto.estadoLactancia`:

- `EN_LACTANCIA`
- `BAJA`
- `DESTETADA`

No sustituye el estado operativo de `Animal`.

## Reglas

1. Eventos pertenecen al tenant/granja del parto.
2. Parto debe estar vigente y tener nacidos vivos.
3. Fecha de baja esta entre parto y destete; fecha de destete no precede parto.
4. Cantidad disponible:

```text
criasDisponibles = nacidosVivos - SUM(bajasLactanciaVigentes)
```

5. Una baja no supera cantidad disponible.
6. Crias individuales seleccionadas pertenecen al parto, siguen `EN_LACTANCIA` y no superan
   cantidad de baja.
7. Para cada cria individual muerta se crea evento `MUERTE` de spec 002 en transaccion.
8. Solo existe un destete vigente por parto.
9. En esta version el destete es total:

```text
cantidadDestetada = criasDisponibles
cantidadDestetada + SUM(bajas) = nacidosVivos
```

10. Todas las crias individuales que siguen en lactancia pasan a `DESTETADA`.
11. Si se informan pesos individuales, deben cubrir todas las crias individualizadas
    destetadas y el promedio se deriva.
12. Sin pesos individuales completos se permite promedio positivo.
13. Peso no es obligatorio.
14. Destete cierra el ciclo reproductivo como `CERRADO_DESTETE`.
15. Baja y destete son inmutables.
16. Para anular una baja debe anularse antes el destete y cualquier evento dependiente.
17. Anular una baja revierte eventos de muerte generados solo si no tienen dependencias.
18. Anular destete devuelve crias y ciclo a `EN_LACTANCIA` en transaccion; no habilita
    nuevos servicios.

## Permisos

- `reproduccion.lactancia.ver`
- `reproduccion.lactancia.bajas_crear`
- `reproduccion.lactancia.bajas_anular`
- `reproduccion.destete.crear`
- `reproduccion.destete.anular`

## API

| Metodo | Ruta |
|--------|------|
| `GET` | `/reproduccion/partos/:id/lactancia` |
| `POST` | `/reproduccion/partos/:id/bajas-lactancia` |
| `POST` | `/reproduccion/bajas-lactancia/:id/anular` |
| `POST` | `/reproduccion/partos/:id/destete` |
| `POST` | `/reproduccion/destetes/:id/anular` |

## UX

- Resumen de vivos, bajas y disponibles.
- Linea de tiempo de lactancia.
- Baja con causa y seleccion opcional de crias.
- Destete muestra conciliacion obligatoria.
- Pesos individuales en seccion opcional.
- No ofrecer lote automatico.

## Criterios de aceptacion

1. Baja valida reduce disponibles.
2. Baja excesiva se rechaza.
3. Cria individual muerta actualiza lactancia y ciclo animal atomicamente.
4. Destete exige igualdad exacta y usa todos los disponibles.
5. Crias individualizadas vivas quedan destetadas.
6. Pesos completos derivan promedio.
7. Destete cierra ciclo.
8. Anulaciones respetan orden y recalculan.
9. Tenant y permisos se validan.

## Verificacion

- Cantidad puntual y multiples bajas.
- Reconciliacion exacta.
- Crias por conteo e individuales.
- Anulaciones/rollback.
- Multi-tenant y mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v2.

## Decisiones

- Bajas fechadas, no total editable en destete.
- Destete unico y total.
- Sin lote automatico.
- Peso opcional.
