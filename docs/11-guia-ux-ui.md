# Guia UX/UI — MVP v1

Este documento define la direccion visual y de experiencia de usuario del sistema. Complementa `08-convenciones-implementacion.md` y debe guiar el diseno de pantallas antes de construir componentes.

## Objetivo

Crear una aplicacion web responsive, elegante, divertida y llamativa, sin perder claridad operativa. El sistema se usara en granjas, muchas veces desde telefono, por lo que debe sentirse moderno, facil, rapido y confiable.

## Personalidad del producto

| Rasgo | Como se traduce en UI |
|-------|------------------------|
| Profesional | Informacion clara, jerarquia visual, datos confiables |
| Cercano | Lenguaje simple, mensajes humanos, interfaz amable |
| Productivo | Flujos cortos, acciones visibles, pocos pasos |
| Divertido | Microinteracciones sutiles, colores vivos, iconografia amigable |
| Llamativo | Dashboards visuales, tarjetas con acentos, estados faciles de reconocer |
| Elegante | Espaciado generoso, bordes suaves, tipografia limpia |

## Principios UX

1. **Primero movil.** Toda pantalla debe funcionar bien en 375px de ancho.
2. **Acciones rapidas.** Registrar consumo, peso, baja o movimiento debe requerir pocos toques.
3. **Contexto visible.** El usuario siempre debe saber en que granja esta trabajando.
4. **Datos clave primero.** En campo importa ver cantidad, estado, fecha, stock y alertas.
5. **Estados claros.** Activo, cerrado, anulado, bajo stock o error deben diferenciarse rapido.
6. **Sin sobrecarga visual.** La UI puede ser llamativa, pero no debe competir con la informacion.

## Direccion visual

### Identidad: Campo vivo

Producto para operadores de granja en telefono. Debe sentirse productivo, cercano y con identidad agropecuaria propia — no un dashboard generico SaaS.

| Eje | Decision |
|-----|----------|
| Firma | Heroes con panel `brand-panel` (degradado solo en verdes limpios) |
| Atmosfera | Fondo mist con glow verde suave; sin overlays maize/ember en fondos |
| Display | `Fraunces` solo en titulos de marca / heroes (`font-display`) |
| UI | `Nunito Sans` para cuerpo, labels, navegacion y formularios |
| Acentos | Maiz y ember en iconos, chips y CTAs — no mezclados sobre verdes oscuros |

### Estilo general

- Moderno, limpio y con detalles organicos asociados al campo.
- Tarjetas con bordes redondeados, sombras suaves y anillos `primary/10`.
- Iconos simples para acciones frecuentes: lotes, alimento, peso, inventario, reportes.
- Ilustraciones pequenas solo en estados vacios o onboarding, no en pantallas operativas densas.
- Microinteracciones cortas (hover lift, active scale); respetar `prefers-reduced-motion`.

### Paleta

| Uso | Color | Hex | Intencion |
|-----|-------|-----|-----------|
| Primario | Canopy | `#146B45` | Campo, productividad |
| Primario oscuro | Canopy deep | `#0B4D31` | Hover / profundidad |
| Secundario | Maize | `#E9B949` | Energia, alimento |
| Acento | Ember | `#E56B1F` | Acciones llamativas |
| Fondo | Mist | `#F4F7F2` | Descanso visual |
| Superficie | Chalk | `#FFFFFF` | Cards y formularios |
| Texto | Ink | `#1C2B24` | Lectura clara |
| Muted | Stone | `#5F6F66` | Secundario |
| Exito | — | `#2F9E5B` | Operacion correcta |
| Alerta | — | `#D97706` | Atencion |
| Error | — | `#DC4A3D` | Error / anulacion |
| Info | — | `#2F7FD1` | Informativo |

Implementacion: `apps/web/src/app/globals.css`.

### Tipografia

- Display (heroes / marca): `Fraunces` via `font-display`. Usar con restriccion.
- UI / cuerpo: `Nunito Sans` (`font-sans`).
- Tamano minimo en formularios moviles: `16px`.
- Evitar stacks genericos (`Inter`, `Roboto`, `Arial`) como fuente principal.
- Secciones internas (h2 de listados): sans semibold, no display.

