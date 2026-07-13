# Spec 002: Gestion de Animales

## Estado

Lista para implementar MVP v2 (2026-07-13)

## Objetivo

Gestionar animales identificados individualmente con ficha, origen, parentesco, estado
operativo e historial de salida, como base de sanidad y reproduccion.

## Dependencias

- `000-configuracion-base.md`
- `001-usuarios-perfiles.md`
- `docs/decisions/0004-estado-registro-vs-estado-operativo.md`
- `docs/decisions/0005-auditoria-y-trazabilidad.md`

## Alcance MVP v2

Incluye:

- Alta, consulta y edicion de datos permitidos.
- Identificacion manual unica para siempre por granja.
- Fecha de nacimiento y/o ingreso.
- Sexo y finalidad.
- Madre y padre opcionales.
- Ubicacion inicial opcional.
- Eventos de venta, muerte y descarte.
- Anulacion del ultimo evento terminal.
- Ficha con historial.

No incluye:

- Identificacion automatica.
- Movimientos historicos de ubicacion de animales.
- Traslado entre granjas.
- Compra/venta financiera.
- Consumo individual.
- Genealogia avanzada o coeficiente de consanguinidad.

## Estados

### Estado de registro

`ACTIVO | INACTIVO`, usado solo para disponibilidad administrativa.

### Estado operativo

`ACTIVO | VENDIDO | MUERTO | DESCARTADO`.

No se usa `INACTIVO` como sinonimo de salida productiva. El estado operativo se deriva del
ultimo evento terminal vigente.

## Datos

### Animal

| Campo | Regla |
|-------|-------|
| `companiaId`, `granjaId` | Tenant y granja obligatorios |
| `identificacion` | Manual, normalizada y unica para siempre por granja |
| `tipoAnimalId` | Activo |
| `sexo` | `MACHO`, `HEMBRA` o `DESCONOCIDO` |
| `fechaNacimiento` | Opcional si existe ingreso |
| `fechaIngreso` | Opcional si existe nacimiento |
| `finalidadProductivaId` | Obligatoria |
| `razaId` | Segun configuracion del tipo |
| `madreId`, `padreId` | Opcionales |
| `ubicacionId` | Inicial y opcional |
| `observaciones` | Opcional |
| `estadoRegistro` | Administrativo |

### Evento de ciclo del animal

| Campo | Regla |
|-------|-------|
| `tipo` | `VENTA`, `MUERTE`, `DESCARTE` |
| `fecha` | Obligatoria |
| `motivoId` | Obligatorio |
| `observaciones` | Opcional |
| anulacion/auditoria | Obligatoria |

Los motivos son maestras por compania, con catalogo independiente por tipo de evento.

## Reglas

1. Toda operacion valida compania y granja permitida.
2. Identificacion se recorta y compara sin distinguir mayusculas/minusculas.
3. Nunca se reutiliza una identificacion, aunque el animal este vendido, muerto, descartado
   o inactivo.
4. Debe existir al menos fecha de nacimiento o de ingreso.
5. Ninguna fecha puede ser futura.
6. Si existen ambas, ingreso no puede preceder al nacimiento.
7. La raza debe corresponder al tipo y es obligatoria solo si este la requiere.
8. Ubicacion inicial debe pertenecer a la granja.
9. Madre y padre deben pertenecer a la misma compania y tipo de animal.
10. Madre debe ser hembra, padre macho y ambos deben haber nacido/ingresado antes.
11. No se permiten autorreferencias ni ciclos de parentesco.
12. Sexo desconocido es valido, pero bloquea participacion reproductiva.
13. Partos registran automaticamente la madre y, cuando se conoce, el padre.
14. Un animal operativo no activo no participa en nuevos eventos productivos.
15. Venta, muerte y descarte son eventos inmutables, no ediciones directas de estado.
16. Solo puede existir un evento terminal vigente.
17. Solo el ultimo evento terminal vigente puede anularse con motivo; al anularlo, el animal
    vuelve a `ACTIVO`.
