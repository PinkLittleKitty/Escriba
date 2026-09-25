import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateShareUrl,
  createGitHubGist,
  loadRemoteSharedContent,
  printSubjectFolder,
  getShareBaseUrl,
  APP_WEB_URL
} from '../exportHelpers.js';

describe('exportHelpers', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getShareBaseUrl', () => {
    const originalLocation = window.location;

    afterEach(() => {
      delete window.location;
      window.location = originalLocation;
    });

    it('returns APP_WEB_URL when in Electron or AppImage (file: protocol)', () => {
      delete window.location;
      window.location = {
        protocol: 'file:',
        origin: 'file://',
        pathname: '/tmp/.mount_EscribSUhJMo/resources/app.asar/dist/index.html',
        hostname: ''
      };

      expect(getShareBaseUrl()).toBe(APP_WEB_URL);
    });

    it('returns APP_WEB_URL when running on localhost', () => {
      delete window.location;
      window.location = {
        protocol: 'http:',
        origin: 'http://localhost:5173',
        pathname: '/',
        hostname: 'localhost'
      };

      expect(getShareBaseUrl()).toBe(APP_WEB_URL);
    });

    it('returns origin + pathname when on public web URL', () => {
      delete window.location;
      window.location = {
        protocol: 'https:',
        origin: 'https://www.justneki.com',
        pathname: '/Escriba/',
        hostname: 'www.justneki.com'
      };

      expect(getShareBaseUrl()).toBe('https://www.justneki.com/Escriba/');
    });
  });

  describe('createGitHubGist', () => {
    it('creates a gist with Bearer auth header when token is provided', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'gist-12345' })
      });
      vi.stubGlobal('fetch', mockFetch);

      const url = await createGitHubGist({ name: 'Matemática' }, true, 'test-token-xyz');
      expect(url).toContain('?gist=gist-12345');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.github.com/gists',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token-xyz'
          })
        })
      );
    });
  });

  describe('generateShareUrl for notes', () => {
    it('creates Gist and returns gist url when token is available', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'gist-note-123' })
      });
      vi.stubGlobal('fetch', mockFetch);

      const note = {
        id: 'note-1790285585297-id9nguw',
        title: 'Mi Apunte',
        content: '<p>Contenido del apunte</p>',
        tags: ['uni']
      };

      const result = await generateShareUrl(note, {
        type: 'note',
        subjectName: 'Biología',
        github: {
          isAuthenticated: true,
          username: 'PinkLittleKitty',
          repoName: 'escriba-notes',
          token: 'ghp_secret_token'
        },
        useGist: true
      });

      expect(result.method).toBe('gist');
      expect(result.url).toContain('?gist=gist-note-123');
      expect(result.url).not.toContain('file:///tmp');
    });

    it('falls back to github_repo if Gist creation fails and repo is configured', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: async () => 'Forbidden'
      });
      vi.stubGlobal('fetch', mockFetch);

      const note = {
        id: 'note-1790285585297-id9nguw',
        title: 'Mi Apunte',
        content: '<p>Contenido</p>'
      };

      const result = await generateShareUrl(note, {
        type: 'note',
        subjectName: 'Biología',
        github: {
          isAuthenticated: true,
          username: 'PinkLittleKitty',
          repoName: 'escriba-notes',
          token: 'token-without-gist'
        },
        useGist: true
      });

      expect(result.method).toBe('github_repo');
      expect(result.url).toContain('?github=PinkLittleKitty/escriba-notes/data/notes/note-1790285585297-id9nguw.json');
    });

    it('packages sub-notes in Gist payload when note has sub-notes', async () => {
      let sentBody = null;
      const mockFetch = vi.fn().mockImplementation(async (url, opts) => {
        sentBody = JSON.parse(opts.body);
        return {
          ok: true,
          json: async () => ({ id: 'gist-with-subnotes' })
        };
      });
      vi.stubGlobal('fetch', mockFetch);

      const parentNote = {
        id: 'n-parent',
        title: 'Células',
        content: '<p>Teoría Celular</p>'
      };
      const subNotes = [
        { id: 'n-child-1', title: 'Mitocondria', content: '<p>Energía</p>', parentId: 'n-parent' },
        { id: 'n-child-2', title: 'Núcleo', content: '<p>ADN</p>', parentId: 'n-parent' }
      ];

      const result = await generateShareUrl(parentNote, {
        type: 'note',
        subjectName: 'Biología',
        subNotes,
        github: {
          isAuthenticated: true,
          username: 'PinkLittleKitty',
          token: 'token-xyz'
        },
        useGist: true
      });

      expect(result.method).toBe('gist');
      expect(result.url).toContain('?gist=gist-with-subnotes');
      expect(sentBody.description).toContain('sub-apuntes');
      const fileContent = JSON.parse(sentBody.files['escriba-note.json'].content);
      expect(fileContent.subNotes).toHaveLength(2);
      expect(fileContent.subNotes[0].title).toBe('Mitocondria');
      expect(fileContent.subNotes[1].title).toBe('Núcleo');
    });

    it('packages sub-notes in direct base64 share link when unauthenticated', async () => {
      const parentNote = {
        id: 'n-parent',
        title: 'Algoritmos',
        content: '<p>Grafos</p>'
      };
      const subNotes = [
        { id: 'n-sub', title: 'Dijkstra', content: '<p>Shortest Path</p>', parentId: 'n-parent' }
      ];

      const result = await generateShareUrl(parentNote, {
        type: 'note',
        subjectName: 'Informática',
        subNotes,
        github: null
      });

      expect(result.method).toBe('direct');
      expect(result.url).toContain('?share=');
      const base64Data = new URL(result.url).searchParams.get('share');
      const { base64ToUtf8 } = await import('../exportHelpers.js');
      const parsed = JSON.parse(base64ToUtf8(decodeURIComponent(base64Data)));
      expect(parsed.subNotes).toHaveLength(1);
      expect(parsed.subNotes[0].title).toBe('Dijkstra');
    });

    it('falls back to direct link when not authenticated', async () => {
      const note = {
        id: 'note-1',
        title: 'Nota local',
        content: '<p>Hola</p>'
      };

      const result = await generateShareUrl(note, {
        type: 'note',
        subjectName: 'General',
        github: null
      });

      expect(result.method).toBe('direct');
      expect(result.url).toContain('?share=');
    });
  });

  describe('generateShareUrl for subjects', () => {
    it('automatically uses Gist when github token is available', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'gist-sub-999' })
      });
      vi.stubGlobal('fetch', mockFetch);

      const subject = {
        id: 'sub-1',
        name: 'Programación Con Objetos 2',
        notes: [{ id: 'n-1', title: 'Patrones', content: '<p>Strategy</p>' }]
      };

      const result = await generateShareUrl(subject, {
        type: 'subject',
        github: {
          isAuthenticated: true,
          username: 'PinkLittleKitty',
          repoName: 'escriba-notes',
          token: 'token-abc'
        }
      });

      expect(result.method).toBe('gist');
      expect(result.url).toContain('?gist=gist-sub-999');
    });

    it('falls back to direct base64 link when no token is present', async () => {
      const subject = {
        id: 'sub-1',
        name: 'Física',
        notes: [{ id: 'n-1', title: 'Cinemática', content: '<p>MRU</p>' }]
      };

      const result = await generateShareUrl(subject, {
        type: 'subject',
        github: null
      });

      expect(result.method).toBe('direct');
      expect(result.url).toContain('?share=');
    });
  });

  describe('printSubjectFolder', () => {
    it('returns error when subject has no notes', async () => {
      const result = await printSubjectFolder({ name: 'Vacía', notes: [] });
      expect(result.success).toBe(false);
      expect(result.error).toBe('empty');
    });

    it('successfully prepares printing for a subject with code and UML blocks without parentNode errors', async () => {
      vi.spyOn(window, 'print').mockImplementation(() => { });

      const subjectWithCode = {
        name: 'POO2',
        color: '#3b82f6',
        notes: [
          {
            id: 'n-1',
            title: 'Objetos',
            content: `
              <div class="code-block-container" data-code="const a = 1;" data-lang="javascript">
                <div class="inline-ace-editor" data-code="const a = 1;"></div>
              </div>
              <div class="uml-block-container" data-uml-code="graph TD\n A-->B">
                <div class="screenWrapper"></div>
              </div>
            `
          }
        ]
      };

      const result = await printSubjectFolder(subjectWithCode);
      expect(result.success).toBe(true);
      expect(document.body.classList.contains('print-folder-mode')).toBe(true);
      const container = document.getElementById('printFolderContainer');
      expect(container).not.toBeNull();
      expect(container.innerHTML).toContain('POO2');
    }, 15000);
  });

  describe('File Export formatting for Code and UML Blocks', () => {
    const sampleHtml = `
      <p>Introducción a algoritmos:</p>
      <div class="code-block-container" contenteditable="false" data-code="function dfs(graph) {\n  return true;\n}" data-lang="javascript">
        <div class="code-block-header">
          <span class="code-block-title">Bloque de Código</span>
          <div class="code-block-actions">
            <select class="code-block-lang-select"><option value="javascript">JavaScript</option></select>
            <button type="button" class="code-block-delete-btn">Eliminar</button>
          </div>
        </div>
        <div class="inline-ace-editor" data-code="function dfs(graph) {\n  return true;\n}" data-lang="javascript">
          <div class="ace_line">function dfs(graph) {</div>
          <div class="ace_line">  return true;</div>
          <div class="ace_line">}</div>
        </div>
        <pre class="print-code-block"><code>function dfs(graph) {\n  return true;\n}</code></pre>
      </div>
      <p>Diagrama de flujo:</p>
      <div class="uml-block-container" data-uml-code="graph TD\n  A[Inicio] --> B[Fin]" data-initialized="true" contenteditable="false">
        <div class="umlContainer">
          <div class="screenWrapper">
            <div class="umlHeader">
              <span>Diagrama UML</span>
              <button>Plantillas</button>
              <button>Vista Previa</button>
              <button>Split</button>
              <button>Código</button>
              <button>Alejar</button>
              <button>Acercar</button>
              <button>Eliminar diagrama</button>
            </div>
            <div class="previewArea">
              <div class="svgCanvas"><svg><g><text>Rendered SVG</text></g></svg></div>
            </div>
            <textarea class="codeArea">graph TD\n  A[Inicio] --> B[Fin]</textarea>
          </div>
          <div class="printWrapper">
            <svg><g><text>Print SVG</text></g></svg>
          </div>
        </div>
      </div>
    `;

    it('converts HTML with code and UML blocks to Markdown without UI noise', async () => {
      const { convertHtmlToMarkdown } = await import('../exportHelpers.js');
      const md = convertHtmlToMarkdown(sampleHtml, 'Algoritmos y Grafos', 'Programación');

      expect(md).toContain('```javascript\nfunction dfs(graph) {\n  return true;\n}\n```');
      expect(md).toContain('```mermaid\ngraph TD\n  A[Inicio] --> B[Fin]\n```');
      expect(md).not.toContain('Bloque de Código');
      expect(md).not.toContain('Eliminar diagrama');
      expect(md).not.toContain('Plantillas');
      expect(md).not.toContain('Vista Previa');
      expect(md).not.toContain('Split');
    });

    it('converts HTML with code and UML blocks to standalone HTML with clean cards and mermaid pre', async () => {
      const { convertHtmlToStandaloneHtml } = await import('../exportHelpers.js');
      const standalone = convertHtmlToStandaloneHtml(sampleHtml, 'Algoritmos y Grafos', 'Programación', 'dark');

      expect(standalone).toContain('standalone-code-card');
      expect(standalone).toContain('language-javascript');
      expect(standalone).toContain('function dfs(graph)');

      expect(standalone).toContain('standalone-uml-card');
      expect(standalone).toContain('<pre class="mermaid">graph TD\n  A[Inicio] --&gt; B[Fin]</pre>');
      expect(standalone).toContain('cdn.jsdelivr.net/npm/mermaid');

      expect(standalone).not.toContain('code-block-delete-btn');
      expect(standalone).not.toContain('Plantillas');
      expect(standalone).not.toContain('Eliminar diagrama');
    });

    it('converts HTML with code and UML blocks to clean plain text', async () => {
      const { convertHtmlToPlainText } = await import('../exportHelpers.js');
      const txt = convertHtmlToPlainText(sampleHtml, 'Algoritmos y Grafos', 'Programación');

      expect(txt).toContain('[Código: javascript]');
      expect(txt).toContain('function dfs(graph)');
      expect(txt).toContain('[Diagrama UML (Mermaid)]');
      expect(txt).toContain('graph TD');
      expect(txt).not.toContain('Plantillas');
      expect(txt).not.toContain('Eliminar diagrama');
    });
  });
});
