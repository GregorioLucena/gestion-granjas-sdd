# Spec 001: Usuarios, Perfiles y Seguridad

## Estado

Implementado MVP v1 (2026-06-14)

## Objetivo

Permitir administrar usuarios, perfiles y permisos para controlar el acceso al sistema de forma segura. Esta especificacion define la base de seguridad para una plataforma multi-compania y multi-granja, incluyendo autenticacion con **correo electronico y contrasena**.

## Dependencias

- `000-configuracion-base.md` — companias y granjas deben existir antes de asignar usuarios.
- `decisions/0001-modelo-seguridad-multicompania.md` — modelo de tres capas.
- `decisions/0007-monorepo-backend-frontend.md` — autenticacion JWT en `apps/api` (no Auth.js en Next).

## Alcance

Incluye:

- **Autenticacion:** inicio y cierre de sesion con correo y contrasena.
- **Registro y edicion de usuarios** (ABM): nombre, correo, compania, granjas permitidas, perfiles, estado.
- **Restablecimiento de contrasena por administrador** (sin envio de correo en v1).
- **Registro y edicion de perfiles globales** (ABM): nombre, descripcion, permisos asignados, estado.
- Asignacion de usuarios a una compania.
- Asignacion de acceso a una o varias granjas de esa compania.
- Asignacion de uno o varios perfiles activos por usuario.
- Activacion, inactivacion y bloqueo de usuarios.
- Activacion e inactivacion de perfiles.
- **Selector de granja activa** en la UI cuando el usuario tiene mas de una granja.
- Validacion de permisos y acceso por granja en API (reemplazo del bypass de desarrollo `X-Dev-User-Email`).
- Catalogo de permisos del sistema (seed); asignacion a perfiles, no ABM de codigos de permiso.

No incluye en esta version:

- Autenticacion con proveedores externos (Google, Microsoft, etc.).
- Recuperacion de contrasena por correo electronico.
- Doble factor de autenticacion (2FA).
- ABM de la entidad **Permiso** (codigos fijos del sistema; solo lectura para armar perfiles).
- Auditoria avanzada de acciones de usuario, mas alla de la auditoria transversal (`0005-auditoria-y-trazabilidad.md`).
- Politicas avanzadas por horario o direccion IP.
- Autoregistro publico de usuarios.

## Conceptos principales

### Usuario

Persona que accede al sistema con **correo electronico** (identificador unico global) y contrasena. Pertenece a **una sola compania** y puede tener acceso a **una o varias granjas** de esa compania.

Estados (`EstadoUsuario`):

| Estado | Significado | Puede iniciar sesion |
|--------|-------------|----------------------|
| `ACTIVO` | Usuario habilitado | Si |
| `INACTIVO` | Baja administrativa / ya no opera | No |
| `BLOQUEADO` | Suspension de seguridad | No |

### Perfil

Grupo **global** de permisos asignable a usuarios. No pertenece a una compania; se reutiliza entre tenants.

Ejemplos seed sugeridos:

- Administrador Sistema — gestion cross-tenant de companias y configuracion global.
- Administrador Compania — gestion de usuarios, granjas y maestras dentro de su compania.
- Operador Granja — operaciones productivas MVP (lotes, inventario, consumo, etc.).
- Consulta — solo lectura segun permisos asignados.

Estado de registro: `Activo` / `Inactivo` (`estadoRegistro`). Solo los **perfiles activos** aportan permisos al usuario en login y en cada request.

### Permiso

Accion atomica del sistema identificada por codigo (ej. `lotes.crear`). Es **catalogo del sistema**: se cargan por seed/migracion; no se crean ni eliminan desde la UI.

### Acceso por granja

Relacion `UsuarioGranja` que define sobre que granjas puede operar el usuario dentro de su compania.

### Granja activa

Granja seleccionada en la sesion del usuario para filtrar pantallas operativas. Debe estar dentro de `granjaIds` permitidos. Ver reglas en seccion Autenticacion.

## Modelo de autorizacion

