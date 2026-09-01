export class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
  }

  async fetchWithTimeout(url, options = {}, token, timeout = 15000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Escriba-App-Sync',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(id);

      if (response.status === 401) {
        throw new Error('Sesión de GitHub expirada (401). Verificá tu token.');
      }

      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('La solicitud a GitHub tardó demasiado tiempo.');
      }
      throw error;
    }
  }

  decodeContent(base64) {
    if (!base64) return '';
    try {
      const cleanBase64 = base64.replace(/\s/g, '');
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch (e) {
      console.warn('UTF-8 decode failed, falling back:', e);
      return decodeURIComponent(escape(atob(base64)));
    }
  }

  encodeContent(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async getUserInfo(token) {
    const response = await this.fetchWithTimeout(`${this.baseUrl}/user`, {}, token);
    if (!response.ok) throw new Error(`Error en la API de GitHub: ${response.status}`);
    return await response.json();
  }

  async ensureRepository(token, username, repoName) {
    const checkRes = await this.fetchWithTimeout(
      `${this.baseUrl}/repos/${username}/${repoName}`,
      {},
      token
    );

    if (checkRes.status === 404) {
      const createRes = await this.fetchWithTimeout(
        `${this.baseUrl}/user/repos`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: repoName,
            description: 'Escriba Notes Backup & Cross-Device Sync',
            private: true,
            auto_init: true
          })
        },
        token
      );

      if (!createRes.ok) {
        throw new Error(`No se pudo crear el repositorio en GitHub (${createRes.status})`);
      }
    }
  }

  async getFile(token, username, repoName, path) {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/repos/${username}/${repoName}/contents/${path}`,
      {},
      token
    );

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Error obteniendo ${path}: ${response.status}`);

    const data = await response.json();
    return {
      content: this.decodeContent(data.content),
      sha: data.sha
    };
  }

  async updateFile(token, username, repoName, path, content, message, sha = null) {
    const body = {
      message,
      content: this.encodeContent(content)
    };

    if (sha) {
      body.sha = sha;
    } else {
      const existing = await this.getFile(token, username, repoName, path);
      if (existing) body.sha = existing.sha;
    }

    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/repos/${username}/${repoName}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify(body)
      },
      token
    );

    if (!response.ok) {
      throw new Error(`Error guardando ${path} en GitHub: ${response.status}`);
    }

    return await response.json();
  }

  async getRemoteData(token, username, repoName) {
    const data = { subjects: [], events: [], settings: {}, deletedItems: { notes: [], subjects: [] } };

    const files = [
      { path: 'data/subjects.json', key: 'subjects', default: [] },
      { path: 'data/events.json', key: 'events', default: [] },
      { path: 'data/settings.json', key: 'settings', default: {} },
      { path: 'data/deleted-items.json', key: 'deletedItems', default: { notes: [], subjects: [] } }
    ];

    for (const file of files) {
      try {
        const result = await this.getFile(token, username, repoName, file.path);
        if (result && result.content) {
          data[file.key] = JSON.parse(result.content);
        }
      } catch (e) {
        data[file.key] = file.default;
      }
    }

    return data;
  }

  mergeData(local, remote) {
    const localDeleted = local.deletedItems || { notes: [], subjects: [] };
    const remoteDeleted = remote.deletedItems || { notes: [], subjects: [] };

    const mergedDeleted = {
      notes: [...new Set([...(localDeleted.notes || []), ...(remoteDeleted.notes || [])])],
      subjects: [...new Set([...(localDeleted.subjects || []), ...(remoteDeleted.subjects || [])])]
    };

    const merged = {
      subjects: [...(remote.subjects || [])].filter((s) => !mergedDeleted.subjects.includes(s.id)),
      events: [...(remote.events || [])],
      settings: { ...(remote.settings || {}), ...(local.settings || {}) },
      deletedItems: mergedDeleted
    };

    (local.subjects || []).forEach((localSub) => {
      if (mergedDeleted.subjects.includes(localSub.id)) return;

      const idx = merged.subjects.findIndex((s) => s.id === localSub.id);
      if (idx >= 0) {
        const remoteSub = merged.subjects[idx];
        const mergedNotes = [...(remoteSub.notes || [])].filter(
          (n) => !mergedDeleted.notes.includes(n.id)
        );

        (localSub.notes || []).forEach((localNote) => {
          if (mergedDeleted.notes.includes(localNote.id)) return;

          const noteIdx = mergedNotes.findIndex((n) => n.id === localNote.id);
          if (noteIdx >= 0) {
            const localUpdate = new Date(localNote.updatedAt || localNote.createdAt || 0);
            const remoteUpdate = new Date(
              mergedNotes[noteIdx].updatedAt || mergedNotes[noteIdx].createdAt || 0
            );

            if (localUpdate > remoteUpdate) {
              mergedNotes[noteIdx] = localNote;
            }
          } else {
            mergedNotes.push(localNote);
          }
        });

        const localSubUpdate = new Date(localSub.lastModified || localSub.createdAt || 0);
        const remoteSubUpdate = new Date(remoteSub.lastModified || remoteSub.createdAt || 0);

        if (localSubUpdate > remoteSubUpdate) {
          merged.subjects[idx] = { ...localSub, notes: mergedNotes };
        } else {
          merged.subjects[idx] = { ...remoteSub, notes: mergedNotes };
        }
      } else {
        merged.subjects.push(localSub);
      }
    });

    (local.events || []).forEach((localEvent) => {
      const idx = merged.events.findIndex((e) => e.id === localEvent.id);
      if (idx === -1) {
        merged.events.push(localEvent);
      } else {
        const remoteEvent = merged.events[idx];
        const localUpdate = new Date(localEvent.updatedAt || localEvent.createdAt || 0);
        const remoteUpdate = new Date(remoteEvent.updatedAt || remoteEvent.createdAt || 0);
        if (localUpdate > remoteUpdate) {
          merged.events[idx] = localEvent;
        }
      }
    });

    return merged;
  }

  async uploadData(token, username, repoName, data) {
    await this.ensureRepository(token, username, repoName);

    const files = [
      { path: 'data/subjects.json', content: JSON.stringify(data.subjects || [], null, 2) },
      { path: 'data/events.json', content: JSON.stringify(data.events || [], null, 2) },
      { path: 'data/settings.json', content: JSON.stringify(data.settings || {}, null, 2) },
      {
        path: 'data/deleted-items.json',
        content: JSON.stringify(data.deletedItems || { notes: [], subjects: [] }, null, 2)
      }
    ];

    for (const file of files) {
      await this.updateFile(
        token,
        username,
        repoName,
        file.path,
        file.content,
        `Sync ${file.path}: ${new Date().toLocaleString('es-AR')}`
      );
    }
  }

  async sync(token, username, repoName, localData) {
    await this.ensureRepository(token, username, repoName);
    const remoteData = await this.getRemoteData(token, username, repoName);
    const mergedData = this.mergeData(localData, remoteData);
    await this.uploadData(token, username, repoName, mergedData);
    return mergedData;
  }
}

export const gitHubService = new GitHubService();
