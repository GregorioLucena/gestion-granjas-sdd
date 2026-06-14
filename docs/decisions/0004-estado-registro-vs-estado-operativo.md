# Decision 0004: Estado de Registro vs Estado Operativo

## Estado

Aceptada

## Contexto

El sistema necesita controlar si un registro administrado por ABM esta disponible para nuevas operaciones. Tambien necesita estados propios del negocio, como animal vendido, lote cerrado o tratamiento en curso.

Si ambos conceptos se mezclan en una sola maestra de estados, el modelo puede volverse confuso y dificil de validar.

## Decision

Se separan dos conceptos:

1. Estado de registro: estado tecnico transversal para ABM.
2. Estado operativo: estado propio del ciclo de vida de una entidad de negocio.

El estado de registro tendra valores iniciales:

- Activo.
- Inactivo.

Los estados operativos se definen por modulo.

Ejemplos:

- Animal: activo, vendido, muerto, descartado.
- Lote: activo, cerrado, cancelado.
- Caso sanitario: activo, en tratamiento, recuperado, cronico, fallecido, cerrado.

## Consecuencias

- Toda maestra y entidad administrada por ABM debe tener estado de registro.
- Un registro inactivo no debe estar disponible para nuevas operaciones.
- El estado de registro no reemplaza los estados propios del negocio.
- Las validaciones deben distinguir disponibilidad tecnica de ciclo de vida operativo.

## Ejemplo

Una vacuna puede tener estado de registro `Inactivo`, lo que impide usarla en nuevas vacunaciones. Una vacunacion ya aplicada no cambia por eso; sigue siendo un evento historico.