El acceso efectivo se determina con tres capas (ADR `0001`):

1. **Compania:** tenant del usuario (`Usuario.companiaId`).
2. **Granjas permitidas:** subconjunto de granjas de esa compania (`UsuarioGranja`).
3. **Permisos:** union de permisos de todos los **perfiles activos** asignados al usuario.

Un usuario puede realizar una accion solo si:

- Pertenece a la compania propietaria de la informacion.
- Tiene acceso a la granja donde aplica la operacion (o la granja activa cuando la pantalla lo exige).
- Tiene al menos un perfil activo cuyo conjunto de permisos incluye el codigo requerido.

### Alcance administrativo por rol funcional

| Perfil funcional | Ambito de gestion de usuarios | Ambito de companias/granjas |
|------------------|------------------------------|----------------------------|
| Administrador Sistema | Usuarios de cualquier compania (con permisos `usuarios.*`) | Puede crear/editar companias si tiene `companias.*` |
| Administrador Compania | Solo usuarios de **su** compania | Solo granjas de su compania |
| Otros perfiles | Sin ABM de usuarios salvo permiso explicito | Segun permisos asignados |

Un administrador de compania **no** puede asignar granjas de otra compania ni consultar usuarios de otra compania.

## Implementacion tecnica MVP v1

Referencia: `decisions/0007-monorepo-backend-frontend.md`, `docs/13-arquitectura-monorepo.md`.

### Autenticacion (NestJS + JWT)

| Aspecto | Decision MVP v1 |
|---------|-----------------|
| Identificador de login | **Correo electronico** (unico global, normalizado a minusculas sin espacios) |
| Contrasena | Hash **bcrypt** (cost factor **12**); nunca persistir ni devolver en respuestas API |
| Access token | JWT firmado, vida corta (**15 minutos**) |
| Refresh token | Token opaco almacenado en tabla `sessions` (hash en BD); entregado en **cookie HttpOnly + Secure + SameSite=Lax** |
| Revocacion | Logout elimina/invalida la sesion de refresh; access token expira solo |
| Mensaje login fallido | Generico: *Correo o contrasena incorrectos* (`AUTH_INVALID_CREDENTIALS`) — no revelar si el correo existe |
| Bypass dev | Header `X-Dev-User-Email` **solo** en entorno local documentado; debe eliminarse o desactivarse al cerrar esta spec |

### Flujo de login

1. Usuario ingresa **correo** y **contrasena** en `/login`.
2. API valida credenciales, estado `ACTIVO` y existencia de al menos una granja y un perfil activo con permisos efectivos.
3. API responde access token (JSON) y establece cookie de refresh.
4. La sesion incluye en el token/contexto: `userId`, `companiaId`, `granjaIds`, `permisos[]`, `granjaActivaId`.
5. Si tiene **una sola** granja permitida, se selecciona automaticamente como granja activa.
6. Si tiene **varias**, la UI muestra selector persistente en header hasta elegir una (`AUTH_GRANJA_REQUIRED` si falta en rutas operativas).

### Flujo de request autenticado

1. Web envia `Authorization: Bearer <accessToken>` en cada llamada a `apps/api`.
2. `TenantGuard` valida JWT, reconstruye `TenantContext` y aplica `requirePermission` / `requireGranjaAccess` en servicios.
3. Si el access token expiro, web usa `POST /auth/refresh` (cookie refresh) para obtener uno nuevo.

### Endpoints MVP v1

