# Spec 001: Usuarios, Perfiles y Seguridad

## Estado

Borrador inicial

## Objetivo

Permitir administrar usuarios, perfiles y permisos para controlar el acceso al sistema de forma segura. Esta especificacion define la base de seguridad para una plataforma multi-compania y multi-granja.

## Dependencias

Esta especificacion depende de `000-configuracion-base.md`.

## Alcance

Incluye:

- Registro de usuarios.
- Asignacion de usuarios a una compania.
- Asignacion de acceso a una o varias granjas.
- Registro de perfiles.
- Asignacion de permisos por perfil.
- Asignacion de perfiles a usuarios.
- Activacion, inactivacion y bloqueo de usuarios.
- Inicio y cierre de sesion.

No incluye en esta version:

- Autenticacion con proveedores externos.
- Recuperacion avanzada de contrasena por correo.
- Doble factor de autenticacion.
- Auditoria avanzada de acciones de usuario, mas alla de la auditoria transversal definida en `0005-auditoria-y-trazabilidad.md`.
- Politicas avanzadas por horario o direccion IP.

## Conceptos principales

### Usuario

Persona que puede acceder al sistema mediante credenciales. Un usuario pertenece a una sola compania y puede tener acceso a una o varias granjas de esa compania.

### Perfil

Grupo global de permisos asignable a usuarios. Permite controlar que acciones puede realizar un usuario dentro de las granjas a las que tiene acceso.

Ejemplos:

- Administrador de sistema.
- Administrador de compania.
- Encargado de granja.
- Veterinario.
- Operador.
- Consulta.

### Permiso

Accion especifica que el sistema permite o restringe.

Ejemplos:

- Crear animales.
- Editar animales.
- Consultar inventario.
- Registrar consumo de alimento.
- Registrar eventos sanitarios.
- Consultar historial sanitario.
- Registrar movimientos de ubicacion.
- Consultar inventario.
- Administrar usuarios.

### Acceso por granja

Relacion que define sobre que granjas puede trabajar un usuario dentro de su compania.

## Modelo de autorizacion

El acceso efectivo de un usuario se determina con tres capas:

1. Compania: define a que tenant pertenece el usuario.
2. Granjas permitidas: define sobre que granjas de su compania puede trabajar.
3. Perfiles globales: definen que acciones puede realizar en los modulos del sistema.

Un usuario puede realizar una accion solo si cumple las tres condiciones:

- Pertenece a la compania propietaria de la informacion.
- Tiene acceso a la granja donde se encuentra la informacion.
- Tiene al menos un perfil con el permiso requerido para la accion.

Ejemplo:

Un usuario de la compania `Agropecuaria San Miguel` con acceso a `Granja Norte` y perfil `Operador` puede registrar animales en `Granja Norte` si su perfil incluye `animales.crear`. No puede registrar animales en `Granja Sur` si no tiene acceso a esa granja, aunque tenga el permiso `animales.crear`.

## Datos requeridos

### Usuario

- Nombre.
- Apellido opcional.
- Correo o nombre de usuario.
- Contrasena.
- Compania.
- Granjas permitidas.
- Perfiles.
- Estado.

### Perfil

- Nombre.
- Descripcion opcional.
- Permisos asignados.
- Estado activo/inactivo.

### Permiso

- Codigo.
- Nombre.
- Modulo.
- Accion.
- Descripcion opcional.

## Reglas de negocio

- Todo usuario debe pertenecer a una compania.
- Un usuario no puede pertenecer a mas de una compania.
- Un usuario solo puede acceder a granjas de su compania.
- Un usuario puede tener acceso a una o varias granjas.
- Un usuario debe tener al menos un perfil activo.
- Un usuario puede tener uno o varios perfiles.
- Un perfil agrupa permisos.
- Los perfiles son globales del sistema, no pertenecen a una compania especifica.
- Los permisos son globales del sistema.
- Los permisos definen acciones sobre modulos del sistema.
- El correo o nombre de usuario debe ser unico dentro del sistema.
- Un usuario inactivo o bloqueado no puede iniciar sesion.
- Un usuario sin acceso a una granja no puede consultar ni modificar datos productivos de esa granja.
- Debe existir al menos un perfil administrador con permisos para gestionar companias, granjas, usuarios y maestras.
- Un administrador de compania solo puede gestionar usuarios de su propia compania.
- Un administrador de compania solo puede asignar a sus usuarios granjas pertenecientes a su compania.
- Las contrasenas no deben almacenarse en texto plano.

## Permisos iniciales sugeridos

