# Decision 0001: Modelo de Seguridad Multi-compania

## Estado

Aceptada

## Contexto

El sistema debe soportar companias que administran una o varias granjas. Los usuarios deben trabajar dentro de una compania y solo sobre las granjas que tengan asignadas. Ademas, el sistema necesita perfiles para controlar que acciones puede realizar cada usuario.

## Decision

El sistema usara un modelo de autorizacion basado en tres capas:

1. Usuario pertenece a una sola compania.
2. Usuario tiene acceso a una o varias granjas de su compania.
3. Usuario tiene uno o varios perfiles globales con permisos del sistema.

Los perfiles seran globales, no propios de una compania. Esto permite mantener un catalogo unico de roles funcionales como administrador, encargado, operador o consulta.

## Consecuencias

- Toda informacion productiva debe estar asociada a una granja.
- Toda granja debe pertenecer a una compania.
- Toda consulta o modificacion productiva debe validar compania, granja y permiso.
- Un usuario no podra ver ni modificar informacion de companias distintas.
- Un usuario no podra operar sobre granjas no asignadas, aunque tenga permisos funcionales.
- Los perfiles podran reutilizarse entre companias.

## Ejemplo

Un usuario de la compania `Agropecuaria San Miguel` con acceso a `Granja Norte` y perfil `Operador` puede registrar animales en `Granja Norte` si el perfil contiene el permiso `animales.crear`.

Ese mismo usuario no puede registrar animales en `Granja Sur` si no tiene acceso a esa granja, aunque tenga el permiso `animales.crear`.
