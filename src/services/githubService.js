export class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
  }

  async fetchWithTimeout(url, options = {}, token, timeout = 30000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      ...options.headers
    };

    try {
      const response = await fetch(url, {
        cache: 'no-store',
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
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  async getFile(token, username, repoName, path) {
    const t = Date.now();
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/repos/${username}/${repoName}/contents/${path}?_t=${t}`,
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

  async updateFile(token, username, repoName, path, content, message, sha = null, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        let fileSha = sha;
        if (!fileSha) {
          const existing = await this.getFile(token, username, repoName, path);
          if (existing) fileSha = existing.sha;
        }

        const body = {
          message: message || `Sync ${path} - ${new Date().toISOString()}`,
          content: this.encodeContent(content)
        };
        if (fileSha) body.sha = fileSha;

        const response = await this.fetchWithTimeout(
          `${this.baseUrl}/repos/${username}/${repoName}/contents/${path}`,
          {
            method: 'PUT',
            body: JSON.stringify(body)
          },
          token
        );

        if (response.status === 409) {
          if (attempt < retries) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
            continue;
          }
        }

        if (!response.ok) {
          throw new Error(`Error guardando ${path} en GitHub: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        if (attempt === retries) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async uploadSingleNote(token, username, repoName, note, subjectId) {
    const noteData = {
      ...note,
      subjectId
    };
    return await this.updateFile(
      token,
      username,
      repoName,
      `data/notes/${note.id}.json`,
      JSON.stringify(noteData, null, 2),
      `Update note ${note.title || note.id} (${new Date().toLocaleString('es-AR')})`
    );
  }

  async getBranchHead(token, username, repoName, branch = 'main') {
    const t = Date.now();
    let response = await this.fetchWithTimeout(
      `${this.baseUrl}/repos/${username}/${repoName}/git/refs/heads/${branch}?_t=${t}`,
      {},
      token
    );

    if (!response.ok && branch === 'main') {
      response = await this.fetchWithTimeout(
        `${this.baseUrl}/repos/${username}/${repoName}/git/refs/heads/master?_t=${t}`,
        {},
        token
      );
    }

    if (!response.ok) throw new Error(`Error al obtener head de la rama: ${response.status}`);
    const data = await response.json();
    return { sha: data.object.sha, branch: response.url.includes('/master') ? 'master' : 'main' };
  }

  async getTreeSha(token, username, repoName, commitSha) {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/repos/${username}/${repoName}/git/commits/${commitSha}`,
      {},
      token
    );
    if (!response.ok) throw new Error(`Error al obtener tree sha: ${response.status}`);
    const data = await response.json();
    return data.tree.sha;
  }

  async getTreeFiles(token, username, repoName, treeSha) {
    try {
      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/repos/${username}/${repoName}/git/trees/${treeSha}?recursive=1`,
        {},
        token
      );
      if (!response.ok) return new Set();
      const data = await response.json();
      return new Set((data.tree || []).map((item) => item.path));
    } catch {
      return new Set();
    }
  }

  async createTree(token, username, repoName, files, baseTreeSha) {
    const tree = files.map((file) => {
      if (file.sha === null) {
        return {
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: null
        };
      }
      return {
        path: file.path,
        mode: '100644',
        type: 'blob',
        content: file.content
      };
    });

    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/repos/${username}/${repoName}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree
        })
      },
      token,
      30000
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Error al crear árbol de archivos: ${response.status} - ${err.message || ''}`);
    }

    const data = await response.json();
    return data.sha;
  }

  async createCommit(token, username, repoName, message, treeSha, parentSha) {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/repos/${username}/${repoName}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify({
          message,
          tree: treeSha,
          parents: parentSha ? [parentSha] : []
        })
      },
      token
    );

    if (!response.ok) throw new Error(`Error al crear commit: ${response.status}`);
    const data = await response.json();
    return data.sha;
  }

  async updateRef(token, username, repoName, branch, commitSha, force = true) {
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/repos/${username}/${repoName}/git/refs/heads/${branch}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          sha: commitSha,
          force
        })
      },
      token
    );

    if (!response.ok) throw new Error(`Error al actualizar referencia ${branch}: ${response.status}`);
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

  normalizeDeletedItems(raw) {
    if (!raw) return { notes: [], subjects: [] };
    if (Array.isArray(raw)) {
      return {
        notes: raw.filter((d) => d.type === 'note').map((d) => d.item?.id || d.id).filter(Boolean),
        subjects: raw.filter((d) => d.type === 'subject').map((d) => d.item?.id || d.id).filter(Boolean)
      };
    }
    return {
      notes: Array.isArray(raw.notes) ? raw.notes : [],
      subjects: Array.isArray(raw.subjects) ? raw.subjects : []
    };
  }

  mergeData(local, remote) {
    const localDeleted = this.normalizeDeletedItems(local.deletedItems);
    const remoteDeleted = this.normalizeDeletedItems(remote.deletedItems);

    const mergedDeleted = {
      notes: [...new Set([...localDeleted.notes, ...remoteDeleted.notes])],
      subjects: [...new Set([...localDeleted.subjects, ...remoteDeleted.subjects])]
    };

    const merged = {
      subjects: [...(remote.subjects || [])]
        .filter((s) => !mergedDeleted.subjects.includes(s.id))
        .map((s) => ({
          ...s,
          notes: Array.isArray(s.notes) ? s.notes.filter((n) => !mergedDeleted.notes.includes(n.id)) : []
        })),
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

        const localSubTime = new Date(
          localSub.updatedAt || localSub.lastModified || localSub.createdAt || 0
        ).getTime();
        const remoteSubTime = new Date(
          remoteSub.updatedAt || remoteSub.lastModified || remoteSub.createdAt || 0
        ).getTime();

        if (localSubTime > remoteSubTime) {
          merged.subjects[idx] = {
            ...remoteSub,
            ...localSub,
            icon: localSub.icon !== undefined ? localSub.icon : (remoteSub.icon || null),
            notes: mergedNotes,
            updatedAt: localSub.updatedAt || localSub.lastModified || new Date().toISOString(),
            lastModified: localSub.lastModified || localSub.updatedAt || new Date().toISOString()
          };
        } else if (remoteSubTime > localSubTime) {
          merged.subjects[idx] = {
            ...localSub,
            ...remoteSub,
            icon: remoteSub.icon !== undefined ? remoteSub.icon : (localSub.icon || null),
            notes: mergedNotes,
            updatedAt: remoteSub.updatedAt || remoteSub.lastModified || new Date().toISOString(),
            lastModified: remoteSub.lastModified || remoteSub.updatedAt || new Date().toISOString()
          };
        } else {
          const resolvedIcon =
            localSub.icon !== undefined && localSub.icon !== null
              ? localSub.icon
              : (remoteSub.icon !== undefined ? remoteSub.icon : null);
          merged.subjects[idx] = {
            ...remoteSub,
            ...localSub,
            icon: resolvedIcon,
            notes: mergedNotes
          };
        }
      } else {
        merged.subjects.push({
          ...localSub,
          notes: Array.isArray(localSub.notes)
            ? localSub.notes.filter((n) => !mergedDeleted.notes.includes(n.id))
            : []
        });
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

  async deleteFile(token, username, repoName, path, message = null) {
    try {
      const existing = await this.getFile(token, username, repoName, path);
      if (!existing) return true;

      const body = {
        message: message || `Delete ${path} - ${new Date().toISOString()}`,
        sha: existing.sha
      };

      const response = await this.fetchWithTimeout(
        `${this.baseUrl}/repos/${username}/${repoName}/contents/${path}`,
        {
          method: 'DELETE',
          body: JSON.stringify(body)
        },
        token
      );

      return response.ok;
    } catch {
      return false;
    }
  }

  async uploadData(token, username, repoName, data, onProgress = null) {
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

    const noteIds = [];
    for (const subject of data.subjects || []) {
      if (Array.isArray(subject.notes)) {
        for (const note of subject.notes) {
          noteIds.push(note.id);
          const noteData = {
            ...note,
            subjectId: subject.id
          };
          files.push({
            path: `data/notes/${note.id}.json`,
            content: JSON.stringify(noteData, null, 2)
          });
        }
      }
    }

    files.push({
      path: 'data/notes-index.json',
      content: JSON.stringify(noteIds, null, 2)
    });

    const currentNoteFilePaths = new Set(noteIds.map((id) => `data/notes/${id}.json`));

    const maxRetries = 2;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (onProgress) onProgress(15, 'Verificando rama de GitHub...');
        const { sha: headSha, branch } = await this.getBranchHead(token, username, repoName);
        const baseTreeSha = await this.getTreeSha(token, username, repoName, headSha);

        const existingPaths = await this.getTreeFiles(token, username, repoName, baseTreeSha);
        const treeFiles = [...files];

        for (const existingPath of existingPaths) {
          if (existingPath.startsWith('data/notes/') && !currentNoteFilePaths.has(existingPath)) {
            treeFiles.push({
              path: existingPath,
              sha: null
            });
          }
        }

        if (onProgress) onProgress(45, 'Generando árbol con apuntes individuales...');
        const newTreeSha = await this.createTree(token, username, repoName, treeFiles, baseTreeSha);

        if (onProgress) onProgress(80, 'Creando commit atómico...');
        const commitSha = await this.createCommit(
          token,
          username,
          repoName,
          `Sync ${treeFiles.length} files: ${new Date().toLocaleString('es-AR')}`,
          newTreeSha,
          headSha
        );

        if (onProgress) onProgress(95, 'Actualizando rama...');
        await this.updateRef(token, username, repoName, branch, commitSha, true);

        if (onProgress) onProgress(100, 'Sincronización completada');
        return { success: true, count: treeFiles.length, noteCount: noteIds.length };
      } catch (err) {
        console.warn(`Git Tree upload attempt ${attempt} failed:`, err.message);
        if (attempt === maxRetries) {
          console.warn('Falling back to sequential file update...');
          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            if (onProgress) {
              onProgress(
                Math.floor((i / files.length) * 100),
                `Actualizando ${f.path} (${i + 1}/${files.length})...`
              );
            }
            await this.updateFile(token, username, repoName, f.path, f.content);
          }
          if (onProgress) onProgress(100, 'Completado');
          return { success: true, count: files.length, noteCount: noteIds.length };
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async sync(token, username, repoName, localData, onProgress = null) {
    await this.ensureRepository(token, username, repoName);
    if (onProgress) onProgress(10, 'Descargando datos remotos de GitHub...');
    const remoteData = await this.getRemoteData(token, username, repoName);
    const mergedData = this.mergeData(localData, remoteData);
    await this.uploadData(token, username, repoName, mergedData, onProgress);
    return mergedData;
  }
}

export const gitHubService = new GitHubService();
