# Escriba - Tu Cuaderno Digital

Escriba es una aplicación de escritorio para tomar y organizar apuntes universitarios, diseñada para funcionar como una carpeta real donde podés organizar tus materias y apuntes.

## Características

- 📚 **Organización por materias**: Creá carpetas para cada materia
- 📝 **Editor rico**: Formato de texto, listas, resaltado y más
- 🔍 **Búsqueda rápida**: Encontrá cualquier apunte al instante
- ⭐ **Favoritos**: Marcá tus apuntes más importantes
- 💾 **Auto-guardado**: Tus apuntes se guardan automáticamente
- 🎨 **Temas personalizables**: Elegí el tema que más te guste
- 📤 **Exportar/Importar**: Respaldá y compartí tu carpeta completa

## Instalación para Desarrollo

### Requisitos
- Node.js (versión 16 o superior)
- npm o yarn

### Pasos

1. **Clonar o descargar el proyecto**
   ```bash
   git clone <tu-repositorio>
   cd escriba
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Ejecutar en modo desarrollo**
   ```bash
   npm start
   ```

## Crear Ejecutable para Windows

### Opción 1: Instalador NSIS (Recomendado)
```bash
npm run build-win
```
Esto creará un instalador `.exe` en la carpeta `dist/`

### Opción 2: Ejecutable portable
```bash
npm run dist
```

## Scripts Disponibles

- `npm start` - Ejecuta la aplicación en modo desarrollo
- `npm run build` - Construye la aplicación para todas las plataformas
- `npm run build-win` - Construye solo para Windows
- `npm run dist` - Crea distribución sin publicar

## Estructura del Proyecto

```
escriba/
├── assets/           # Iconos y recursos
├── dist/            # Archivos de distribución (generados)
├── node_modules/    # Dependencias (generadas)
├── index.html       # Interfaz principal
├── script.js        # Lógica de la aplicación
├── styles.css       # Estilos
├── main.js          # Proceso principal de Electron
├── preload.js       # Script de preload para seguridad
└── package.json     # Configuración del proyecto
```

## Personalización

### Cambiar el icono
Reemplazá el archivo `assets/icon.svg` con tu propio icono y ejecutá el build nuevamente.

### Modificar la información de la aplicación
Editá el archivo `package.json` para cambiar:
- Nombre de la aplicación
- Versión
- Descripción
- Autor

## Tecnologías Utilizadas

- **Electron** - Framework para aplicaciones de escritorio
- **HTML/CSS/JavaScript** - Interfaz y lógica
- **LocalStorage** - Almacenamiento local de datos

## Contribuir

1. Fork el proyecto
2. Creá una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrí un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT - mirá el archivo [LICENSE](LICENSE) para más detalles.

## Soporte

Si encontrás algún problema o tenés sugerencias, por favor abrí un issue en el repositorio.

---

**¡Disfrutá organizando tus apuntes con Escriba!** 📚✨