# Gestion de Granjas

Este proyecto se desarrollara usando Specification-Driven Development (SDD).

La documentacion en `docs/` sera la fuente de verdad del producto. Antes de implementar una funcionalidad, primero debe existir una especificacion clara con reglas de negocio, datos requeridos y criterios de aceptacion.

## Objetivo

Construir un sistema modular para la gestion productiva de granjas, comenzando con enfoque en produccion porcina pero preparado para soportar multiples companias, multiples granjas y distintos tipos de animales.

## Documentos iniciales

- `docs/00-vision.md`: vision, alcance y MVP inicial.
- `docs/01-glossary.md`: terminos importantes del dominio.
- `docs/02-roadmap-sdd.md`: orden recomendado para especificar e implementar.
- `docs/03-catalogo-maestras.md`: catalogo consolidado de maestras del sistema.
- `docs/04-diagrama-flujo.md`: diagramas de flujo general, reproduccion, engorde, alimentacion y sanidad.
- `docs/04-diagrama-flujo-general.mmd`: diagrama Mermaid puro para visores que no interpretan Markdown.
- `docs/05-mvp-tecnico.md`: alcance tecnico recomendado para la primera version construible.
- `docs/06-cierre-sdd.md`: cierre de la fase de especificacion funcional y resolucion de preguntas abiertas del MVP v1.
- `docs/07-diseno-tecnico-inicial.md`: arquitectura, modelo de datos, permisos y estructura del proyecto para MVP v1.
- `docs/08-convenciones-implementacion.md`: nomenclatura, modulos, servicios, UI y testing.
- `docs/09-catalogo-errores.md`: codigos de error, HTTP y mensajes al usuario.
- `docs/10-cierre-diseno-tecnico.md`: cierre de la fase de diseno tecnico previa al scaffold.
- `docs/11-guia-ux-ui.md`: direccion visual elegante, divertida, llamativa y mobile-first.
- `docs/12-convenciones-git-y-calidad.md`: ramas, commits, componentes y calidad de codigo.
- `docs/13-arquitectura-monorepo.md`: monorepo con backend y frontend separados.
- `docs/14-infraestructura-docker.md`: especificacion Docker Compose para desarrollo y produccion.
- `.cursor/rules/`: reglas persistentes para el agente de IA (resumen operativo del SDD y convenciones).
- `docs/specs/000-configuracion-base.md`: companias, granjas y maestras base.
- `docs/specs/001-usuarios-perfiles.md`: usuarios, perfiles, permisos y acceso por granja.
- `docs/specs/002-gestion-animales.md`: gestion de animales individuales.
- `docs/specs/003-gestion-lotes.md`: gestion de lotes productivos.
- `docs/specs/004-sanidad-animal.md`: veterinario tratante, vacunaciones, enfermedades, tratamientos y controles sanitarios.
- `docs/specs/005-inventario-alimentos.md`: inventario de alimentos, almacenes, proveedores, movimientos, costos y existencias.
- `docs/specs/006-movimientos-ubicacion.md`: historial de movimientos de ubicacion de animales y lotes.
- `docs/specs/007-consumo-alimento.md`: consumo de alimento por animal o lote con trazabilidad e inventario.
- `docs/specs/008-montas.md`: registro de montas e inseminaciones como inicio del ciclo reproductivo.
- `docs/specs/009-gestacion.md`: confirmacion, seguimiento y controles de gestacion.
- `docs/specs/010-partos.md`: registro de partos, crias nacidas y cierre de gestacion.
- `docs/specs/011-destete.md`: destete, mortalidad en lactancia y cierre del ciclo reproductivo basico.
- `docs/specs/012-engorde-lotes.md`: inicio, control y cierre productivo de lotes de engorde.
- `docs/specs/013-controles-peso.md`: controles de peso de animales y lotes.
- `docs/specs/014-reportes-reproduccion.md`: indicadores y reportes reproductivos.
- `docs/specs/015-reportes-alimentacion.md`: reportes de consumo, costos, existencias e inventario.
- `docs/specs/016-reportes-sanidad.md`: reportes de vacunaciones, enfermedades, tratamientos y controles sanitarios.
- `docs/specs/017-reportes-engorde.md`: reportes de ganancia de peso, consumo, bajas y conversion alimenticia.
- `docs/specs/018-asistente-recomendaciones.md`: asistente de recomendaciones (consumo/stock, feedback y umbrales).
- `docs/decisions/0001-modelo-seguridad-multicompania.md`: decision de seguridad multi-compania.
- `docs/decisions/0002-modelo-sanidad-veterinario-tratante.md`: decision sanitaria y veterinario tratante.
- `docs/decisions/0003-alcance-maestras.md`: decision sobre alcance global, por compania y por granja de las maestras.
- `docs/decisions/0004-estado-registro-vs-estado-operativo.md`: decision sobre estado tecnico de ABM y estados operativos del negocio.
- `docs/decisions/0005-auditoria-y-trazabilidad.md`: decision transversal sobre auditoria, anulacion y no borrado fisico.
- `docs/decisions/0006-stack-tecnologico.md`: decision de stack web responsive mobile-first.
- `docs/decisions/0007-monorepo-backend-frontend.md`: monorepo con api y web separados.
- `docs/decisions/0008-docker-contenedores.md`: decision de usar Docker Compose.