| Metodo | Ruta | Permiso minimo | Descripcion |
|--------|------|----------------|-------------|
| POST | `/auth/login` | Publico | Login correo + contrasena |
| POST | `/auth/logout` | Autenticado | Revoca sesion refresh |
| POST | `/auth/refresh` | Cookie refresh | Renueva access token |
| PATCH | `/auth/granja-activa` | Autenticado | Cambia granja activa de la sesion |
| GET | `/usuarios` | `usuarios.ver` | Listado paginado (filtrado por compania del actor salvo admin sistema) |
| POST | `/usuarios` | `usuarios.crear` | Alta de usuario |
| PATCH | `/usuarios/:id` | `usuarios.editar` | Edicion de usuario |
| POST | `/usuarios/:id/restablecer-contrasena` | `usuarios.editar` | Nueva contrasena definida por admin |
| GET | `/perfiles` | `perfiles.administrar` o `usuarios.ver` | Listado de perfiles |
| POST | `/perfiles` | `perfiles.administrar` | Alta de perfil |
| PATCH | `/perfiles/:id` | `perfiles.administrar` | Edicion e inactivacion de perfil |
| GET | `/permisos` | `perfiles.administrar` | Catalogo de permisos (solo lectura) |

Formato de respuesta y errores: `docs/09-catalogo-errores.md`.

### Politica de contrasena (MVP v1)

- Longitud minima: **8 caracteres**.
- Debe incluir al menos:
  - **una letra mayuscula** (A–Z);
  - **un numero** (0–9);
  - **un caracter especial** (ej. `!@#$%^&*()_+-=[]{}|;:'",.<>?/` — cualquier simbolo no alfanumerico).
- En alta y restablecimiento: confirmacion de contrasena en UI (dos campos).
- Validacion en cliente (Zod) y servidor con la misma regla.
- La UI debe mostrar ayuda visible con estos requisitos junto al campo de contrasena.
- Error de validacion: codigo `USUARIO_CONTRASENA_DEBIL` con mensaje claro que indique los requisitos no cumplidos.

## Datos requeridos

### Usuario

| Campo | Obligatorio | Notas |
|-------|-------------|-------|
| Nombre | Si | |
| Apellido | No | |
| Correo electronico | Si | Unico global; usado para login |
| Contrasena | Si en alta | Solo hash en BD; no editable en formulario de edicion general |
| Compania | Si | Fija en edicion salvo admin sistema con reglas explicitas |
| Granjas permitidas | Si (>= 1) | Solo granjas activas de la compania |
| Perfiles | Si (>= 1 activo) | Solo perfiles con `estadoRegistro = Activo` en alta |
| Estado | Si | `ACTIVO`, `INACTIVO`, `BLOQUEADO` |

Campos editables en PATCH (admin):

- Nombre, apellido, granjas, perfiles, estado.
- **No** cambiar correo en MVP v1 salvo decision futura (evita conflictos de identidad y sesiones).
- Contrasena solo via accion **Restablecer contrasena**.

### Perfil

| Campo | Obligatorio | Notas |
|-------|-------------|-------|
| Nombre | Si | Unico global |
| Descripcion | No | |
| Permisos asignados | Si (>= 1 en alta) | Subconjunto del catalogo seed |
| Estado | Si | `Activo` / `Inactivo` |

### Permiso (catalogo)

Entidad de solo lectura para la UI de perfiles:

- Codigo, nombre, modulo, accion, descripcion opcional.

## Reglas de negocio

### Usuario

- Todo usuario debe pertenecer a una compania.
- Un usuario no puede pertenecer a mas de una compania.
- El **correo electronico** debe ser unico en todo el sistema (normalizado antes de guardar y comparar).
- Un usuario debe tener **al menos una granja** activa asignada y **al menos un perfil activo**.
- Un usuario solo puede acceder a granjas de su compania.
- Un usuario **inactivo** o **bloqueado** no puede iniciar sesion.
- Un usuario sin acceso a una granja no puede consultar ni modificar datos productivos de esa granja.
- Las contrasenas no se almacenan en texto plano; solo hash bcrypt.
- Un administrador de compania solo gestiona usuarios de **su** compania.
- Un administrador de compania solo asigna granjas de **su** compania.
- Debe existir al menos un usuario con capacidad de administracion del sistema (seed inicial).
- Al inactivar o bloquear un usuario, sus sesiones refresh vigentes deben revocarse.

### Perfil y permisos

