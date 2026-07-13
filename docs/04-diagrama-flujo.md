# Diagrama de Flujo General

Este documento resume visualmente el flujo funcional definido en las especificaciones SDD del proyecto.

Si usas un visor Mermaid que espera solo sintaxis Mermaid, abre `04-diagrama-flujo-general.mmd`. Este archivo `.md` esta pensado para previsualizacion Markdown.

## Flujo general del sistema

```mermaid
flowchart TD
    A[Inicio del sistema] --> B[Configuracion base]
    B --> B1[Companias]
    B --> B2[Granjas]
    B --> B3[Maestras]
    B --> B4[Ubicaciones y almacenes]

    B --> C[Seguridad]
    C --> C1[Usuarios]
    C --> C2[Perfiles globales]
    C --> C3[Permisos]
    C --> C4[Acceso por granja]

    C --> D[Gestion productiva base]
    D --> D1[Animales individuales]
    D --> D2[Lotes]
    D --> D3[Movimientos de ubicacion]

    D1 --> E[Sanidad]
    D2 --> E
    E --> E1[Veterinario tratante]
    E --> E2[Vacunaciones]
    E --> E3[Enfermedades y diagnosticos]
    E --> E4[Tratamientos]
    E --> E5[Controles sanitarios]

    B4 --> F[Inventario de alimentos]
    F --> F1[Alimentos]
    F --> F2[Proveedores]
    F --> F3[Entradas]
    F --> F4[Salidas y ajustes]
    F --> F5[Existencias]

    F --> G[Consumo de alimento]
    D2 --> G
    G --> G2[Consumo por lote]
    G --> G3[Descuento de inventario]

    D1 --> H[Reproduccion]
    H --> H1[Montas e inseminaciones]
    H1 --> H2[Gestacion]
    H2 --> H3[Partos]
    H3 --> H4[Destete]

    D2 --> I[Engorde]
    I --> I1[Inicio de engorde]
    I --> I2[Bajas]
    I --> I3[Controles de peso]
    I --> I4[Cierre de engorde]

    H --> R[Reportes]
    E --> R
    G --> R
    F --> R
    I --> R
    D1 --> R
    D2 --> R

    R --> R1[Reportes de reproduccion]
    R --> R2[Reportes de alimentacion]
    R --> R3[Reportes de sanidad]
    R --> R4[Reportes de engorde]

    Z[Auditoria y trazabilidad] -.-> B
    Z -.-> C
    Z -.-> D
    Z -.-> E
    Z -.-> F
    Z -.-> G
    Z -.-> H
    Z -.-> I
    Z -.-> R
```

## Flujo reproductivo

```mermaid
flowchart TD
    A[Animal hembra reproductora] --> B[Ciclo reproductivo]
    B --> B1[Uno o varios servicios]
    B1 --> B2[Monta o inseminacion]
    B2 --> C[Fecha probable de parto]
    C --> D[Confirmacion]
    D -->|Dudosa| C
    D -->|Positiva| E[Gestacion activa]
    D -->|Negativa| F[Fallo no gestante]
    E --> G[Controles de gestacion]
    G -->|Aborto o reabsorcion| F
    G --> H[Parto]
    B -->|Parto no confirmado| H
    H --> H1[Nacidos vivos]
    H --> H2[Nacidos muertos]
    H --> H3[Crias debiles]
    H1 --> I0[Bajas de lactancia]
    H --> I[Destete total]
    I --> I1[Cantidad destetada]
    I0 --> I2[Mortalidad durante lactancia]
    I --> I3[Peso al destete]
    I --> J[Historial reproductivo consolidado]
```

## Flujo de engorde

```mermaid
flowchart TD
    LoteActivo["Lote activo con finalidad Engorde"] --> Inicio[Inicio manual de engorde]
    Inicio --> PesoInicial["Control inicial opcional"]
    Inicio --> Proceso[Engorde en curso]
    Proceso --> Consumo[Consumo de alimento]
    Consumo --> Inventario[Descuento de inventario]
    Proceso --> PesoIntermedio[Controles intermedios]
    Proceso --> Baja[Bajas]
    Baja --> Cantidad["Cantidad actual calculada"]
    Baja --> Mortalidad["Mortalidad si el motivo aplica"]
    Cantidad --> Cierre[Cierre de engorde]
    PesoIntermedio --> Cierre
    Consumo --> Cierre
    Cierre --> PesoFinal["Control final opcional"]
    Cierre --> LoteCerrado[Lote cerrado]
    Cierre --> Reporte[Reporte de engorde]
    Cierre -->|"Anulacion con motivo"| Reapertura["Engorde y lote reabiertos"]
    Reapertura --> Proceso
    Reporte --> Duracion[Duracion]
    Reporte --> Ganancia[Ganancia de peso]
    Reporte --> Conversion[Conversion alimenticia basica]
    Reporte --> Resultado[Resultado productivo]
```

## Flujo de alimentacion e inventario

```mermaid
flowchart TD
    A[Alimento maestro] --> B[Entrada de inventario]
    B --> C[Existencia por almacen]
    C --> D[Consumo de alimento]
    D --> D2[Lote]
    D --> E[Movimiento de inventario tipo consumo]
    E --> F[Existencia actualizada]
    D --> G[Reporte de alimentacion]
    F --> G
    G --> G2[Consumo por lote]
    G --> G3[Consumo por alimento]
    G --> G4[Costos]
```

## Flujo sanitario

```mermaid
flowchart TD
    A[Animal o lote] --> B[Veterinario tratante]
    A --> C[Evento sanitario]
    C --> C1[Vacunacion]
    C --> C2[Diagnostico y caso]
    C --> C3[Tratamiento]
    C --> C4[Control preventivo]
    C2 --> D[Casos activos]
    C3 --> D
    C3 --> R[Periodo de retiro]
    C --> E[Historial sanitario consolidado]
    B --> E
    E --> F[Reporte sanitario]
    F --> F1[Vacunaciones]
    F --> F2[Enfermedades]
    F --> F3[Tratamientos]
    F --> F4[Eventos por veterinario]
    F --> F5[Proximas vacunaciones y retiros]
```

## Reglas transversales

- Todo dato productivo pertenece a una granja.
- Toda granja pertenece a una compania.
- Todo acceso debe validar usuario, perfil, compania y granjas permitidas.
- Las maestras definen opciones reutilizables.
- Los eventos y movimientos registran hechos historicos con fecha.
- Los eventos importantes no se eliminan fisicamente; se anulan con auditoria.
- Los reportes excluyen anulados por defecto.
