export const UML_PRESET_CATEGORIES = [
  'Todos',
  'Flujos y Lógica',
  'Secuencia y APIs',
  'Estructuras y Datos',
  'Gestión y Mapas'
];

export const UML_PRESETS = [
  {
    id: 'flow-basic',
    label: 'Diagrama de Flujo',
    category: 'Flujos y Lógica',
    description: 'Flujo de decisiones y pasos de procesamiento',
    code: `graph TD
  Start([Inicio]) --> Step1[Paso 1: Procesar solicitud]
  Step1 --> Decision{¿Es válido?}
  Decision -- Sí --> Success[Guardar cambios]
  Decision -- No --> Error[Registrar error]
  Success --> End([Fin])
  Error --> End`,
  },
  {
    id: 'flow-subgraphs',
    label: 'Flujo con Subgrafos',
    category: 'Flujos y Lógica',
    description: 'Diagrama horizontal agrupado por componentes',
    code: `graph LR
  subgraph Frontend
    UI[Interfaz de Usuario] --> ClientState[Estado Local]
  end

  subgraph Backend
    API[REST / GraphQL API] --> Auth[Autenticación]
    API --> Controller[Controlador de Notas]
  end

  subgraph Persistencia
    DB[(Base de Datos)]
    Storage[Almacenamiento Local]
  end

  ClientState -->|HTTP / Sync| API
  Controller --> DB
  ClientState --> Storage`,
  },
  {
    id: 'sequence-auth',
    label: 'Diagrama de Secuencia',
    category: 'Secuencia y APIs',
    description: 'Interacción y llamadas entre participantes y servicios',
    code: `sequenceDiagram
  autonumber
  actor User as Usuario
  participant App as Escriba App
  participant Server as Backend / API
  participant DB as Base de Datos

  User->>App: Clic en Guardar
  activate App
  App->>Server: POST /api/notes (JSON)
  activate Server
  Server->>DB: INSERT INTO notes
  DB-->>Server: OK (id: 42)
  Server-->>App: 201 Created
  deactivate Server
  App-->>User: Notificación: Guardado con éxito
  deactivate App`,
  },
  {
    id: 'class-diagram',
    label: 'Diagrama de Clases',
    category: 'Estructuras y Datos',
    description: 'Modelos orientados a objetos con herencia y atributos',
    code: `classDiagram
  class Documento {
    +String id
    +String titulo
    +DateTime fechaCreacion
    +guardar()
    +exportarPDF()
  }
  class Nota {
    +String contenido
    +List~String~ tags
    +agregarTag(tag)
  }
  class DiagramaUML {
    +String codigoMermaid
    +renderizar()
  }
  Documento <|-- Nota
  Nota *-- DiagramaUML`,
  },
  {
    id: 'er-diagram',
    label: 'Entidad-Relación (ER)',
    category: 'Estructuras y Datos',
    description: 'Esquema relacional con tablas, claves y cardinalidad',
    code: `erDiagram
  USUARIO ||--o{ NOTA : crea
  MATERIA ||--o{ NOTA : agrupa
  NOTA ||--o{ ETIQUETA : tiene

  USUARIO {
    string id PK
    string email
    string nombre
  }
  MATERIA {
    string id PK
    string nombre
    string color
  }
  NOTA {
    string id PK
    string titulo
    string contenido
  }`,
  },
  {
    id: 'state-diagram',
    label: 'Diagrama de Estados',
    category: 'Flujos y Lógica',
    description: 'Transiciones de estado, ciclos de vida y eventos',
    code: `stateDiagram-v2
  [*] --> Borrador
  Borrador --> EnRevision: Enviar para revisión
  EnRevision --> Aprobado: Aprobar
  EnRevision --> Rechazado: Solicitar cambios
  Rechazado --> Borrador: Corregir
  Aprobado --> Publicado: Publicar
  Publicado --> Archivado: Archivar
  Archivado --> [*]`,
  },
  {
    id: 'mindmap',
    label: 'Mapa Mental (Mindmap)',
    category: 'Gestión y Mapas',
    description: 'Estructura jerárquica para lluvia de ideas y conceptos',
    code: `mindmap
  root((Escriba))
    Apuntes
      Markdown
      LaTeX / KaTeX
      UML Mermaid
    Organización
      Materias
      Horarios
      Calendario
    Sincronización
      GitHub Sync
      Offline-First`,
  },
  {
    id: 'gitgraph',
    label: 'Git Graph',
    category: 'Gestión y Mapas',
    description: 'Flujo de ramas, commits y merges estilo Git',
    code: `gitGraph
  commit id: "Initial commit"
  commit id: "Add editor"
  branch feature/mermaid
  checkout feature/mermaid
  commit id: "Support UML"
  commit id: "Live preview"
  checkout main
  commit id: "Update styles"
  merge feature/mermaid id: "Merge mermaid"
  commit id: "Release v1.0"`,
  },
  {
    id: 'gantt',
    label: 'Cronograma (Gantt)',
    category: 'Gestión y Mapas',
    description: 'Gestión de proyectos con fechas, dependencias y tareas',
    code: `gantt
  title Planificación de Estudio
  dateFormat YYYY-MM-DD
  section Módulo 1
    Lectura de apuntes   :done,    des1, 2026-11-01, 2026-11-04
    Práctica de ejercicios:active, des2, 2026-11-04, 3d
  section Examen Final
    Repaso general       :         des3, after des2, 2d
    Entrega de proyecto  :crit,    des4, after des3, 1d`,
  },
  {
    id: 'timeline',
    label: 'Línea de Tiempo',
    category: 'Gestión y Mapas',
    description: 'Eventos históricos o hitos secuenciales en el tiempo',
    code: `timeline
  title Evolución del Proyecto
  2024 : Planificación : Arquitectura base
  2025 : Soporte Markdown : Integración LaTeX : Modo Offline
  2026 : Diagramas Mermaid Live : Sincronización GitHub : Exportación PDF`,
  },
  {
    id: 'pie-chart',
    label: 'Gráfico de Torta (Pie)',
    category: 'Estructuras y Datos',
    description: 'Distribución porcentual de categorías y recursos',
    code: `pie title Distribución del Tiempo de Estudio
  "Programación" : 45
  "Matemática" : 25
  "Sistemas" : 20
  "Diseño" : 10`,
  },
  {
    id: 'user-journey',
    label: 'User Journey',
    category: 'Gestión y Mapas',
    description: 'Experiencia y satisfacción de usuario paso a paso',
    code: `journey
  title Experiencia de Usuario en Escriba
  section Crear Nota
    Abrir app: 5: Usuario
    Crear apunte: 5: Usuario
    Escribir contenido: 4: Usuario
  section Diseñar UML
    Insertar bloque Mermaid: 5: Usuario
    Ver render en vivo: 5: Usuario
    Exportar a PNG: 5: Usuario`,
  },
];