18. Venta o cualquier salida destinada a consumo se bloquea durante retiro sanitario
    vigente. Muerte y descarte no se bloquean.
19. Campos base no pueden alterarse si contradicen eventos posteriores; identificación y
    granja son inmutables.

## Permisos

- `animales.ver`
- `animales.crear`
- `animales.editar`
- `animales.eventos.crear`
- `animales.eventos.anular`

## API

| Metodo | Ruta |
|--------|------|
| `GET` | `/animales` |
| `POST` | `/animales` |
| `GET` | `/animales/:id` |
| `PATCH` | `/animales/:id` |
| `POST` | `/animales/:id/eventos-ciclo` |
| `POST` | `/animales/:id/eventos-ciclo/:eventoId/anular` |

Listado: `granjaId` obligatorio; `q?`, `tipoAnimalId?`, `sexo?`, `finalidadProductivaId?`,
`estadoOperativo?`, `estadoRegistro?`, `page`, `limit`.

Crear/editar nunca acepta compania, estado operativo ni auditoria desde cliente. La
anulacion recibe `{ motivo }`.

## UX

- Hub de animales y ficha por animal.
- Listado con busqueda, filtros y granja activa.
- Formulario mobile-first con parentesco colapsable.
- Ficha con datos generales, estado visible y linea de tiempo.
- Acciones terminales separadas y confirmadas.
- Animal no activo conserva ficha e historiales.
- Errores de carga inline; mutaciones con toast.

## Criterios de aceptacion

### CA-001: Crear animal

Dado tenant, granja y maestras validas, cuando se crea con identificacion y al menos una
fecha de referencia, entonces queda operativo y administrativamente activo.

### CA-002: Identificacion permanente

Dada una identificacion usada anteriormente, cuando se intenta reutilizar en la granja,
entonces se rechaza sin importar estados.

### CA-003: Validar fechas y raza

Dadas fechas invalidas o raza incompatible, cuando se guarda, entonces se rechaza.

### CA-004: Registrar parentesco

Dados progenitores validos, cuando se asignan, entonces se guardan sin ciclos y con sexo/tipo
compatibles.

### CA-005: Bloquear reproduccion con sexo desconocido

Dado sexo desconocido, cuando se intenta usar en un evento reproductivo, entonces se exige
definirlo.

### CA-006: Registrar evento terminal

Dado animal activo, cuando se registra venta, muerte o descarte, entonces cambia su estado
derivado y deja de estar disponible para nuevos eventos.

### CA-007: Bloquear salida para consumo por retiro

Dado periodo de retiro sanitario vigente, cuando se intenta vender o enviar a consumo,
entonces se rechaza e informa la fecha de finalizacion; muerte y descarte siguen permitidos.

### CA-008: Anular salida

Dado el evento terminal vigente, cuando se anula con motivo, entonces el historial se
conserva y el animal vuelve a activo.

### CA-009: Proteger eventos

Dado un evento terminal, cuando se intenta editar o eliminar, entonces se rechaza.

### CA-010: Respetar tenant

Dado un usuario sin acceso, cuando consulta o muta, entonces no se exponen datos.

## Errores

Agregar familia `ANIMAL_*`: identificacion duplicada, fechas, raza, parentesco, ciclo,
estado, retiro sanitario y tenant.

## Verificacion

- Unitarias de normalizacion, fechas, parentesco y ciclos.
- Integracion de eventos terminales/anulacion/retiro.
- Multi-tenant y permisos.
- Prueba manual mobile-first.

## Preguntas abiertas

No quedan preguntas que bloqueen MVP v2.

Futuro:

- Identificacion automatica.
- Movimientos de ubicacion.
- Traslados, genealogia avanzada y consumo individual.

## Decisiones MVP v2

- Identificacion no reutilizable.
- Estado operativo derivado de eventos.
- Parentesco opcional.
- Sexo desconocido permitido, no apto para reproduccion.
- Salidas inmutables y anulables.