## Componentes base

### Botones

- Altura minima movil: `44px`.
- Primario: accion principal de la pantalla.
- Secundario: acciones complementarias.
- Destructivo: anulaciones y cierres irreversibles.
- Botones con icono solo si el icono es evidente; si no, icono + texto.

### Tarjetas

- Usar tarjetas como patron principal en movil.
- Cada tarjeta debe mostrar:
  - titulo o codigo
  - estado visible
  - dos o tres datos clave
  - accion principal clara

### Badges de estado

| Estado | Estilo |
|--------|--------|
| Activo / En curso | Verde suave |
| Cerrado | Gris |
| Inactivo | Contorno |
| Anulado / Cancelado | Rojo suave |
| Bajo stock | Ambar |

### Formularios

Patron obligatorio: `FormShell` / `FormHeader` + `FormActions` (`apps/web/src/components/forms/form-shell.tsx`).

| Elemento | Regla |
|----------|-------|
| Contenedor | Card `rounded-3xl`, anillo `primary/10`, padding generoso |
| Encabezado | Titulo de accion (`Nuevo…` / `Editar…`) + descripcion corta si aporta |
| Obligatorios | Asterisco rojo (`*`) + leyenda `Los campos marcados con * son obligatorios` |
| Inputs | Altura min 44px, borde suave, foco verde; error con borde/rojo y mensaje inline |
| Acciones | Fila inferior: `Cancelar` (outline) + CTA primario; loading en submit |
| Una columna | En movil; grid 2 cols solo para pares cortos (fecha/cantidad) en `md+` |
| Confirmaciones | `ConfirmDialog` para inactivar / acciones destructivas |

Validacion en cliente: si el usuario intenta guardar con un obligatorio vacio, resaltar el campo y mostrar `Este campo es obligatorio.`; no enviar hasta corregir.

Campos opcionales no llevan asterisco ni texto `(opcional)` en el label.

## Patrones por pantalla

### Dashboard

Debe ser visual y motivador:

- Tarjetas resumen: lotes activos, stock bajo, consumo del dia, engordes en curso.
- Accesos rapidos: registrar consumo, registrar peso, crear lote.
- Alertas suaves: bajo stock, lotes sin pesaje reciente, engordes por cerrar.

### Lotes

- Movil: cards con codigo, cantidad actual, ubicacion, estado.
- Desktop: tabla con filtros.
- Accion destacada: ver detalle.
- Acciones secundarias: mover, iniciar engorde, registrar peso.

### Inventario

- Mostrar existencia como dato visual principal.
- Bajo stock debe resaltarse sin saturar.
- Entradas, salidas y ajustes diferenciados por color/icono.

### Consumo

- Flujo rapido de registro:
  1. seleccionar lote
  2. seleccionar alimento
  3. indicar cantidad
  4. confirmar stock y guardar
- Mostrar existencia disponible antes de guardar.

### Engorde

- Vista tipo progreso: inicio, controles, bajas, cierre.
- Resumen visible: cantidad inicial, bajas, cantidad actual, pesos.

### Reportes

- Totales destacados arriba.
- Listas simples en movil.
- Tablas solo en desktop.
- Evitar graficos complejos en MVP v1.

### Configuracion y catalogos maestros

Patron obligatorio para spec `000-configuracion-base.md` y futuros ABM de maestras:

```text
Configuracion
  ├── Companias / Granjas (pantalla propia)
  └── Catalogos maestros (hub)
        └── Un catalogo = una pantalla ABM
```

Cada pantalla ABM debe incluir:

| Elemento | Regla |
|----------|-------|
| Navegacion | Hub → catalogo → listado; volver atras visible |
| Creacion | Boton principal; formulario no permanente en pantalla |
| Edicion | Boton `Editar` por registro; formulario precargado; `Guardar cambios` / `Cancelar` |
| Listado | Tarjetas en movil; busqueda por nombre |
| Filtros | Chips `Todos` / `Activos` / `Inactivos` |
| Inactivar | Confirmacion + toast de exito o error |
| Vacio | CTA humano (`Crear primer registro`) |