- Los perfiles son globales; no pertenecen a una compania.
- Los permisos son globales; no se crean desde ABM en v1.
- Un perfil inactivo **no** puede asignarse a usuarios nuevos ni en edicion.
- Los permisos efectivos del usuario son la **union** de permisos de sus perfiles **activos** asignados.
- Si un perfil se inactiva, deja de aportar permisos de inmediato en nuevos logins y refresh de token; no es necesario `PERFIL_EN_USO` para inactivar.
- Debe existir al menos un perfil seed con permisos de administracion (`Administrador Sistema`).

### Autenticacion y sesion

- Tras login exitoso, el access token debe incluir permisos calculados en servidor (no confiar en permisos enviados por el cliente).
- La granja activa debe pertenecer a `granjaIds` del usuario; si no, rechazar con `GRANJA_ACCESS_DENIED`.
- Rutas de configuracion global (companias) pueden no exigir granja activa; rutas operativas por granja si.

## Permisos del sistema

### Catalogo completo (seed)

Todos los codigos se cargan en BD por seed/migracion. Los modulos fuera de MVP v1 pueden existir en catalogo pero sus guards se activan cuando se implemente cada spec.

Lista de referencia (ver historial de esta spec y `docs/07-diseno-tecnico-inicial.md`):

- `companias.ver`, `companias.crear`, `companias.editar`
- `granjas.ver`, `granjas.crear`, `granjas.editar`
- `maestras.administrar`
- `usuarios.ver`, `usuarios.crear`, `usuarios.editar`
- `perfiles.administrar`
- `animales.*`, `lotes.*`, `sanidad.*`, `inventario.*`, `alimentacion.consumo.*`
- `ubicaciones.movimientos.*`, `reproduccion.*`, `engorde.*`, `pesos.*`, `reportes.*`

Ver listado detallado en `docs/07-diseno-tecnico-inicial.md` (seccion permisos MVP v1 activos).

### Permisos activos en guards (MVP v1)

Se validan desde implementacion de cada modulo. En esta spec deben quedar operativos al menos:

- `usuarios.ver`, `usuarios.crear`, `usuarios.editar`
- `perfiles.administrar`
- Integracion con permisos ya usados en spec `000` (`companias.*`, `granjas.*`, `maestras.administrar`)

### Perfiles seed sugeridos

| Perfil | Proposito |
|--------|-----------|
| Administrador Sistema | Todos los permisos; usuario demo inicial |
| Administrador Compania | `usuarios.*`, `granjas.*`, `maestras.administrar`, sin `companias.crear` |
| Operador Granja | Permisos operativos MVP v1 (lotes, inventario, consumo, engorde, pesos, reportes basicos) |

## Experiencia de usuario (UX)

Referencia transversal: `docs/11-guia-ux-ui.md`. Reutilizar componentes del spec `000` donde aplique (`RecordListItem`, toasts, paginacion, `Field` con `*`).

### Login

- Ruta publica `/login`; redirigir a dashboard si ya hay sesion valida.
- Formulario: **Correo electronico***, **Contrasena***, boton `Iniciar sesion`.
- Leyenda de campos obligatorios con `*`.
- Errores de credenciales/estado con toast o mensaje inline en espanol claro (sin detalle tecnico).
- No mostrar si el correo existe o no.

### Sesion y granja activa

- Selector de granja en header cuando `granjaIds.length > 1`.
- Contexto visible: compania y granja activa (`docs/11-guia-ux-ui.md` — principio de contexto).
- Cerrar sesion desde menu `Mas` o perfil de usuario.

### Navegacion de seguridad

- Hub **`/seguridad`** con acceso a usuarios y perfiles.
- Pantallas:
  - `/seguridad/usuarios` — ABM de usuarios.
  - `/seguridad/perfiles` — ABM de perfiles globales.
- Enlace desde hub `Configuracion` o menu `Mas` hacia `/seguridad` (segun permisos del usuario).

### ABM Usuarios (`/seguridad/usuarios`)

