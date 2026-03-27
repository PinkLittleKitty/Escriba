# 📚 Escriba

Escriba is a modern, offline-ready digital notebook designed for students and power users. It offers a seamless experience across web and desktop, with powerful synchronization features.

## ✨ Key Features

- 🌐 **Web First** - Recommended version for most users. Access your notes anywhere via GitHub Pages.
- 💾 **100% Offline** - Data is saved locally in your browser or desktop app (no cloud required).
- 🔄 **GitHub Sync** - Sync your notes across devices using your own private GitHub repository as a secure backend.
- 🖥️ **Desktop App** - Optimized for offline use at university or areas with poor connection.
- 🎨 **Rich Aesthetics** - 8 beautiful themes including Dark, Light, Cyberpunk, and more.
- 📝 **Advanced Editing** - Support for UML diagrams, code blocks, and rich text.
- 📊 **Smart Statistics** - Track your word counts, notes, and subjects.
- 🚀 **Nightly Builds** - Automatically generated binaries on every update.

## 🌐 Web Version (Recommended)

The web version is the easiest way to use Escriba. Your notes are saved in your browser's local storage and can be synced to GitHub for cross-device access.

👉 [**Visit Escriba Web**](https://pinklittlekitty.github.io/Escriba/)

## 🖥️ Desktop App

The desktop version is recommended for users who need a dedicated window or work frequently without an internet connection.

1. Go to the [Releases](https://github.com/PinkLittleKitty/Escriba/releases) section.
2. Download the latest **Nightly** build for your OS (`.exe`, `.AppImage`, or `.dmg`).
3. Run the installer and start taking notes!

## 🔄 GitHub Synchronization

Escriba allows you to use your own GitHub account as a private cloud:

1. Go to **Settings** (Opciones) in the app.
2. Connect your GitHub account using a **Personal Access Token**.
3. Escriba will create a private repository named `escriba-notes` to safely store and sync your data across all your devices.

## 🛠️ Local Development

If you want to run or build the app locally:

1. **Clone the repository**
   ```bash
   git clone https://github.com/PinkLittleKitty/Escriba
   cd Escriba
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run Electron app**
   ```bash
   npm run electron:start
   ```

4. **Build for production**
   ```bash
   npm run electron:build
   ```

## 🏗️ Build Pipeline

This project uses **GitHub Actions** to automatically build and release the desktop app on every push to the `main` branch.