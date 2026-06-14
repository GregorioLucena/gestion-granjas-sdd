# Convenciones Git y Calidad de Codigo

Este documento define el flujo de ramas, commits, organizacion de componentes y criterios de prolijidad del codigo.

## Objetivo

Mantener un proyecto ordenado, entendible y facil de revisar. Cada cambio debe poder relacionarse con una funcionalidad, correccion o tarea tecnica concreta.

## Estrategia de ramas

### Ramas base (entornos)

| Rama      | Uso                                                        |
| --------- | ---------------------------------------------------------- |
| `master`  | Produccion: version estable desplegada a usuarios finales  |
| `testing` | Entorno de pruebas: integracion y validacion antes de prod |

No se trabaja directo sobre `master` ni `testing`. Las ramas de trabajo (`feature/`, `bugfix/`, etc.) se crean desde `testing`.

**Nota:** la rama `testing` (entorno) no debe confundirse con el prefijo `test/` (ramas de codigo de pruebas).

### Prefijos de ramas

| Prefijo     | Uso                                       | Ejemplo                      |
| ----------- | ----------------------------------------- | ---------------------------- |
| `feature/`  | Nueva funcionalidad                       | `feature/lotes-abm`          |
| `bugfix/`   | Correccion de bug no urgente              | `bugfix/stock-insuficiente`  |
| `hotfix/`   | Correccion urgente sobre produccion       | `hotfix/login-bloqueado`     |
| `chore/`    | Tareas de mantenimiento                   | `chore/configurar-eslint`    |
| `docs/`     | Cambios de documentacion                  | `docs/cierre-diseno-tecnico` |
| `refactor/` | Mejora interna sin cambiar comportamiento | `refactor/lotes-service`     |
| `test/`     | Agregar o ajustar pruebas                 | `test/reglas-inventario`     |
| `ui/`       | Cambios visuales o componentes UI         | `ui/dashboard-mobile`        |

### Formato de rama

```text
<prefijo>/<descripcion-corta-kebab-case>
```

Ejemplos:

```text
feature/login-auth
feature/lotes-abm
bugfix/consumo-stock-negativo
ui/cards-lotes-mobile
docs/guia-ux-ui
```

## Flujo de trabajo recomendado

```text
master          ← produccion (solo recibe cambios validados)
  ↑
testing         ← integracion / entorno de pruebas
  └── feature/lotes-abm
        ├── commits pequenos
        ├── pruebas/checklist
        └── merge a testing cuando este listo
              └── merge testing → master cuando pase QA
```

Pasos:

1. Crear rama desde `testing`.
2. Implementar cambio pequeno y coherente.
3. Verificar lint/tests/checklist manual.
4. Abrir PR hacia `testing` o revisar diff local.
5. Mergear a `testing` cuando cumpla criterios.
6. Tras validar en entorno de pruebas, promover `testing` → `master`.

### Hotfix en produccion

Para correcciones urgentes en prod:

1. Crear rama `hotfix/...` desde `master`.
2. Corregir, verificar y mergear a `master`.
3. Integrar el mismo fix en `testing` (merge o cherry-pick) para no perderlo en el siguiente ciclo.

## Commits

### Formato recomendado

Usar estilo tipo Conventional Commits, en espanol o ingles, pero manteniendo consistencia:

```text
feat(lotes): crear formulario de registro
fix(inventario): bloquear consumo sin stock
docs(ux): agregar guia visual mobile-first
refactor(auth): simplificar tenant context
test(engorde): cubrir regla de baja maxima
```

### Tipos permitidos

| Tipo       | Uso                               |
| ---------- | --------------------------------- |
| `feat`     | Nueva funcionalidad               |
| `fix`      | Correccion de bug                 |
| `docs`     | Documentacion                     |
| `style`    | Formato visual/codigo sin logica  |
| `refactor` | Refactor sin cambio funcional     |
| `test`     | Pruebas                           |
| `chore`    | Configuracion o mantenimiento     |
| `ui`       | Cambios de interfaz o componentes |

### Reglas de commits

- Commits pequenos y con una intencion clara.
- No mezclar refactor mas funcionalidad si se puede evitar.
- No commitear `.env`, credenciales, dumps o archivos generados innecesarios.
- Si un commit toca una regla de negocio, debe poder rastrearse a una spec o decision.

## Organizacion de componentes

### Carpetas

```text
src/components/
├── ui/                 # shadcn/ui y wrappers base
├── layout/             # AppShell, Header, BottomNav, Sidebar
├── forms/              # componentes reutilizables de formularios
├── data-display/       # cards, badges, empty states, metric cards
└── feedback/           # loading, errors, toasts, confirmations
```

