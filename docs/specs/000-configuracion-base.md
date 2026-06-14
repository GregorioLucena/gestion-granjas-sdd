# Spec 000: Configuracion Base y Maestras

## Estado

Borrador inicial

## Objetivo

Permitir configurar la estructura base del sistema antes de registrar informacion productiva. Esta especificacion define companias, granjas y maestras necesarias para que los modulos de animales, lotes, sanidad, reproduccion, alimentacion e inventario trabajen de forma ordenada.

El catalogo consolidado de maestras se documenta en `docs/03-catalogo-maestras.md`.

## Alcance

Incluye:

- Registro de companias.
- Registro de granjas asociadas a una compania.
- Registro de tipos de animales.
- Registro de razas asociadas a tipos de animales.
- Registro de finalidades productivas.
- Registro de tipos de ubicacion.
- Registro de ubicaciones internas por granja.
- Registro progresivo de maestras productivas, sanitarias, reproductivas, alimentarias e inventario segun cada modulo.
- Activacion e inactivacion de maestras.
- Uso de estado de registro `Activo/Inactivo` para entidades administradas por ABM.

No incluye en esta version:

- Registro de animales.
- Registro de lotes.
- Movimientos de inventario.
- Eventos reproductivos.
- Consumo de alimento.
- Usuarios, roles y permisos.

## Conceptos principales

### Maestra

Catalogo configurable usado para estandarizar datos reutilizables. Una maestra define opciones; no representa un evento ocurrido.

Ejemplos:

- Tipo de animal.
- Raza.
- Enfermedad.
- Vacuna.
- Tipo de alimento.
- Tipo de movimiento de inventario.

### Estado de registro

Estado tecnico usado para indicar si un registro administrable por ABM esta disponible para nuevas operaciones.

Valores iniciales:

- Activo.
- Inactivo.

Este estado es distinto a los estados operativos del negocio, como `Vendido`, `Muerto`, `Cerrado`, `En tratamiento` o `Recuperado`.

### Compania

Representa una organizacion que administra una o varias granjas.

Ejemplos:

- Productora La Esperanza.
- Agropecuaria San Miguel.
- Granja Familiar Perez.

### Granja

Representa una unidad productiva perteneciente a una compania. Toda informacion productiva debe estar asociada a una granja.

Ejemplos:

- Granja Norte.
- Unidad Porcina 01.
- Finca Principal.

### Tipo de animal

Representa la especie o categoria productiva general. Puede definir si la raza es requerida para los animales de ese tipo y la duracion esperada de gestacion cuando aplique.

Ejemplos:

- Cerdo.
- Bovino.
- Caprino.
- Ave.
- Conejo.

### Raza

Clasificacion asociada a un tipo de animal.

Ejemplos:

- Yorkshire para cerdo.
- Duroc para cerdo.
- Holstein para bovino.

### Finalidad productiva

Define el proposito de un animal o lote.

Ejemplos:

- Reproduccion.
- Engorde.
- Cria.
- Leche.
- Postura.
- Venta.

### Tipo de ubicacion

Clasifica las ubicaciones internas de una granja.

Ejemplos:

- Galpon.
- Corral.
- Jaula.
- Sala.
- Potrero.

### Ubicacion

Lugar interno de una granja donde se ubican animales, lotes, alimentos o actividades.

Ejemplos:

- Galpon A.
- Corral 01.
- Sala de gestacion.
- Corral de engorde 03.

## Clasificacion de maestras

Las maestras se clasifican por alcance:

- Global del sistema: compartida por todas las companias.
- Por compania: configurable dentro de una compania.
- Por granja: especifica de una granja.

Para el MVP:

- Las maestras tecnicas y de seguridad seran globales.
- Las maestras productivas, sanitarias, reproductivas y de inventario seran principalmente por compania.
- Las ubicaciones y almacenes seran por granja.

El detalle completo se mantiene en `docs/03-catalogo-maestras.md`.

## Datos requeridos

### Compania

- Nombre.
- Identificacion fiscal opcional.
- Telefono opcional.
- Correo opcional.
- Direccion opcional.
- Estado activo/inactivo.

### Granja

- Compania.
- Nombre.
- Codigo opcional.
- Direccion opcional.
- Estado activo/inactivo.

### Tipo de animal

- Nombre.
- Descripcion opcional.
- Indicador de si requiere raza.
- Duracion esperada de gestacion en dias opcional.
- Estado activo/inactivo.

