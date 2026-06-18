# Roadmap SDD

Este roadmap define el orden recomendado para especificar e implementar el sistema.

## Documentos transversales

- `03-catalogo-maestras.md`: inventario consolidado de maestras globales, por compania y por granja.
- `decisions/0005-auditoria-y-trazabilidad.md`: regla transversal de auditoria, anulacion y no borrado fisico.

## Fase 1: Base del dominio

Objetivo: crear las entidades centrales sobre las que dependeran los demas modulos.

- `000-configuracion-base.md`: companias, granjas y administracion de maestras base. **Implementado MVP v1 (2026-06-14).**
- `001-usuarios-perfiles.md`: usuarios, perfiles, permisos y acceso por granja. **Implementado MVP v1 (2026-06-14).**
- `002-gestion-animales.md`: animales individuales asociados a compania, granja, especie, finalidad, raza y ubicacion.
- `003-gestion-lotes.md`: lotes productivos, cantidades, fechas y estados. **Implementado MVP v1 (2026-06-17).**
- `004-sanidad-animal.md`: veterinario tratante, vacunaciones, enfermedades, tratamientos y controles sanitarios.

## Fase 2: Alimentacion e inventario

Objetivo: controlar alimentos disponibles.

- `005-inventario-alimentos.md`: tipos de alimento, entradas, costos y existencias. **Implementado MVP v1 (2026-06-17).**

## Fase 3: Trazabilidad interna

Objetivo: controlar movimientos internos antes de registrar consumos y reportes.

- `006-movimientos-ubicacion.md`: historial de movimientos de ubicacion para animales y lotes.

## Fase 4: Consumo y alimentacion

Objetivo: controlar consumo por animal o lote.

- `007-consumo-alimento.md`: consumo diario por animal o lote.

## Fase 5: Reproduccion

Objetivo: controlar el ciclo reproductivo de animales individuales.

- `008-montas.md`: montas o inseminaciones.
- `009-gestacion.md`: seguimiento de gestacion y fecha probable de parto.
- `010-partos.md`: partos, crias nacidas, mortalidad y observaciones.
- `011-destete.md`: crias destetadas, fecha y peso.

## Fase 6: Engorde

Objetivo: controlar rendimiento productivo de lotes.

- `012-engorde-lotes.md`: inicio, cierre, cantidad inicial/final y resultados.
- `013-controles-peso.md`: pesajes por animal o lote.

## Fase 7: Reportes

Objetivo: convertir los registros en informacion util para decisiones.

- `014-reportes-reproduccion.md`: partos, crias, fallos reproductivos.
- `015-reportes-alimentacion.md`: consumo y costos.
- `016-reportes-sanidad.md`: vacunaciones, enfermedades, tratamientos y veterinarios tratantes.
- `017-reportes-engorde.md`: ganancia de peso, conversion y mortalidad.

## Regla de avance

Una especificacion puede pasar de borrador a lista para implementar cuando tenga:

- Objetivo claro.
- Alcance y fuera de alcance.
- Datos requeridos.
- Reglas de negocio.
- Criterios de aceptacion.
- Preguntas abiertas resueltas o marcadas para despues.
