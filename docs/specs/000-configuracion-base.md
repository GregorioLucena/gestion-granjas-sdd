# Spec 000: Configuracion Base y Maestras

## Estado

Implementado MVP v1 (2026-06-14)

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
- **Edicion** de companias, granjas y maestras de esta spec (campos administrables definidos en `Datos requeridos`).
- Registro progresivo de maestras productivas, sanitarias, reproductivas, alimentarias e inventario segun cada modulo.
- Activacion e inactivacion de maestras.
- Uso de estado de registro `Activo/Inactivo` para entidades administradas por ABM.

No incluye en esta version:

- Registro de animales.
- Registro de lotes.
- Movimientos de inventario.
- Eventos reproductivos.
- Consumo de alimento.
- **Almacenes o depositos** (por granja; ver `005-inventario-alimentos.md`).
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

**Convencion de nombres:** usar la categoria productiva o especie (ej. `Porcino`, `Bovino`, `Cunicula`), no el nombre coloquial del animal individual (ej. no usar `Cerdo` como tipo; `cerdo` es el individuo dentro de `Porcino`).

Ejemplos:

- Porcino.
- Bovino.
- Caprino.
- Aviar.
- Cunicula.

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
- Los registros **activos e inactivos** pueden editarse para corregir datos administrativos (nombre, descripcion, codigo y campos equivalentes), salvo restricciones explicitas de esta spec.
- Al editar, aplican las mismas reglas de unicidad que al crear (nombre de compania, granja por compania, raza por tipo de animal, ubicacion por granja, etc.).
- Reactivar un registro inactivo se realiza editando `estadoRegistro` a `Activo` (no se elimina fisicamente).
- Toda maestra debe tener estado de registro.
- Los valores iniciales del estado de registro son `Activo` e `Inactivo`.
- El estado de registro controla disponibilidad del registro, no describe el ciclo de vida operativo del negocio.
- Las maestras deben gestionarse mediante pantallas ABM.

## Experiencia de usuario (UX)

Referencia transversal: `docs/11-guia-ux-ui.md`.

### Navegacion de configuracion

- La configuracion base se organiza en **catalogos**, no en una sola pantalla larga.
- Flujo minimo:
  1. Hub `Configuracion`
  2. Hub `Catalogos maestros` (cuando aplique)
  3. **Una pantalla por catalogo** (tipos de animal, razas, ubicaciones, etc.)
- Companias y granjas tienen pantalla propia independiente.

### Patron ABM por catalogo

Cada pantalla de maestra u organizacion debe incluir:

- Encabezado con titulo, descripcion y volver atras.
- Resumen visual (activos / total).
- Accion principal clara para crear (`Agregar...` / `Nueva...`).
- Accion **Editar** por registro en el listado (icono o boton secundario); abre formulario colapsable o modal con datos precargados.
- Formulario colapsable o modal para crear y editar; no mezclar varios ABM en la misma vista.
- En edicion, botones `Guardar cambios` y `Cancelar`; al cancelar no persiste nada.
- Busqueda por nombre.
- Filtro rapido: `Todos`, `Activos`, `Inactivos` (por defecto `Activos`).
- Listado en tarjetas movil; badges de estado legibles.
- Confirmacion antes de inactivar (accion reversible a nivel historico, no destructiva fisica).
- Estados `loading`, `empty`, `error` y feedback interactivo visible.
- **Feedback interactivo con toast** para exito, error de validacion y reglas de negocio (ej. `MAESTRA_EN_USO`); ver `docs/11-guia-ux-ui.md` (seccion Feedback y toasts).

### Campos obligatorios en formularios

- Los campos definidos como requeridos en `Datos requeridos` de esta spec deben marcarse en la UI con asterisco (`*`) en el label.
- Al abrir un formulario de alta o edicion, mostrar la leyenda: `Los campos marcados con * son obligatorios`.
- Si el usuario intenta guardar con un obligatorio vacio, el sistema debe:
  - resaltar el campo con borde de error;
  - mostrar debajo del campo el mensaje `Este campo es obligatorio.`;
  - no enviar la peticion al backend hasta corregir.
- Los campos opcionales no llevan asterisco; no usar el sufijo `(opcional)` en el label.

Campos obligatorios por entidad en MVP v1:

| Entidad | Obligatorios en formulario |
|---------|----------------------------|
| Compania | Nombre |
| Granja | Compania (contexto), nombre |
| Tipo de animal | Nombre |
| Raza | Tipo de animal (contexto), nombre |
| Finalidad / tipo de ubicacion | Nombre |
| Ubicacion | Granja (contexto), tipo de ubicacion (solo alta), nombre |

**Almacenes:** no forman parte de esta spec; se administran en inventario (`005-inventario-alimentos.md`) cuando corresponda al modulo de alimentos.

### Copy visible

- Usar espanol claro: `Inactivar`, `Editar`, `Guardar cambios`, `Sin resultados`, `Registro guardado correctamente`, `Cambios guardados correctamente`.
- Evitar terminos tecnicos (`tenant`, `payload`, `constraint`).

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

### CA-010: Navegar catalogos por pantalla

Dado un usuario en configuracion, cuando accede a catalogos maestros, entonces el sistema muestra un hub de catalogos y **cada catalogo abre en su propia pantalla**, sin mezclar multiples ABM en una sola vista.

### CA-011: Buscar en listados de configuracion

Dado un listado de maestras u organizacion con mas de un registro, cuando el usuario escribe en la busqueda, entonces el listado se filtra por nombre en tiempo real.

### CA-012: Filtrar por estado de registro

Dado un listado de configuracion, cuando el usuario selecciona `Activos`, `Inactivos` o `Todos`, entonces el listado muestra solo los registros correspondientes.

### CA-013: Confirmar inactivacion

Dado un registro activo, cuando el usuario elige inactivarlo, entonces el sistema solicita confirmacion antes de aplicar el cambio y muestra un **toast de exito** al finalizar.

### CA-014: Paginar listados de configuracion

Dado un listado de configuracion con mas registros que el tamano de pagina, cuando el usuario consulta el listado, entonces el sistema devuelve resultados paginados con metadatos (`page`, `limit`, `total`, `totalPages`) y la interfaz permite avanzar y retroceder paginas.

### CA-015: Bloquear inactivacion de maestras en uso

Dado un registro maestro activo referenciado por otra entidad activa (por ejemplo, un tipo de animal con razas activas, un tipo de ubicacion con ubicaciones activas, o una finalidad usada por lotes activos), cuando el usuario intenta inactivarlo, entonces el sistema rechaza la operacion con el error `MAESTRA_EN_USO` y muestra un **toast de error** con el mensaje devuelto por la API.

### CA-016: Toast para feedback de acciones ABM

Dado una accion ABM en configuracion (crear, **editar**, inactivar u otra mutacion), cuando la accion termina en exito o error recuperable, entonces el sistema muestra un toast visible en pantalla (no solo texto estatico embebido), con mensaje en espanol claro y posibilidad de cerrarlo manualmente.

### CA-017: Editar maestra u organizacion

Dado un registro existente de compania, granja o maestra de esta spec, cuando el usuario elige **Editar** y guarda cambios validos en los campos permitidos, entonces el sistema actualiza el registro y muestra un toast de exito; el listado refleja los nuevos datos.

### CA-018: Rechazar edicion con nombre duplicado

Dado un registro existente, cuando el usuario edita el nombre (u otro campo con regla de unicidad) y el nuevo valor ya existe en el mismo ambito (compania, granja, tipo de animal, etc.), entonces el sistema rechaza la operacion y muestra un toast de error con mensaje claro.

### CA-019: Editar campos especificos por catalogo

Dado un registro en edicion, cuando el usuario modifica campos administrables, entonces el sistema permite solo los definidos para ese catalogo:

- **Compania / granja / finalidad / tipo de ubicacion:** nombre y campos opcionales segun entidad (`identificacionFiscal`, `telefono`, `correo`, `direccion` en compania; `codigo`, `direccion` en granja; `descripcion` en finalidad y tipo de ubicacion), y reactivacion (`Activo`) si estaba inactivo.
- **Compania (formulario):** ademas del nombre, la UI permite capturar y editar `identificacionFiscal`, `telefono`, `correo` y `direccion` (todos opcionales); el correo se valida en formato email si se informa.
- **Granja (formulario):** ademas del nombre, la UI permite capturar y editar `codigo` y `direccion` (opcionales).
- **Tipo de animal:** nombre, descripcion, `requiereRaza`, `duracionGestacionDias`.
- **Raza:** nombre y descripcion (no cambia `tipoAnimalId` en MVP v1).
- **Ubicacion:** nombre, codigo, descripcion (no cambia `granjaId` ni `tipoUbicacionId` en MVP v1).