## Flujo SDD

1. Definir o actualizar la especificacion.
2. Revisar reglas de negocio y criterios de aceptacion.
3. Disenar modelo de datos y comportamiento esperado.
4. Implementar solo lo especificado.
5. Verificar con pruebas o checklist manual.

## Desarrollo local

### Requisitos

- Node.js 22+ con Corepack (`corepack enable`)
- pnpm 9+ (via `packageManager` en `package.json`)
- Docker Desktop

### Opcion 1: pnpm dev local

Levanta PostgreSQL en Docker (automático) y corre API/Web en el host.

```bash
cp .env.development.example .env.development
pnpm install
pnpm dev
```

Si solo necesitas la base de datos: `pnpm docker:db`

| Servicio | URL |
|----------|-----|
| Web | http://localhost:3000 |
| API | http://localhost:3001/api |
| PostgreSQL | localhost:5432 |

Para detener PostgreSQL: `pnpm docker:db:down`

### Opcion 2: Docker dev completo

Levanta PostgreSQL, API NestJS y Web Next.js en contenedores con hot reload.

```bash
cp .env.development.example .env.development
pnpm docker:dev
```

Para detener todo: `pnpm docker:down`

El mismo `.env.development` sirve para ambos flujos: local usa `DATABASE_URL` con `localhost`, y Docker sobrescribe esa variable dentro del contenedor API para usar el hostname `postgres`.

### Asistente con LLM (opcional)

Por defecto el texto de la alerta sale de una plantilla de reglas. Para enriquecerlo:

```bash
# En .env.development
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
```

Si la API corre en Docker y Ollama en el host, usa `OLLAMA_BASE_URL=http://host.docker.internal:11434`.
Si Ollama no está o falla, la app sigue con la plantilla.

### Deploy en Railway (API, rama `testing`)

El flujo git sigue siendo `feature/*` → MR a `testing` → Railway despliega `testing`.

1. MR de esta feature a `testing` y push (Railway construye desde GitHub).
2. En el mismo proyecto que Postgres: **New** → GitHub repo → este repositorio.
3. **Branch:** `testing`. **Builder:** Dockerfile. **Dockerfile path:** `apps/api/Dockerfile`.
4. El contenedor arranca con `scripts/docker-entrypoint-api-testing.sh` (migraciones + seed demo + Nest).
   Produccion (`master`) puede usar `scripts/docker-entrypoint-api-prod.sh` como start command.
5. Variables (ver `.env.testing.example`):

```text
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=true
NODE_ENV=production
PORT=3001
JWT_SECRET=<secreto largo>
CORS_ORIGIN=https://TU-WEB.up.railway.app
COOKIE_SAMESITE=none
LLM_PROVIDER=none
RUN_SEED=true
DEV_USER_EMAIL=admin@demo.local
SEED_ADMIN_PASSWORD=<definir solo en Railway, no en git>
```

`DATABASE_URL` debe terminar en `/gestion_granjas` si esa es la base que creaste.
`SEED_ADMIN_PASSWORD` es obligatorio: sin esa variable el seed no crea el admin.

6. Public networking, puerto `3001`.
7. Probar: `https://<api>.up.railway.app/api/health`

El email demo por defecto es `admin@demo.local`. La clave la definís vos en Railway y se la pasás al docente por fuera del repo.
