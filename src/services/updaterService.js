const REPO_OWNER = 'PinkLittleKitty';
const REPO_NAME = 'Escriba';
const GITHUB_API_BASE = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

const APP_BUILD_TIMESTAMP = new Date('2026-04-07T01:00:30-03:00').getTime();

export const updaterService = {
  async getAppVersion() {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { ipcRenderer } = window.require('electron');
        const info = await ipcRenderer.invoke('get-app-version');
        if (info && info.version) {
          return {
            version: info.version,
            name: info.name || 'Escriba',
            isElectron: true,
            isPackaged: !!info.isPackaged
          };
        }
      } catch (err) {
        console.warn('Error fetching Electron version info:', err);
      }
    }

    return {
      version: '1.0.0-nightly',
      name: 'Escriba',
      isElectron: false,
      isPackaged: false
    };
  },

  async checkForUpdates({ tag = 'nightly' } = {}) {
    try {
      const url = tag === 'latest'
        ? `${GITHUB_API_BASE}/releases/latest`
        : `${GITHUB_API_BASE}/releases/tags/${tag}`;

      const res = await fetch(url, {
        headers: {
          Accept: 'application/vnd.github.v3+json'
        }
      });

      if (!res.ok) {
        throw new Error(`GitHub API returned status ${res.status}`);
      }

      const release = await res.json();
      const publishedAt = new Date(release.published_at);
      const appInfo = await this.getAppVersion();

      const isNewer = publishedAt.getTime() > (APP_BUILD_TIMESTAMP + 5 * 60 * 1000);

      const assets = (release.assets || []).map((asset) => ({
        name: asset.name,
        downloadUrl: asset.browser_download_url,
        size: asset.size,
        contentType: asset.content_type
      }));

      let primaryDownloadUrl = release.html_url || `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/tag/${tag}`;
      const exeAsset = assets.find((a) => a.name.endsWith('.exe'));
      const appImageAsset = assets.find((a) => a.name.endsWith('.AppImage'));
      const debAsset = assets.find((a) => a.name.endsWith('.deb'));
      const apkAsset = assets.find((a) => a.name.endsWith('.apk'));

      return {
        hasUpdate: isNewer,
        currentVersion: appInfo.version,
        release: {
          id: release.id,
          name: release.name || release.tag_name,
          tagName: release.tag_name,
          publishedAt: release.published_at,
          publishedAtFormatted: publishedAt.toLocaleString('es-AR', {
            dateStyle: 'medium',
            timeStyle: 'short'
          }),
          body: release.body || 'No hay notas de versión disponibles.',
          htmlUrl: release.html_url,
          downloadUrl: primaryDownloadUrl,
          exeUrl: exeAsset?.downloadUrl,
          appImageUrl: appImageAsset?.downloadUrl,
          debUrl: debAsset?.downloadUrl,
          apkUrl: apkAsset?.downloadUrl,
          assets
        }
      };
    } catch (err) {
      console.error('Error checking for updates:', err);
      return {
        hasUpdate: false,
        error: err.message
      };
    }
  },

  openDownloadUrl(url) {
    if (typeof window !== 'undefined' && window.require) {
      try {
        const { shell } = window.require('electron');
        shell.openExternal(url);
        return;
      } catch (e) { }
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