### CA-020: Indicar y validar campos obligatorios

Dado un formulario ABM de configuracion base, cuando se muestran campos requeridos segun `Datos requeridos`, entonces cada obligatorio lleva asterisco (`*`) en el label y leyenda inicial; si el usuario guarda con alguno vacio, entonces el sistema resalta el campo, muestra `Este campo es obligatorio.` debajo del input y no envia la peticion hasta corregirlo.

## Cierre de implementacion MVP v1

**Fecha de cierre:** 2026-06-14  
**Rama de trabajo:** `feature/configuracion-base`

### Entregables implementados

| Capa | Alcance |
|------|---------|
| API (`apps/api`) | CRUD organizacion (`/companias`, `/granjas`) y maestras (`/tipos-animal`, `/razas`, `/finalidades-productivas`, `/tipos-ubicacion`, `/ubicaciones`); paginacion, busqueda, filtro por estado; reglas `MAESTRA_EN_USO` |
| Web (`apps/web`) | Hub configuracion, ABM por pantalla, edicion, toasts, confirmacion de inactivacion, campos obligatorios con `*`, listados en tarjetas |
| Datos | Migracion inicial, seed demo (compania, granja, 7 tipos animal con razas, tipos/ubicaciones demo, permisos admin) |
| Shared | Schemas Zod, permisos, paginacion (`LIST_PAGE_SIZE = 5`) |

### Pantallas web

- `/configuracion` — hub
- `/configuracion/companias`, `/configuracion/granjas`
- `/configuracion/maestras` — hub catalogos
- `/configuracion/maestras/tipos-animal`, `razas`, `finalidades`, `tipos-ubicacion`, `ubicaciones`

### Verificacion de criterios de aceptacion

| ID | Estado | Notas |
|----|--------|-------|
| CA-001 a CA-009 | OK | Alta, edicion e inactivacion por entidad |
| CA-010 | OK | Hub + pantalla por catalogo |
| CA-011 a CA-014 | OK | Busqueda, filtro, confirmacion, paginacion |
| CA-015 | OK | `MAESTRA_EN_USO` con toast |
| CA-016 | OK | Toasts en mutaciones ABM |
| CA-017 a CA-019 | OK | Edicion con campos por catalogo |
| CA-020 | OK | Asterisco, leyenda y validacion inline |

### Verificacion tecnica

- [x] `pnpm run typecheck`
- [x] `pnpm run build:packages`
- [x] Prueba manual funcional (usuario)

### Dependencias temporales (no bloquean cierre de spec)

- **Almacenes:** fuera de alcance; implementar con spec `005-inventario-alimentos.md`.
- **Autenticacion:** login JWT en spec `001-usuarios-perfiles.md` (reemplaza el bypass `X-Dev-User-Email` usado durante spec `000`).

### Mejoras opcionales pospuestas

- Tarjeta resumen con desglose **activos / total** (hoy muestra total del filtro aplicado).
- Coordenadas geograficas de granja (pregunta abierta; no requerido en v1).

## Preguntas abiertas

Resueltas para MVP v1 (ver tambien `docs/06-cierre-sdd.md`):

- Identificacion fiscal de compania: **opcional** en v1.
- Jerarquia de ubicaciones: **no** en v1; ubicaciones planas por granja.
- Coordenadas geograficas de granja: **opcional / no requerido** en v1.

Pendientes para fases posteriores:

- Identificacion fiscal obligatoria por pais (evaluar al expandir mercados).
- Jerarquia galpon > sala > corral (v2+).
- Coordenadas geograficas obligatorias o integracion mapa.

## Decisiones tomadas

- El sistema debe ser multi-compania.
- Una compania puede manejar varias granjas.
- La identificacion de animales sera manual en el MVP, pero el modelo debe permitir automatizacion futura.
- Las ubicaciones internas se gestionaran con tipo de ubicacion y ubicacion.
- La raza sera requerida u opcional segun la configuracion del tipo de animal.
- Las entidades base deben gestionarse desde ABM completo: **alta, edicion e inactivacion** (sin borrado fisico en maestras).
- Las maestras del proyecto se consolidan en `docs/03-catalogo-maestras.md`.
- Las maestras productivas, sanitarias, reproductivas y de inventario seran principalmente por compania, con valores iniciales sugeridos por el sistema cuando aplique.
- Todas las entidades administradas por ABM usaran estado de registro `Activo/Inactivo`.
