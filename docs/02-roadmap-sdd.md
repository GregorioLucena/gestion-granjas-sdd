# Roadmap SDD

Este roadmap define el orden recomendado para especificar e implementar el sistema.

## Documentos transversales

- `03-catalogo-maestras.md`: inventario consolidado de maestras globales, por compania y por granja.
- `decisions/0005-auditoria-y-trazabilidad.md`: regla transversal de auditoria, anulacion y no borrado fisico.

## Fase 1: Base del dominio

Objetivo: crear las entidades centrales sobre las que dependeran los demas modulos.

- `000-configuracion-base.md`: companias, granjas y administracion de maestras base. **Implementado MVP v1 (2026-06-14).**
- `001-usuarios-perfiles.md`: usuarios, perfiles, permisos y acceso por granja. **Implementado MVP v1 (2026-06-14).**
- `002-gestion-animales.md`: ficha, parentesco y ciclo de vida de animales individuales.
  **Lista para implementar MVP v2 (2026-07-13).**
- `003-gestion-lotes.md`: lotes productivos, cantidades, fechas y estados. **Implementado MVP v1 (2026-06-17).**
- `004-sanidad-animal.md`: veterinario tratante, eventos, casos, tratamientos y retiro.
  **Lista para implementar MVP v2 (2026-07-13).**

## Fase 2: Alimentacion e inventario

Objetivo: controlar alimentos disponibles.

- `005-inventario-alimentos.md`: tipos de alimento, entradas, costos y existencias. **Implementado MVP v1 (2026-06-17).**

## Fase 3: Trazabilidad interna

Objetivo: controlar movimientos internos antes de registrar consumos y reportes.

- `006-movimientos-ubicacion.md`: historial de movimientos internos de lotes.
  **Lista para implementar MVP v1 opcional (2026-07-13).**

## Fase 4: Consumo y alimentacion

Objetivo MVP v1: controlar consumo por lote con descuento de inventario.

- `007-consumo-alimento.md`: consumo diario por animal o lote. **Implementado MVP v1 (2026-06-17)** — alcance v1: solo por lote.

## Fase 5: Reproduccion

Objetivo: controlar el ciclo reproductivo de animales individuales.

- `008-montas.md`: ciclos con uno o varios servicios. **Lista para implementar MVP v2
  (2026-07-13).**
- `009-gestacion.md`: confirmaciones, controles y fallos. **Lista para implementar MVP v2
  (2026-07-13).**
- `010-partos.md`: partos, conteos y crias opcionales. **Lista para implementar MVP v2
  (2026-07-13).**
- `011-destete.md`: bajas de lactancia y destete total. **Lista para implementar MVP v2
  (2026-07-13).**

## Fase 6: Engorde

Objetivo: controlar rendimiento productivo de lotes.

- `012-engorde-lotes.md`: inicio manual, bajas, cantidad actual derivada, cierre y
  reapertura trazable. **Lista para implementar MVP v1 (2026-07-13).**
- `013-controles-peso.md`: controles inicial, intermedio y final de lotes con engorde.
  **Lista para implementar MVP v1 (2026-07-13).**

Orden de implementacion obligatorio: `012` antes de `013`. El proceso de engorde aporta el
contexto, la cantidad actual y los eventos de inicio/cierre que generan controles de peso.

## Fase 7: Reportes

Objetivo: convertir los registros en informacion util para decisiones.

- `014-reportes-reproduccion.md`: cohortes, partos, lactancia y tasas. **Lista para
  implementar MVP v2 (2026-07-13).**
- `015-reportes-alimentacion.md`: consumo, existencias y cobertura de costos. **Lista para
  implementar MVP v1 (2026-07-13).**
- `016-reportes-sanidad.md`: casos, vacunas, tratamientos y retiros. **Lista para implementar
  MVP v2 (2026-07-13).**
- `017-reportes-engorde.md`: ganancia, conversion y mortalidad. **Lista para implementar MVP
  v1 (2026-07-13).**

## Fase 8: Asistente de recomendaciones (post MVP v1)

Objetivo: alertas accionables y memoria de decisiones sobre datos productivos reales, sin
abrir MVP v2 (reproduccion/sanidad).

- `018-asistente-recomendaciones.md`: desvio de consumo, stock de reposicion, feedback y
  umbrales por granja. **Especificado — pendiente de implementacion (2026-08-16).**

## Regla de avance

Una especificacion puede pasar de borrador a lista para implementar cuando tenga:

- Objetivo claro.
- Alcance y fuera de alcance.
- Datos requeridos.
- Reglas de negocio.
- Criterios de aceptacion.
- Preguntas abiertas resueltas o marcadas para despues.

Para el MVP v1, `006-movimientos-ubicacion.md` es opcional y no bloquea engorde, pesos ni
reportes.

Orden recomendado pendiente MVP v1: `012` -> `013` -> `015` -> `017`; `006` puede
implementarse en paralelo o despues.

Orden obligatorio MVP v2: `002` -> `004` y `008` -> `009` -> `010` -> `011`; luego `014` y
`016`.