- Pantalla propia con listado paginado (tamano pagina **5**, igual que spec `000`).
- Busqueda por nombre o correo; filtro por estado (`Activos`, `Inactivos`, `Bloqueados`, `Todos`).
- Alta y edicion en formulario colapsable; accion **Restablecer contrasena** en edicion (dialogo con contrasena nueva + confirmacion).
- Campos obligatorios marcados con `*`.
- Confirmacion antes de **Inactivar** o **Bloquear**.
- Toasts en crear, editar, restablecer contrasena, cambios de estado.
- Admin de compania ve solo usuarios de su compania.

### ABM Perfiles (`/seguridad/perfiles`)

- Listado paginado con busqueda por nombre.
- Filtro `Activos` / `Inactivos` / `Todos`.
- Formulario con nombre, descripcion y **selector de permisos** agrupado por modulo (checkboxes).
- Confirmacion antes de inactivar perfil.
- Toasts en mutaciones.

### Campos obligatorios en formularios

| Formulario | Obligatorios |
|------------|--------------|
| Login | Correo, contrasena |
| Usuario (alta) | Nombre, correo, contrasena, confirmacion contrasena, compania, >= 1 granja, >= 1 perfil |
| Usuario (edicion) | Nombre, >= 1 granja, >= 1 perfil |
| Restablecer contrasena | Contrasena nueva, confirmacion |
| Perfil | Nombre, >= 1 permiso |

## Criterios de aceptacion

### Autenticacion

#### CA-001: Iniciar sesion con correo y contrasena

Dado un usuario activo con correo y contrasena validos, al menos una granja y un perfil activo, cuando ingresa sus credenciales en `/login`, entonces el sistema autentica, emite tokens y redirige al area autenticada.

#### CA-002: Rechazar credenciales invalidas

Dado un correo o contrasena incorrectos, cuando intenta iniciar sesion, entonces el sistema responde con `AUTH_INVALID_CREDENTIALS` y mensaje generico *Correo o contrasena incorrectos*.

#### CA-003: Impedir sesion de usuario inactivo o bloqueado

Dado un usuario en estado `INACTIVO` o `BLOQUEADO`, cuando intenta iniciar sesion con credenciales correctas, entonces el sistema rechaza el acceso con `AUTH_USER_INACTIVE` o `AUTH_USER_BLOCKED` segun corresponda.

#### CA-004: Cerrar sesion

Dado un usuario autenticado, cuando elige cerrar sesion, entonces el sistema revoca la sesion refresh, elimina credenciales en cliente y redirige a `/login`.

#### CA-005: Renovar access token

Dado un access token expirado y una cookie refresh valida, cuando la aplicacion llama a `/auth/refresh`, entonces obtiene un nuevo access token sin pedir credenciales de nuevo.

#### CA-006: Seleccionar granja activa

Dado un usuario con acceso a mas de una granja, cuando selecciona una granja en el header, entonces las pantallas operativas filtran por esa granja y la API valida `granjaActivaId` contra sus granjas permitidas.

### Usuarios

#### CA-007: Registrar usuario

Dado que existe una compania activa, cuando un administrador con `usuarios.crear` registra un usuario con datos validos (incluida contrasena que cumple la politica), entonces el usuario queda asociado a esa compania con hash de contrasena persistido.

#### CA-008: Asignar granjas permitidas

Dado granjas activas de la compania, cuando el administrador asigna granjas a un usuario, entonces el usuario solo puede operar sobre esas granjas.

#### CA-009: Evitar correo duplicado

Dado un usuario con correo `admin@granja.com`, cuando se intenta registrar otro usuario con el mismo correo (independiente de mayusculas), entonces el sistema rechaza con `USUARIO_EMAIL_DUPLICADO`.

#### CA-010: Editar usuario

Dado un usuario existente, cuando un administrador con `usuarios.editar` modifica nombre, granjas, perfiles o estado validos, entonces el sistema persiste cambios y muestra toast de exito.

#### CA-011: Restablecer contrasena por administrador

Dado un usuario existente, cuando un administrador con `usuarios.editar` restablece la contrasena con una contrasena que cumple la politica (minimo 8 caracteres, mayuscula, numero y caracter especial) y confirmacion coincidente, entonces la nueva contrasena queda hasheada y las sesiones previas del usuario se revocan.

