const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
            if (match) {
                const key = match[1];
                let value = match[2] || '';
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
                if (!process.env[key]) process.env[key] = value.trim();
            }
        });
    }
} catch (e) { }

if (process.platform === 'linux') {
    app.commandLine.appendSwitch('no-sandbox');
    app.commandLine.appendSwitch('disable-features', 'Vulkan');
}

app.userAgentFallback =
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, 'icon.png'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    });

    win.maximize();

    const indexPath = path.join(__dirname, 'dist', 'index.html');
    if (process.env.VITE_DEV_SERVER_URL) {
        win.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else if (fs.existsSync(indexPath)) {
        win.loadFile(indexPath);
    } else {
        win.loadFile('index.html');
    }

    win.setMenu(null);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('get-default-local-path', () => {
    return path.join(app.getPath('userData'), 'data');
});

ipcMain.handle('select-local-folder', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Seleccionar carpeta para guardar apuntes de Escriba'
    });
    if (!result.canceled && result.filePaths.length > 0) {
        return result.filePaths[0];
    }
    return null;
});

ipcMain.handle('open-local-folder', async (event, folderPath) => {
    const targetPath = folderPath || path.join(app.getPath('userData'), 'data');
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
    }
    await shell.openPath(targetPath);
    return true;
});

ipcMain.handle('get-app-version', () => {
    return {
        version: app.getVersion(),
        name: app.getName(),
        isPackaged: app.isPackaged
    };
});

ipcMain.handle('github-oauth-token', async (event, params) => {
    try {
        const { proxy_url, ...body } = params;

        if (process.env.GITHUB_CLIENT_SECRET) {
            body.client_secret = process.env.GITHUB_CLIENT_SECRET;
            const response = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            return await response.json();
        }

        const endpoint =
            (proxy_url && !proxy_url.startsWith('/'))
                ? proxy_url
                : (process.env.VITE_GITHUB_AUTH_PROXY_URL || 'https://escriba-auth.santyfisela.workers.dev/');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        return await response.json();
    } catch (err) {
        return { error: err.message };
    }
});

ipcMain.handle('github-oauth-open-popup', async (event, { authUrl, redirectUri }) => {
    return new Promise((resolve, reject) => {
        const standardUserAgent =
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

        const authWindow = new BrowserWindow({
            width: 650,
            height: 750,
            title: 'Iniciar sesión con GitHub',
            autoHideMenuBar: true,
            backgroundColor: '#0d1117',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: false
            }
        });

        authWindow.webContents.setUserAgent(standardUserAgent);

        let handled = false;

        const checkUrl = (targetUrl) => {
            if (!targetUrl || handled) return;
            try {
                const parsedUrl = new URL(targetUrl);
                const hasCode = parsedUrl.searchParams.has('code');
                const hasState = parsedUrl.searchParams.has('state');
                const hasError = parsedUrl.searchParams.has('error') || parsedUrl.searchParams.has('error_description');

                const isCallback =
                    targetUrl.startsWith(redirectUri) ||
                    (hasCode && hasState) ||
                    hasError;

                if (isCallback) {
                    const code = parsedUrl.searchParams.get('code');
                    const state = parsedUrl.searchParams.get('state');
                    const error = parsedUrl.searchParams.get('error_description') || parsedUrl.searchParams.get('error');

                    if (code) {
                        handled = true;
                        authWindow.close();
                        resolve({ code, state });
                    } else if (error) {
                        handled = true;
                        authWindow.close();
                        reject(new Error(error));
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        authWindow.webContents.on('will-redirect', (e, url) => checkUrl(url));
        authWindow.webContents.on('will-navigate', (e, url) => checkUrl(url));
        authWindow.webContents.on('did-navigate', (e, url) => checkUrl(url));

        authWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
            if (!handled && desc !== 'ERR_ABORTED') {
                console.error('GitHub Auth Window failed to load:', code, desc, url);
            }
        });

        authWindow.webContents.on('render-process-gone', (e, details) => {
            console.error('GitHub Auth Window render process gone:', details);
        });

        authWindow.on('closed', () => {
            if (!handled) {
                reject(new Error('Ventana de autenticación cerrada por el usuario.'));
            }
        });

        authWindow.loadURL(authUrl).catch((err) => {
            if (!handled) {
                console.error('Error in authWindow.loadURL:', err);
            }
        });
    });
});


