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

### Estilo general

- Moderno, limpio y con detalles organicos asociados al campo.
- Tarjetas con bordes redondeados, sombras suaves y acentos de color.
- Iconos simples para acciones frecuentes: lotes, alimento, peso, inventario, reportes.
- Ilustraciones pequenas solo en estados vacios o onboarding, no en pantallas operativas densas.

### Paleta sugerida

| Uso | Color sugerido | Intencion |
|-----|----------------|-----------|
| Primario | Verde profundo | Campo, vida, productividad |
| Secundario | Amarillo/maiz | Energia, alimento, calidez |
| Acento | Coral/naranja | Acciones llamativas y microdetalles |
| Fondo | Blanco roto / verde muy suave | Descanso visual |
| Texto | Gris grafito | Lectura clara |
| Exito | Verde | Operacion correcta |
| Alerta | Ambar | Atencion sin urgencia critica |
| Error | Rojo controlado | Error o anulacion |
| Info | Azul suave | Datos informativos |

Ejemplo de tokens iniciales:

```text
primary:        #1F7A4D
primary-dark:   #145A38
secondary:      #F2C94C
accent:         #F97316
background:     #F7FAF5
surface:        #FFFFFF
text:           #263238
muted:          #6B7280
success:        #22C55E
warning:        #F59E0B
danger:         #EF4444
info:           #3B82F6
```

La paleta final se implementara como variables CSS/Tailwind durante el scaffold.

## Tipografia

- Fuente principal: sans-serif moderna y legible.
- Recomendadas: `Inter`, `Geist`, `Nunito Sans` o similar.
- Para una sensacion mas amable y menos fria, preferir `Nunito Sans` o `Inter` con pesos suaves.
- Tamano minimo en formularios moviles: `16px`.

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

- Una columna en movil.
- Labels arriba del campo.
- **Campos obligatorios:** marcar con asterisco rojo (`*`) en el label; mostrar leyenda `Los campos marcados con * son obligatorios` al inicio del formulario.
- **Validacion en cliente:** si el usuario intenta guardar con un obligatorio vacio, resaltar el campo (borde rojo) y mostrar el mensaje `Este campo es obligatorio.` debajo del input; no enviar la peticion hasta corregir.
- Campos opcionales no llevan asterisco ni texto `(opcional)` en el label; su opcionalidad se infiere de la spec funcional.
- Agrupar campos por secciones cortas.
- Boton principal sticky abajo en formularios largos.
- Confirmaciones para cerrar, anular o registrar bajas.

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
| Base | Mobile-first, cards, bottom nav |
| `md` | Sidebar, tablas simples |
| `lg` | Dashboard con columnas y paneles |

## Reglas de implementacion UI

- Toda pantalla nueva debe revisarse en viewport 375px.
- Si una tabla no cabe en movil, se convierte en cards.
- Toda accion destructiva requiere confirmacion.
- Toda pantalla operativa muestra la granja activa.
- Formularios deben tener estado `loading`, `success`, `error` y `empty` cuando aplique.

## Criterios de aceptacion UX para MVP v1

- [ ] Login usable en telefono.
- [ ] Navegacion principal clara desde movil.
- [ ] Selector de granja visible cuando aplique.
- [ ] Crear lote no requiere mas campos de los necesarios.
- [ ] Registrar consumo muestra existencia disponible antes de guardar.
- [ ] Registrar peso y baja se puede hacer desde detalle de lote/engorde.
- [ ] Reportes basicos se leen bien en telefono.
- [ ] Estados y errores son entendibles sin explicacion tecnica.
- [ ] Configuracion usa hub de catalogos y una pantalla por maestra.
- [ ] Listados de configuracion permiten buscar y filtrar por estado.
- [ ] Inactivar registros de configuracion pide confirmacion.

## Decision

El producto debe sentirse como una herramienta moderna de gestion agropecuaria: seria con los datos, amable en el uso y visualmente atractiva. La UI no debe ser generica ni fria; debe tener identidad propia sin sacrificar rapidez operativa.