#### CA-012: Validar usuario sin perfil o sin granja

Dado un formulario de alta o edicion, cuando el administrador intenta guardar sin al menos un perfil activo o sin al menos una granja, entonces el sistema rechaza con `USUARIO_SIN_PERFIL` o `USUARIO_SIN_GRANJA`.

#### CA-013: Bloquear e inactivar usuario

Dado un usuario activo, cuando un administrador lo bloquea o inactiva, entonces no puede iniciar sesion y sus sesiones refresh quedan revocadas.

#### CA-014: Admin de compania acotado a su tenant

Dado un administrador de compania sin permisos cross-tenant, cuando consulta o edita usuarios, entonces solo ve y modifica usuarios de su propia compania.

#### CA-015: Impedir asignacion de granja externa

Dado un usuario de una compania, cuando un administrador intenta asignarle una granja de otra compania, entonces el sistema rechaza con `USUARIO_GRANJA_EXTERNA`.

### Perfiles y permisos

#### CA-016: Crear perfil con permisos

Dado un administrador con `perfiles.administrar`, cuando crea un perfil global y selecciona permisos del catalogo, entonces el perfil queda disponible para asignarlo a usuarios.

#### CA-017: Editar perfil

Dado un perfil existente, cuando un administrador edita nombre, descripcion o permisos, entonces los cambios se persisten y afectan permisos efectivos en el proximo login o refresh de token.

#### CA-018: Inactivar perfil

Dado un perfil activo, cuando un administrador lo inactiva, entonces no puede asignarse en altas/ediciones de usuarios y deja de aportar permisos en nuevas sesiones.

#### CA-019: Evitar perfil duplicado

Dado un perfil llamado `Operador Granja`, cuando se intenta crear otro con el mismo nombre, entonces el sistema rechaza con `PERFIL_NOMBRE_DUPLICADO`.

#### CA-020: Validar permiso de modulo

Dado un usuario sin permiso `animales.crear`, cuando intenta ejecutar una accion que lo requiere, entonces la API responde 403 con mensaje claro.

#### CA-021: Validar acceso a granja

Dado un usuario con acceso solo a `Granja Norte`, cuando intenta consultar datos de `Granja Sur`, entonces el sistema impide la operacion.

#### CA-022: Usuario con multiples perfiles

Dado un usuario con mas de un perfil activo, cuando ejecuta una accion, entonces el sistema la permite si **al menos uno** de sus perfiles activos contiene el permiso requerido y tiene acceso a la granja correspondiente.

### UX transversal

#### CA-023: Paginar listados de usuarios y perfiles

Dado un listado con mas registros que el tamano de pagina, cuando el usuario consulta usuarios o perfiles, entonces el sistema pagina resultados (`page`, `limit`, `total`, `totalPages`) y la UI permite navegar paginas.

#### CA-024: Toast en mutaciones ABM

Dado una accion ABM de usuarios o perfiles (crear, editar, inactivar, bloquear, restablecer contrasena), cuando la accion termina en exito o error recuperable, entonces se muestra toast en espanol con opcion de cerrar.

#### CA-025: Campos obligatorios

Dado un formulario de esta spec, cuando un campo obligatorio esta vacio y el usuario guarda, entonces se resalta el campo, se muestra `Este campo es obligatorio.` y no se envia la peticion hasta corregir.

#### CA-026: Rechazar contrasena debil

Dado un formulario de alta o restablecimiento de contrasena, cuando la contrasena no cumple la politica definida, entonces el sistema resalta el campo, responde con `USUARIO_CONTRASENA_DEBIL` y no persiste el cambio.

## Cierre de implementacion MVP v1

**Fecha de cierre:** 2026-06-14  
**Rama de trabajo:** `feature/usuarios-perfiles`

### Entregables implementados

