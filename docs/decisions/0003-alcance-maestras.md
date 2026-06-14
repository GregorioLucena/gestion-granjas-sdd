# Decision 0003: Alcance de Maestras

## Estado

Aceptada

## Contexto

El sistema necesita muchas maestras reutilizables para operar animales, lotes, sanidad, reproduccion, alimentacion e inventario. Si todas las maestras se tratan igual, el modelo puede volverse rigido o dificil de administrar en un entorno multi-compania y multi-granja.

## Decision

Las maestras tendran alcance definido:

1. Global del sistema: datos tecnicos o comunes a todas las companias.
2. Por compania: datos productivos, sanitarios, reproductivos, alimentarios e inventario configurables por cada compania.
3. Por granja: datos fisicos o logisticos propios de una granja.

El catalogo consolidado de maestras se mantiene en `docs/03-catalogo-maestras.md`.

## Consecuencias

- Perfiles, permisos, sexos base, estados tecnicos y unidades comunes pueden ser globales.
- Enfermedades, vacunas, medicamentos, alimentos, proveedores y finalidades pueden configurarse por compania.
- Ubicaciones internas y almacenes pueden configurarse por granja.
- Los eventos y movimientos no deben tratarse como maestras.
- Cada ABM de maestras debe respetar su alcance.

## Ejemplo

La vacuna `Parvovirus` puede existir como maestra sanitaria de una compania. La vacunacion aplicada a la cerda `CER-001` en una fecha especifica no es maestra; es un evento sanitario.