No apilar multiples catalogos con formularios en una sola pantalla.

## Feedback y toasts

Para **mensajes interactivos** tras acciones del usuario (guardar, inactivar, errores de negocio, conflictos), usar **toast** como patron estandar:

| Situacion | Patron |
|-----------|--------|
| Exito | Toast verde, mensaje breve, auto-cierre (~5 s) + boton Cerrar |
| Error de negocio / validacion | Toast rojo con `message` de la API (ej. `MAESTRA_EN_USO`) |
| Errores de carga de listado | Texto inline en la pantalla (no toast) |

Implementacion web: `ToastProvider` + `useToast()` en `apps/web/src/components/feedback/toast.tsx`.

No usar banners estaticos como unico feedback de mutaciones ABM cuando el usuario espera respuesta inmediata tras confirmar un dialogo.

## Microinteracciones

Permitidas:

- Animacion suave al guardar exitosamente.
- Skeletons al cargar datos.
- Transiciones cortas en cards y botones.
- Toasts claros con tono humano.

No permitidas:

- Animaciones largas.
- Efectos que bloqueen captura de datos.
- Colores excesivos sin significado.

## Copy UX

El texto debe ser claro, cercano y orientado a accion.

| Situacion | Ejemplo recomendado |
|-----------|---------------------|
| Guardado exitoso | `Consumo registrado correctamente.` |
| Sin datos | `Aun no hay lotes en esta granja.` |
| CTA vacio | `Crear primer lote` |
| Error stock | `No hay alimento suficiente en este almacen.` |
| Confirmacion | `Esta accion quedara en el historial. Indica el motivo.` |

Evitar lenguaje tecnico visible al usuario como `tenant`, `FK`, `constraint`, `payload`.

## Accesibilidad

- Contraste suficiente en texto y badges.
- Estados no deben depender solo del color; usar texto/icono.
- Campos con label visible.
- Navegacion por teclado en desktop.
- Targets tactiles minimos de `44px`.

## Responsive

| Breakpoint | Comportamiento |
|------------|----------------|
| Base | Mobile-first, cards, bottom nav flotante |
| `md` | Nav horizontal en header + contenido `max-w-5xl` |
| `lg` | Dashboard con columnas y paneles |

Componentes de navegacion: `apps/web/src/components/layout/app-nav.ts` + shell en `apps/web/src/app/(app)/layout.tsx`.

Hubs de catalogos: `HubSection` + `ConfigNavCard`.

## Reglas de implementacion UI

- Toda pantalla nueva debe revisarse en viewport 375px.
- Si una tabla no cabe en movil, se convierte en cards.
- Toda accion destructiva requiere confirmacion.
- Toda pantalla operativa muestra la granja activa.
- Formularios deben tener estado `loading`, `success`, `error` y `empty` cuando aplique.

## Criterios de aceptacion UX para MVP v1

- [x] Login usable en telefono.
- [x] Navegacion principal clara desde movil.
- [x] Navegacion principal clara desde desktop (`md+`).
- [x] Selector de granja visible cuando aplique.
- [x] Crear lote no requiere mas campos de los necesarios.
- [x] Registrar consumo muestra existencia disponible antes de guardar.
- [ ] Registrar peso y baja se puede hacer desde detalle de lote/engorde.
- [ ] Reportes basicos se leen bien en telefono.
- [x] Estados y errores son entendibles sin explicacion tecnica.
- [x] Configuracion usa hub de catalogos y una pantalla por maestra.
- [x] Listados de configuracion permiten buscar y filtrar por estado.
- [x] Inactivar registros de configuracion pide confirmacion.

## Decision

El producto debe sentirse como una herramienta moderna de gestion agropecuaria: seria con los datos, amable en el uso y visualmente atractiva. La UI no debe ser generica ni fria; debe tener identidad propia sin sacrificar rapidez operativa.