### Componentes por modulo

Componentes muy especificos viven dentro del modulo o ruta:

```text
src/modules/lotes/components/LoteCard.tsx
src/modules/lotes/components/LoteForm.tsx
src/modules/lotes/components/LoteStatusBadge.tsx
```

Componentes reutilizables generales viven en `src/components/`.

## Criterios para crear un componente

Crear componente cuando:

- Se repite en 2 o mas pantallas.
- Encapsula comportamiento visual claro.
- Mejora legibilidad de la pantalla.
- Tiene una responsabilidad unica.

No crear componente si:

- Solo envuelve un `div` sin aportar claridad.
- Oculta demasiada logica.
- Mezcla reglas de negocio con UI.

## Convenciones de componentes React

```typescript
type LoteCardProps = {
  codigo: string;
  cantidadActual: number;
  estado: EstadoLote;
  onOpen: () => void;
};

export function LoteCard({ codigo, cantidadActual, estado, onOpen }: LoteCardProps) {
  return (
    // UI
  );
}
```

Reglas:

- Props tipadas con `type <ComponentName>Props`.
- Export nombrado, no default export, salvo paginas Next.js.
- Componentes pequenos, enfocados y legibles.
- Evitar props booleanas ambiguas como `active`, preferir `estado`.
- No hacer fetch directo dentro de componentes presentacionales.

## Componentes inteligentes vs presentacionales

| Tipo           | Puede hacer                               | No debe hacer                      |
| -------------- | ----------------------------------------- | ---------------------------------- |
| Presentacional | Renderizar props, emitir eventos          | Fetch, permisos, reglas de negocio |
| Contenedor     | Obtener datos, manejar estado de pantalla | Repetir logica de servicios        |
| Formulario     | Validar UI, mostrar errores               | Decidir reglas de negocio finales  |

## Codigo organizado y prolijo

### Reglas de legibilidad

- Funciones pequenas y con nombre claro.
- Un archivo no debe mezclar demasiadas responsabilidades.
- Preferir nombres explicitos sobre abreviaturas.
- Evitar logica compleja inline en JSX.
- Extraer condiciones complejas a variables con nombre.

Ejemplo:

```typescript
const puedeCerrarEngorde =
  lote.estadoOperativo === EstadoLote.ACTIVO &&
  engorde.estado === EstadoEngorde.EN_CURSO;
```

Mejor que:

```typescript
if (lote.estadoOperativo === "ACTIVO" && engorde.estado === "EN_CURSO") {
  // ...
}
```

## Imports

Orden recomendado:

1. Librerias externas.
2. Imports internos absolutos (`@/lib`, `@/modules`).
3. Imports relativos.
4. Tipos.
5. Estilos.

Ejemplo:

```typescript
import { z } from "zod";
import { getDataSource } from "@/database/data-source";
import { requirePermission } from "@/lib/permissions";
import { Lote } from "./entities";
import type { TenantContext } from "@/lib/tenant";
```

## Alias de paths

Configurar alias:

```text
@/app
@/components
@/database
@/lib
@/modules
```

Evitar imports relativos profundos como:

```text
../../../lib/permissions
```

## Lint, formato y calidad

Herramientas recomendadas:

| Herramienta       | Uso                     |
| ----------------- | ----------------------- |
| ESLint            | Reglas de codigo        |
| Prettier          | Formato automatico      |
| TypeScript strict | Evitar errores de tipos |
| Vitest            | Tests unitarios         |

Reglas:

- `strict: true` en TypeScript.
- No usar `any` salvo justificacion clara.
- No dejar `console.log` en codigo final, salvo logs controlados en servidor.
- No dejar TODOs vagos; si hay TODO debe indicar decision pendiente.

## Checklist de PR o cambio local

- [ ] Rama usa prefijo correcto.
- [ ] Cambio pequeno y enfocado.
- [ ] Nombres claros y consistentes.
- [ ] Componentes reutilizables si aplica.
- [ ] No hay logica de negocio en UI.
- [ ] Errores usan catalogo `09-catalogo-errores.md`.
- [ ] UI cumple `11-guia-ux-ui.md`.
- [ ] Probado en movil si toca interfaz.
- [ ] No se commitean secretos.

## Decision

El proyecto trabajara con ramas prefijadas, componentes bien separados y codigo organizado por dominio. La prioridad es que cualquier desarrollador pueda leer un modulo y entender rapidamente que hace, donde valida, donde autoriza y donde persiste.

Las reglas operativas para el agente de IA viven en `.cursor/rules/` y resumen este documento junto con `08`, `09` y `11`.
