# Escriba

**Escriba** is a modern, offline-first digital notebook designed for university students and power users. It offers a seamless experience across web and desktop, featuring Markdown and rich text editing, KaTeX math expressions, Mermaid UML diagrams, multi-language code blocks, academic schedule planning, and private cloud synchronization via GitHub.

---

## Key Features

### Powerful Text Editor
- **Rich Markdown & Shortcuts**: Full formatting toolbar and keyboard shortcuts for rapid note-taking.
- **Math & Science (KaTeX)**: Native inline and block LaTeX math rendering (`Ctrl + M`).
- **Interactive UML Diagrams**: Built-in **Mermaid.js** diagrams (Flowcharts, Class, Sequence, State, Mindmaps) with live preview and visual editor (`Ctrl + Alt + U`).
- **Embedded Code Blocks**: Powered by **Ace Editor** with syntax highlighting for dozens of programming languages (`Ctrl + Alt + C`).
- **Bidirectional Note Linking**: Link notes together using `[[Note Title]]` or `Ctrl + L` to build your personal knowledge base.
- **Interactive Knowledge Graph**: Visualize connections between your notes using Cytoscape.

### Academic Management
- **Subject Organization**: Organize notes into subjects with custom color palettes and Lucide icons.
- **Dashboard**: Smart greeting, next upcoming class alerts, and quick access to recent notes.
- **Class Schedules & Calendar**: Weekly timetable planner and exam/event tracking.

### Themes & Typography
- **Themes**: Choose from 9 curated color schemes categorized for any environment.
- **Custom Typography**: Support for *Inter*, *Roboto*, *Outfit*, and *JetBrains Mono* with adjustable font sizes.

### Offline-First & Private GitHub Sync
- **100% Offline**: All notes and data are persisted locally in your browser or desktop app (no proprietary cloud or tracking required).
- **GitHub Sync**: Connect with a GitHub Personal Access Token to use your own private repository (`escriba-notes`) as a secure, cross-device backend.
- **Local Disk Sync (Desktop)**: Read and write directly to a folder on your file system.

### Export & Share
- **Print & PDF**: Professional print styling for individual notes or complete subject notebooks.
- **Standalone HTML**: Export notes with all styles, KaTeX, and diagrams self-contained in a single `.html` file.
- **Quick Share**: Share notes via GitHub Gist or direct URL with a built-in QR code generator.

---

## Web Version

The web version runs directly in any modern browser with local storage persistence and full GitHub sync capabilities:

[**Open Escriba Web**](https://pinklittlekitty.github.io/Escriba/)

---

## Desktop App

The desktop version is ideal for offline lectures, low-connectivity study sessions, or users wanting a dedicated application window:

1. Download the latest nightly release from the [Releases](https://github.com/PinkLittleKitty/Escriba/releases) page.
2. Available for:
   - **Windows** (`.exe` installer or portable)
   - **Linux** (`.AppImage`)
   - **macOS** (`.dmg`)
3. Start taking notes!

---

## GitHub Synchronization

You can use your GitHub account as a free, private cloud backend:

1. In Escriba, open **Ajustes** (`Settings`) > **GitHub**.
2. Generate a [GitHub Personal Access Token](https://github.com/settings/tokens) with `repo` and `gist` scopes.
3. Enter your token and click **Conectar**.
4. Escriba will automatically create and sync with a private `escriba-notes` repository on your GitHub account.

---

## Local Development

### Prerequisites
- Node.js (>= 18 recommended)
- npm

### Setup
```bash
git clone https://github.com/PinkLittleKitty/Escriba.git
cd Escriba
npm install
```

### Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the Vite web development server |
| `npm test` | Run the test suite with Vitest |
| `npm run test:watch` | Run Vitest in interactive watch mode |
| `npm run build` | Validate tests and create production web build |
| `npm run electron:dev` | Start desktop app in Electron development mode |
| `npm run electron:build` | Package desktop app for your current operating system |

---

## Tech Stack

- **Frontend**: React 19, Vite, Zustand
- **Editor & Rendering**: KaTeX (Math), Mermaid.js (UML), Ace Builds (Code highlighting)
- **Graph Visualization**: Cytoscape.js
- **Desktop Runtime**: Electron & electron-builder
- **Mobile Runtime**: Capacitor
- **Icons**: Lucide React
- **Testing**: Vitest & React Testing Library

---

## License

Created by **[JustNeki](https://github.com/PinkLittleKitty)**. Open source under the MIT License.