| Capa | Alcance |
|------|---------|
| API (`apps/api`) | Auth JWT (`/auth/login`, `/refresh`, `/logout`, `/granja-activa`); ABM usuarios y perfiles; catalogo `/permisos`; `JwtAuthGuard` global (reemplaza `X-Dev-User-Email`) |
| Web (`apps/web`) | Login, `AuthProvider`, guards por permiso, hub `/seguridad`, ABM usuarios/perfiles, selector granja, sesion en header, accesos rapidos en dashboard |
| Datos | Seed: permisos `usuarios.*` / `perfiles.administrar`, perfiles Administrador Sistema, Administrador Compania, Operador Granja |
| Shared | Schemas Zod seguridad, politica contrasena, permisos, `TenantContext` con `sessionId` |

### Pantallas web

- `/login` — correo y contrasena, ojito mostrar contrasena, redirect `?next=`
- `/seguridad` — hub (filtrado por permisos)
- `/seguridad/usuarios` — ABM, restablecer contrasena, filtros y paginacion
- `/seguridad/perfiles` — ABM global con selector de permisos por modulo

### Verificacion de criterios de aceptacion

| ID | Estado | Notas |
|----|--------|-------|
| CA-001 a CA-006 | OK | Login, logout, refresh, granja activa, selector nombre real con una granja |
| CA-007 a CA-015 | OK | ABM usuarios, tenant, email duplicado, restablecer contrasena, revocacion sesiones |
| CA-016 a CA-019 | OK | ABM perfiles globales |
| CA-020 a CA-022 | OK | Guards API + `PermissionGuard` web; CA-020/021 operativos en modulos con permiso (ej. seguridad, configuracion) |
| CA-023 a CA-026 | OK | Paginacion, toasts, campos obligatorios, politica contrasena, `PasswordInput` |

### Verificacion tecnica

- [x] `pnpm run typecheck`
- [x] Prueba manual funcional (admin + operador granja)

### Mejoras opcionales pospuestas

- Confirmacion explicita antes de inactivar/bloquear usuario (hoy cambio de estado en formulario de edicion).
- Rate limiting / bloqueo tras intentos fallidos de login (recomendado antes de produccion).
- Guards de permiso en pantallas de configuracion base (misma mecanica que seguridad).

## Preguntas abiertas

Resueltas para MVP v1 (ver `docs/06-cierre-sdd.md`):

- Correo como identificador obligatorio → **Si**. Login solo con correo electronico y contrasena.
- Recuperacion de contrasena por correo → **No** en v1. El administrador restablece contrasena desde ABM.

Pendientes para fases posteriores:

- Permitir cambio de correo electronico con verificacion.
- Recuperacion self-service por correo.
- 2FA y SSO.
- Rate limiting / bloqueo tras intentos fallidos de login (recomendado antes de produccion).

## Decisiones tomadas

- Login con **correo electronico + contrasena** (identificador unico global).
- Autenticacion en **`apps/api`** con **JWT** + refresh en cookie HttpOnly (ADR `0007`); no Auth.js en Next.
- Modelo de autorizacion de tres capas (compania, granja, permiso) segun ADR `0001`.
- Un usuario pertenece a una sola compania; acceso a una o varias granjas.
- Perfiles y permisos globales; permisos asignables a perfiles, no ABM de codigos de permiso.
- Estados de usuario: `ACTIVO`, `INACTIVO`, `BLOQUEADO`.
- Restablecimiento de contrasena solo por administrador en v1.
- Politica de contrasena: minimo 8 caracteres, al menos una mayuscula, un numero y un caracter especial.
- Pantallas de administracion bajo **`/seguridad`** (hub, usuarios, perfiles).
- Solo perfiles **activos** aportan permisos.
- Administrador de compania acotado a usuarios y granjas de su tenant.
- El veterinario operativo es un **perfil**; el veterinario tratante se gestiona en `004-sanidad-animal.md`.
- Patron ABM, paginacion, toasts y campos obligatorios alineados con spec `000`.
- Reemplazar bypass `X-Dev-User-Email` al completar implementacion de esta spec.