### Raza

- Tipo de animal.
- Nombre.
- Descripcion opcional.
- Estado activo/inactivo.

### Finalidad productiva

- Nombre.
- Descripcion opcional.
- Estado activo/inactivo.

### Tipo de ubicacion

- Nombre.
- Descripcion opcional.
- Estado activo/inactivo.

### Ubicacion

- Granja.
- Tipo de ubicacion.
- Nombre.
- Codigo opcional.
- Descripcion opcional.
- Estado activo/inactivo.

## Reglas de negocio

- Toda granja debe pertenecer a una compania.
- Una compania puede tener una o varias granjas.
- El nombre de una compania no debe duplicarse dentro del sistema.
- El nombre de una granja no debe duplicarse dentro de la misma compania.
- Toda ubicacion debe pertenecer a una granja.
- Toda ubicacion debe tener un tipo de ubicacion.
- El nombre de una ubicacion no debe duplicarse dentro de la misma granja.
- Una raza siempre debe pertenecer a un tipo de animal.
- El nombre de una raza no debe duplicarse dentro del mismo tipo de animal.
- Un tipo de animal puede indicar que la raza es obligatoria para sus animales.
- Los registros inactivos no deben estar disponibles para nuevas operaciones productivas.
- Toda maestra debe tener estado de registro.
- Los valores iniciales del estado de registro son `Activo` e `Inactivo`.
- El estado de registro controla disponibilidad del registro, no describe el ciclo de vida operativo del negocio.
- Las maestras deben gestionarse mediante pantallas ABM.

## Criterios de aceptacion

### CA-001: Registrar compania

Dado un usuario con permisos, cuando registra una compania con nombre valido, entonces la compania queda disponible para asociarle granjas.

### CA-002: Evitar companias duplicadas

Dado que existe una compania con nombre `Productora La Esperanza`, cuando el usuario intenta registrar otra compania con el mismo nombre, entonces el sistema debe rechazarla.

### CA-003: Registrar granja

Dado que existe una compania activa, cuando el usuario registra una granja con nombre valido, entonces la granja queda asociada a esa compania.

### CA-004: Evitar granjas duplicadas por compania

Dado que una compania ya tiene una granja llamada `Granja Norte`, cuando el usuario intenta registrar otra granja con el mismo nombre dentro de la misma compania, entonces el sistema debe rechazarla.

### CA-005: Registrar tipo de animal con regla de raza

Dado un usuario con permisos, cuando registra un tipo de animal indicando si requiere raza, entonces esa regla queda disponible para validar futuros animales.

### CA-006: Registrar raza

Dado que existe un tipo de animal activo, cuando el usuario registra una raza con nombre valido, entonces la raza queda asociada a ese tipo de animal.

### CA-007: Registrar tipo de ubicacion

Dado un usuario con permisos, cuando registra un tipo de ubicacion con nombre valido, entonces queda disponible para clasificar ubicaciones internas.

### CA-008: Registrar ubicacion

Dado que existe una granja activa y un tipo de ubicacion activo, cuando el usuario registra una ubicacion con nombre valido, entonces la ubicacion queda asociada a esa granja.

### CA-009: Inactivar maestra

Dado un registro maestro activo, cuando el usuario lo inactiva, entonces el registro deja de estar disponible para nuevas operaciones pero conserva su historial.

## Preguntas abiertas

- La identificacion fiscal de compania sera obligatoria en algun pais o quedara opcional?
- Las ubicaciones internas tendran jerarquia, por ejemplo galpon > sala > corral?
- La granja necesitara coordenadas geograficas desde el MVP?

## Decisiones tomadas

- El sistema debe ser multi-compania.
- Una compania puede manejar varias granjas.
- La identificacion de animales sera manual en el MVP, pero el modelo debe permitir automatizacion futura.
- Las ubicaciones internas se gestionaran con tipo de ubicacion y ubicacion.
- La raza sera requerida u opcional segun la configuracion del tipo de animal.
- Las entidades base deben gestionarse desde ABM.
- Las maestras del proyecto se consolidan en `docs/03-catalogo-maestras.md`.
- Las maestras productivas, sanitarias, reproductivas y de inventario seran principalmente por compania, con valores iniciales sugeridos por el sistema cuando aplique.
- Todas las entidades administradas por ABM usaran estado de registro `Activo/Inactivo`.