- `companias.ver`
- `companias.crear`
- `companias.editar`
- `granjas.ver`
- `granjas.crear`
- `granjas.editar`
- `maestras.administrar`
- `usuarios.ver`
- `usuarios.crear`
- `usuarios.editar`
- `perfiles.administrar`
- `animales.ver`
- `animales.crear`
- `animales.editar`
- `animales.cambiar_estado`
- `lotes.ver`
- `lotes.crear`
- `lotes.editar`
- `lotes.cambiar_estado`
- `sanidad.ver`
- `sanidad.crear`
- `sanidad.editar`
- `sanidad.tratamientos.administrar`
- `sanidad.veterinario_asignar`
- `inventario.ver`
- `inventario.alimentos.crear`
- `inventario.alimentos.editar`
- `inventario.proveedores.administrar`
- `inventario.almacenes.administrar`
- `inventario.movimientos.crear`
- `inventario.ajustes.crear`
- `alimentacion.consumo.ver`
- `alimentacion.consumo.crear`
- `alimentacion.consumo.anular`
- `ubicaciones.movimientos.ver`
- `ubicaciones.movimientos.crear`
- `ubicaciones.movimientos.anular`
- `reproduccion.montas.ver`
- `reproduccion.montas.crear`
- `reproduccion.montas.editar`
- `reproduccion.montas.anular`
- `reproduccion.gestacion.ver`
- `reproduccion.gestacion.crear`
- `reproduccion.gestacion.editar`
- `reproduccion.gestacion.controlar`
- `reproduccion.gestacion.anular`
- `reproduccion.partos.ver`
- `reproduccion.partos.crear`
- `reproduccion.partos.editar`
- `reproduccion.partos.anular`
- `reproduccion.destete.ver`
- `reproduccion.destete.crear`
- `reproduccion.destete.editar`
- `reproduccion.destete.anular`
- `engorde.ver`
- `engorde.iniciar`
- `engorde.bajas.crear`
- `engorde.cerrar`
- `engorde.anular`
- `pesos.ver`
- `pesos.crear`
- `pesos.editar`
- `pesos.anular`
- `reportes.reproduccion.ver`
- `reportes.alimentacion.ver`
- `reportes.sanidad.ver`
- `reportes.engorde.ver`

## Criterios de aceptacion

### CA-001: Registrar usuario

Dado que existe una compania activa, cuando un administrador registra un usuario con datos validos, entonces el usuario queda asociado a esa compania.

### CA-002: Asignar granjas permitidas

Dado que una compania tiene una o varias granjas activas, cuando el administrador asigna granjas a un usuario, entonces el usuario solo puede operar sobre esas granjas.

### CA-003: Evitar usuario duplicado

Dado que existe un usuario con correo `admin@granja.com`, cuando se intenta registrar otro usuario con el mismo correo, entonces el sistema debe rechazarlo.

### CA-004: Crear perfil con permisos

Dado un administrador con permisos, cuando crea un perfil global y selecciona permisos, entonces el perfil queda disponible para asignarlo a usuarios.

### CA-005: Validar permisos de modulo

Dado un usuario sin permiso `animales.crear`, cuando intenta registrar un animal, entonces el sistema debe impedir la accion.

### CA-006: Validar acceso a granja

Dado un usuario con acceso a `Granja Norte`, cuando intenta consultar datos de `Granja Sur` sin tener acceso a ella, entonces el sistema debe impedir la consulta.

### CA-007: Bloquear usuario

Dado un usuario activo, cuando un administrador lo bloquea, entonces el usuario no puede iniciar sesion.

### CA-008: Inactivar perfil

Dado un perfil activo, cuando un administrador lo inactiva, entonces el perfil no puede asignarse a nuevos usuarios.

### CA-009: Usuario con multiples perfiles

Dado un usuario con mas de un perfil activo, cuando intenta ejecutar una accion, entonces el sistema debe permitirla si al menos uno de sus perfiles contiene el permiso requerido y el usuario tiene acceso a la granja correspondiente.

### CA-010: Impedir asignacion de granja externa

Dado un usuario de una compania, cuando un administrador intenta asignarle una granja de otra compania, entonces el sistema debe rechazar la asignacion.

## Preguntas abiertas

- En el MVP se usara correo como usuario obligatorio?
- La recuperacion de contrasena entrara en el MVP o quedara para una fase posterior?

## Decisiones tomadas

- El sistema tendra modulo de usuarios y perfiles.
- La seguridad debe considerar multi-compania y multi-granja.
- Un usuario pertenece a una sola compania.
- Los usuarios tendran acceso limitado a granjas especificas.
- Los perfiles seran globales del sistema.
- Un usuario podra tener uno o varios perfiles.
- El veterinario puede representarse como perfil global cuando necesite acceder al sistema.
- El veterinario tratante se gestionara desde la especificacion `004-sanidad-animal.md`.
- La autorizacion combinara compania, granjas permitidas y permisos del perfil.
- La administracion de usuarios y perfiles sera gestionada desde ABM.
- La auditoria transversal se define en `0005-auditoria-y-trazabilidad.md`.
