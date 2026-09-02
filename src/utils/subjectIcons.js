import {
  BookOpen,
  GraduationCap,
  Bookmark,
  FileText,
  Library,
  Folder,
  Compass,
  Layers,
  Lightbulb,
  Sparkles,
  Code,
  Terminal,
  Cpu,
  Binary,
  Database,
  Server,
  GitBranch,
  Network,
  Workflow,
  Bug,
  Calculator,
  Percent,
  Sigma,
  PieChart,
  BarChart2,
  Activity,
  TrendingUp,
  Divide,
  Atom,
  FlaskConical,
  Dna,
  Microscope,
  Zap,
  Flame,
  Heart,
  Stethoscope,
  Pill,
  Palette,
  Music,
  Globe,
  Languages,
  PenTool,
  Feather,
  History,
  MessageSquare,
  Briefcase,
  Scale,
  DollarSign,
  Target,
  Award,
  Shield,
  Building,
  Landmark
} from 'lucide-react';

export const SUBJECT_ICON_MAP = {
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
  bookmark: Bookmark,
  'file-text': FileText,
  library: Library,
  folder: Folder,
  compass: Compass,
  layers: Layers,
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  code: Code,
  terminal: Terminal,
  cpu: Cpu,
  binary: Binary,
  database: Database,
  server: Server,
  'git-branch': GitBranch,
  network: Network,
  workflow: Workflow,
  bug: Bug,
  calculator: Calculator,
  percent: Percent,
  sigma: Sigma,
  'pie-chart': PieChart,
  'bar-chart-2': BarChart2,
  activity: Activity,
  'trending-up': TrendingUp,
  divide: Divide,
  atom: Atom,
  'flask-conical': FlaskConical,
  dna: Dna,
  microscope: Microscope,
  zap: Zap,
  flame: Flame,
  heart: Heart,
  stethoscope: Stethoscope,
  pill: Pill,
  palette: Palette,
  music: Music,
  globe: Globe,
  languages: Languages,
  'pen-tool': PenTool,
  feather: Feather,
  history: History,
  'message-square': MessageSquare,
  briefcase: Briefcase,
  scale: Scale,
  'dollar-sign': DollarSign,
  target: Target,
  award: Award,
  shield: Shield,
  building: Building,
  landmark: Landmark
};

