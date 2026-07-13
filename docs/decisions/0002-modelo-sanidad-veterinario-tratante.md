# Decision 0002: Modelo de Sanidad y Veterinario Tratante

## Estado

Aceptada

## Contexto

El sistema necesita controlar vacunaciones, diagnosticos/casos, tratamientos y controles
sanitarios de animales individuales y lotes. Tambien debe representar al veterinario como
usuario y responsable sanitario.

## Decision

El veterinario se modelara de dos formas complementarias:

1. Como usuario con perfil global `Veterinario` o permisos sanitarios equivalentes.
2. Como veterinario tratante asignado a un animal o lote durante un periodo.

La sanidad sera un modulo separado de gestion de animales y gestion de lotes. Los animales y lotes podran mostrar resumen sanitario, pero el historial sanitario se administrara desde `004-sanidad-animal.md`.

## Consecuencias

- Ser veterinario como usuario controla acceso y permisos.
- Ser veterinario tratante controla responsabilidad sanitaria.
- Un animal puede tener un veterinario tratante actual.
- Un lote puede tener un veterinario tratante actual.
- Vacunaciones, diagnosticos, tratamientos y controles quedaran como eventos sanitarios; la
  enfermedad es maestra asociada al diagnostico.
- Todo evento sanitario debe pertenecer a una compania y granja.
- Todo evento sanitario debe aplicar a animal o lote.

## Ejemplo

Un usuario con perfil `Veterinario` puede tener acceso a `Granja Norte`. Dentro de esa granja puede ser asignado como veterinario tratante de la cerda `CER-001` y registrar una vacunacion o tratamiento si tiene los permisos sanitarios requeridos.