export const SUBJECT_ICON_CATEGORIES = [
  {
    id: 'all',
    name: 'Todos'
  },
  {
    id: 'general',
    name: 'General & Estudio',
    icons: [
      { id: 'book-open', label: 'Libro abierto', tags: ['estudio', 'lectura', 'apuntes', 'libro'] },
      { id: 'graduation-cap', label: 'Birrete', tags: ['universidad', 'carrera', 'grado', 'estudio'] },
      { id: 'library', label: 'Biblioteca', tags: ['libros', 'archivo', 'bibliografia'] },
      { id: 'bookmark', label: 'Marcador', tags: ['guardado', 'importante', 'tema'] },
      { id: 'file-text', label: 'Documento', tags: ['texto', 'hoja', 'apunte'] },
      { id: 'folder', label: 'Carpeta', tags: ['archivos', 'organizacion'] },
      { id: 'compass', label: 'Brújula', tags: ['orientacion', 'geografia', 'guia'] },
      { id: 'layers', label: 'Capas', tags: ['niveles', 'estructura', 'modular'] },
      { id: 'lightbulb', label: 'Idea', tags: ['creatividad', 'pensamiento', 'innovacion'] },
      { id: 'sparkles', label: 'Destellos', tags: ['especial', 'destacado', 'magia'] }
    ]
  },
  {
    id: 'tech',
    name: 'Sistemas & Computación',
    icons: [
      { id: 'code', label: 'Código', tags: ['programacion', 'desarrollo', 'software', 'algoritmos'] },
      { id: 'terminal', label: 'Consola', tags: ['terminal', 'bash', 'linux', 'comandos', 'so'] },
      { id: 'cpu', label: 'Procesador', tags: ['hardware', 'arquitectura', 'computadoras', 'chips'] },
      { id: 'binary', label: 'Binario', tags: ['datos', 'bits', 'logica', 'digital'] },
      { id: 'database', label: 'Base de datos', tags: ['sql', 'tablas', 'bd', 'almacenamiento'] },
      { id: 'server', label: 'Servidor', tags: ['redes', 'infraestructura', 'cloud', 'backend'] },
      { id: 'network', label: 'Redes', tags: ['internet', 'telecomunicaciones', 'protocolos'] },
      { id: 'git-branch', label: 'Ramas Git', tags: ['versionado', 'git', 'colaboracion'] },
      { id: 'workflow', label: 'Flujo de trabajo', tags: ['procesos', 'metodologias', 'scrum', 'agil'] },
      { id: 'bug', label: 'Testing / Bug', tags: ['pruebas', 'qa', 'debugging', 'calidad'] }
    ]
  },
  {
    id: 'math',
    name: 'Matemática & Datos',
    icons: [
      { id: 'calculator', label: 'Calculadora', tags: ['calculo', 'algebra', 'analisis', 'cuentas'] },
      { id: 'sigma', label: 'Sumatoria / Sigma', tags: ['estadistica', 'calculo', 'formulas', 'matematica'] },
      { id: 'percent', label: 'Porcentaje', tags: ['tasas', 'finanzas', 'probabilidad'] },
      { id: 'divide', label: 'División', tags: ['aritmetica', 'operaciones', 'fracciones'] },
      { id: 'pie-chart', label: 'Gráfico circular', tags: ['estadistica', 'datos', 'graficos', 'analisis'] },
      { id: 'bar-chart-2', label: 'Gráfico de barras', tags: ['metricas', 'visualizacion', 'reportes'] },
      { id: 'trending-up', label: 'Tendencia', tags: ['crecimiento', 'analisis', 'series'] },
      { id: 'activity', label: 'Actividad / Señal', tags: ['señales', 'fisica', 'frecuencia'] }
    ]
  },
  {
    id: 'science',
    name: 'Ciencias & Salud',
    icons: [
      { id: 'atom', label: 'Átomo', tags: ['fisica', 'quimica', 'ciencia', 'nuclear'] },
      { id: 'flask-conical', label: 'Matraz', tags: ['quimica', 'laboratorio', 'experimentos'] },
      { id: 'dna', label: 'ADN', tags: ['biologia', 'genetica', 'celular', 'vida'] },
      { id: 'microscope', label: 'Microscopio', tags: ['investigacion', 'microbiologia', 'medicina'] },
      { id: 'zap', label: 'Energía / Rayo', tags: ['electricidad', 'circuitos', 'potencia', 'fisica'] },
      { id: 'flame', label: 'Fuego / Termo', tags: ['termodinamica', 'calor', 'combustion'] },
      { id: 'heart', label: 'Corazón', tags: ['salud', 'anatomia', 'cardiologia', 'medicina'] },
      { id: 'stethoscope', label: 'Estetoscopio', tags: ['medicina', 'clinica', 'diagnostico'] },
      { id: 'pill', label: 'Medicación', tags: ['farmacologia', 'quimica', 'terapia'] }
    ]
  },
  {
    id: 'humanities',
    name: 'Humanidades & Arte',
    icons: [
      { id: 'palette', label: 'Paleta', tags: ['arte', 'diseño', 'dibujo', 'creatividad'] },
      { id: 'music', label: 'Música', tags: ['audio', 'sonido', 'armonia', 'partitura'] },
      { id: 'globe', label: 'Globo terráqueo', tags: ['geografia', 'sociedad', 'internacional', 'mundo'] },
      { id: 'languages', label: 'Idiomas', tags: ['ingles', 'linguistica', 'traduccion', 'lenguas'] },
      { id: 'pen-tool', label: 'Pluma de diseño', tags: ['diseño grafico', 'vectorial', 'arte'] },
      { id: 'feather', label: 'Pluma de escritura', tags: ['literatura', 'escritura', 'ensayos', 'poesia'] },
      { id: 'history', label: 'Historia', tags: ['tiempo', 'pasado', 'cronologia', 'historia'] },
      { id: 'message-square', label: 'Comunicación', tags: ['lengua', 'comunicacion', 'dialogo', 'debate'] }
    ]
  },
  {
    id: 'business',
    name: 'Economía & Gestión',
    icons: [
      { id: 'briefcase', label: 'Portafolio', tags: ['administracion', 'negocios', 'gestion', 'empresa'] },
      { id: 'scale', label: 'Balanza', tags: ['derecho', 'justicia', 'leyes', 'etica'] },
      { id: 'dollar-sign', label: 'Economía', tags: ['finanzas', 'dinero', 'costos', 'contabilidad'] },
      { id: 'target', label: 'Objetivos', tags: ['estrategia', 'marketing', 'metas'] },
      { id: 'award', label: 'Reconocimiento', tags: ['logros', 'calidad', 'merito'] },
      { id: 'shield', label: 'Seguridad / Escudo', tags: ['seguridad informatica', 'proteccion', 'auditoria'] },
      { id: 'building', label: 'Edificio / Empresa', tags: ['corporativo', 'organizacion', 'arquitectura'] },
      { id: 'landmark', label: 'Institución / Banco', tags: ['gobierno', 'banca', 'instituciones', 'estado'] }
    ]
  }
];

export const getAllSubjectIcons = () => {
  const iconList = [];
  const seen = new Set();

  SUBJECT_ICON_CATEGORIES.forEach((cat) => {
    if (cat.icons) {
      cat.icons.forEach((item) => {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          iconList.push({
            ...item,
            category: cat.id,
            categoryName: cat.name
          });
        }
      });
    }
  });

  return iconList;
};

export const getSubjectIconComponent = (iconId) => {
  if (!iconId || typeof iconId !== 'string') return null;
  return SUBJECT_ICON_MAP[iconId.toLowerCase().trim()] || null;
};

export const getSubjectInitials = (subject) => {
  if (!subject) return '';
  if (subject.code) return subject.code.slice(0, 3).toUpperCase();
  const name = subject.name || '';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'MA';
};

