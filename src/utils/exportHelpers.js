export const APP_WEB_URL = 'https://www.justneki.com/Escriba/';

export const getShareBaseUrl = () => {
  if (typeof window === 'undefined') return APP_WEB_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || navigator.userAgent.toLowerCase().includes(' electron/')) {
    return APP_WEB_URL;
  }
  return `${window.location.origin}${window.location.pathname}`;
};

export const downloadFile = (filename, content, mimeType = 'text/plain;charset=utf-8') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};

export const convertHtmlToMarkdown = (html = '', title = '', subjectName = '') => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;

  root.querySelectorAll('.code-block-container, .inline-ace-editor').forEach((block) => {
    const code = block.getAttribute('data-code') || block.innerText || '';
    const lang = block.getAttribute('data-lang') || '';
    const pre = document.createElement('pre');
    pre.textContent = `\n\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`;
    block.replaceWith(pre);
  });

  root.querySelectorAll('.uml-block-container, .uml-diagram-container').forEach((block) => {
    const uml = block.getAttribute('data-uml-code') || '';
    const pre = document.createElement('pre');
    pre.textContent = `\n\`\`\`mermaid\n${uml.trim()}\n\`\`\`\n`;
    block.replaceWith(pre);
  });

  root.querySelectorAll('table').forEach((table) => {
    const rows = Array.from(table.rows);
    if (rows.length === 0) return;

    let tableMd = '\n';
    rows.forEach((row, rIdx) => {
      const cells = Array.from(row.cells).map((c) => c.innerText.trim().replace(/\|/g, '\\|') || ' ');
      tableMd += `| ${cells.join(' | ')} |\n`;

      if (rIdx === 0) {
        const separator = cells.map(() => '---').join(' | ');
        tableMd += `| ${separator} |\n`;
      }
    });
    tableMd += '\n';

    const p = document.createElement('p');
    p.textContent = tableMd;
    table.replaceWith(p);
  });

  root.querySelectorAll('a').forEach((a) => {
    const noteId = a.getAttribute('data-note-id');
    const text = a.innerText.trim();
    if (noteId) {
      a.replaceWith(document.createTextNode(`[[${text.replace(/^\[\[|\]\]$/g, '')}]]`));
    } else {
      a.replaceWith(document.createTextNode(`[${text}](${a.getAttribute('href') || ''})`));
    }
  });

  for (let i = 1; i <= 6; i++) {
    root.querySelectorAll(`h${i}`).forEach((h) => {
      const prefix = '#'.repeat(i);
      h.replaceWith(document.createTextNode(`\n\n${prefix} ${h.innerText.trim()}\n\n`));
    });
  }

  root.querySelectorAll('ul > li').forEach((li) => {
    li.replaceWith(document.createTextNode(`\n- ${li.innerText.trim()}`));
  });
  root.querySelectorAll('ol > li').forEach((li, idx) => {
    li.replaceWith(document.createTextNode(`\n${idx + 1}. ${li.innerText.trim()}`));
  });

  root.querySelectorAll('strong, b').forEach((el) => {
    el.replaceWith(document.createTextNode(`**${el.innerText}**`));
  });
  root.querySelectorAll('em, i').forEach((el) => {
    el.replaceWith(document.createTextNode(`*${el.innerText}*`));
  });
  root.querySelectorAll('s, strike, del').forEach((el) => {
    el.replaceWith(document.createTextNode(`~~${el.innerText}~~`));
  });
  root.querySelectorAll('code').forEach((el) => {
    if (el.parentElement?.tagName !== 'PRE') {
      el.replaceWith(document.createTextNode(`\`${el.innerText}\``));
    }
  });
  root.querySelectorAll('hr').forEach((el) => {
    el.replaceWith(document.createTextNode('\n\n---\n\n'));
  });

  let rawText = root.textContent || '';
  rawText = rawText.replace(/\n{3,}/g, '\n\n').trim();

  let frontmatter = '---\n';
  if (title) frontmatter += `title: "${title.replace(/"/g, '\\"')}"\n`;
  if (subjectName) frontmatter += `subject: "${subjectName.replace(/"/g, '\\"')}"\n`;
  frontmatter += `date: "${new Date().toISOString().split('T')[0]}"\n`;
  frontmatter += `exportedBy: "Escriba"\n`;
  frontmatter += '---\n\n';

  return frontmatter + (title ? `# ${title}\n\n` : '') + rawText;
};

export const convertHtmlToStandaloneHtml = (html = '', title = 'Apunte', subjectName = '', theme = 'dark') => {
  const THEME_PALETTES = {
    dark: {
      bgPrimary: '#1a1a1a',
      bgCard: '#242424',
      bgSecondary: '#2d2d2d',
      textPrimary: '#f5f5f5',
      textSecondary: '#b8b8b8',
      borderColor: '#333333',
      accentBlue: '#4361ee'
    },
    light: {
      bgPrimary: '#ffffff',
      bgCard: '#ffffff',
      bgSecondary: '#f8f9fa',
      textPrimary: '#212529',
      textSecondary: '#495057',
      borderColor: '#dee2e6',
      accentBlue: '#4361ee'
    },
    sakura: {
      bgPrimary: '#faf4ed',
      bgCard: '#f2e9e1',
      bgSecondary: '#ebdcd0',
      textPrimary: '#575279',
      textSecondary: '#797593',
      borderColor: '#ebdcd0',
      accentBlue: '#eb6f92'
    },
    github: {
      bgPrimary: '#0d1117',
      bgCard: '#161b22',
      bgSecondary: '#21262d',
      textPrimary: '#e6edf3',
      textSecondary: '#848d97',
      borderColor: '#30363d',
      accentBlue: '#2f81f7'
    },
    catppuccin: {
      bgPrimary: '#1e1e2e',
      bgCard: '#181825',
      bgSecondary: '#313244',
      textPrimary: '#cdd6f4',
      textSecondary: '#a6adc8',
      borderColor: '#313244',
      accentBlue: '#89b4fa'
    },
    blue: {
      bgPrimary: '#0f1419',
      bgCard: '#1e293b',
      bgSecondary: '#334155',
      textPrimary: '#f1f5f9',
      textSecondary: '#cbd5e1',
      borderColor: '#334155',
      accentBlue: '#3b82f6'
    },
    matcha: {
      bgPrimary: '#151e18',
      bgCard: '#1d2a22',
      bgSecondary: '#27382d',
      textPrimary: '#e8f5e9',
      textSecondary: '#a3cfbb',
      borderColor: '#27382d',
      accentBlue: '#52b788'
    },
    unq: {
      bgPrimary: '#0a0a0a',
      bgCard: '#1f1f1f',
      bgSecondary: '#262626',
      textPrimary: '#f5f5f5',
      textSecondary: '#d1d1d1',
      borderColor: '#333333',
      accentBlue: '#8b1538'
    },
    sunset: {
      bgPrimary: '#2d1b1b',
      bgCard: '#352121',
      bgSecondary: '#4d3333',
      textPrimary: '#fff5f5',
      textSecondary: '#e8d4d4',
      borderColor: '#3d2626',
      accentBlue: '#e63946'
    }
  };

  const palette = THEME_PALETTES[theme] || THEME_PALETTES.dark;
  const cleanTitle = title || 'Apunte';
  const cleanSubject = subjectName ? `<div class="subject-tag">${subjectName}</div>` : '';

  return `<!DOCTYPE html>
<html lang="es-AR" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle} - Escriba</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    :root {
      --bg-primary: ${palette.bgPrimary};
      --bg-card: ${palette.bgCard};
      --bg-secondary: ${palette.bgSecondary};
      --text-primary: ${palette.textPrimary};
      --text-secondary: ${palette.textSecondary};
      --border-color: ${palette.borderColor};
      --accent-blue: ${palette.accentBlue};
    }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.65;
      padding: 2rem 1rem;
      margin: 0;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 850px;
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2.5rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    h1 { font-size: 2rem; font-weight: 800; margin-top: 0; margin-bottom: 0.5rem; color: var(--text-primary); }
    .subject-tag {
      display: inline-block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--accent-blue);
      background: rgba(67, 97, 238, 0.12);
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
      margin-bottom: 1.5rem;
    }
    .internal-link {
      color: var(--accent-blue);
      text-decoration: none;
      font-weight: 500;
      background: rgba(67, 97, 238, 0.12);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
    }
    .editable-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      border: 1px solid var(--border-color);
    }
    .editable-table th, .editable-table td {
      border: 1px solid var(--border-color);
      padding: 0.6rem 0.85rem;
      text-align: left;
    }
    .editable-table thead { background: var(--bg-secondary); }
    code {
      font-family: 'JetBrains Mono', monospace;
      background: var(--bg-secondary);
      padding: 0.15rem 0.35rem;
      border-radius: 4px;
      font-size: 0.875em;
    }
    pre {
      background: var(--bg-secondary);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="container">
    ${cleanSubject}
    <h1>${cleanTitle}</h1>
    <div class="content">
      ${html}
    </div>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      mermaid.initialize({ startOnLoad: true, theme: '${isDark ? 'dark' : 'default'}' });
    });
  </script>
</body>
</html>`;
};

export const utf8ToBase64 = (str) => {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

export const base64ToUtf8 = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

export const createGitHubGist = async (data, isSubject = false, token = null) => {
  try {
    const filename = isSubject ? 'escriba-subject.json' : 'escriba-note.json';
    const description = isSubject
      ? `Escriba Subject: ${data.name || data.subjectName}`
      : `Escriba Note: ${data.title || data.t}`;

    const gistData = {
      description,
      public: true,
      files: {
        [filename]: {
          content: JSON.stringify(data, null, 2)
        }
      }
    };

    const headers = { 'Content-Type': 'application/json' };
    const authToken = token || localStorage.getItem('github_token') || localStorage.getItem('github_access_token');
    if (authToken) {
      headers['Authorization'] = `token ${authToken}`;
    }

    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers,
      body: JSON.stringify(gistData)
    });

    if (response.ok) {
      const gist = await response.json();
      return `${getShareBaseUrl()}?gist=${gist.id}`;
    }
  } catch (error) {
    console.error('Error creating GitHub Gist:', error);
  }
  return null;
};

export const generateShareUrl = async (noteOrSubject, options = {}) => {
  const { type = 'note', subjectName = '', github = null, useGist = false } = options;
  const baseUrl = getShareBaseUrl();

  if (type === 'subject') {
    const subject = noteOrSubject;
    const shareData = {
      app: 'escriba',
      version: '1.0',
      type: 'subject',
      name: subject.name,
      code: subject.code || '',
      professor: subject.professor || '',
      color: subject.color || '#3b82f6',
      schedule: subject.schedule || [],
      notes: (subject.notes || []).map((n) => ({
        title: n.title,
        content: n.content,
        tags: n.tags || [],
        favorite: !!n.favorite,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt
      }))
    };

    if (useGist) {
      const gistUrl = await createGitHubGist(shareData, true, github?.token);
      if (gistUrl) return { url: gistUrl, method: 'gist' };
    }

    const base64Data = utf8ToBase64(JSON.stringify(shareData));
    return { url: `${baseUrl}?share=${encodeURIComponent(base64Data)}`, method: 'direct' };
  }

  const note = noteOrSubject;
  const shareData = {
    app: 'escriba',
    version: '1.0',
    type: 'note',
    t: note.title,
    c: note.content,
    s: subjectName || 'General',
    tags: note.tags || [],
    d: note.updatedAt || note.createdAt
  };

  if (github && github.isAuthenticated && github.username && github.repoName) {
    const relativePath = `data/notes/${note.id}.json`;
    const repoUrl = `${baseUrl}?github=${github.username}/${github.repoName}/${relativePath}`;
    if (repoUrl.length < 2000) {
      return { url: repoUrl, method: 'github_repo' };
    }
  }

  if (useGist) {
    const gistUrl = await createGitHubGist(shareData, false, github?.token);
    if (gistUrl) return { url: gistUrl, method: 'gist' };
  }

  const base64Data = utf8ToBase64(JSON.stringify(shareData));
  return { url: `${baseUrl}?share=${encodeURIComponent(base64Data)}`, method: 'direct' };
};

export const loadRemoteSharedContent = async (searchOrHash = '') => {
  const queryStr = searchOrHash || (typeof window !== 'undefined' ? window.location.search || window.location.hash : '');
  if (!queryStr) return null;

  const urlParams = new URLSearchParams(queryStr.startsWith('#') ? queryStr.replace(/^#/, '?') : queryStr);
  const sharedData = urlParams.get('share');
  const gistId = urlParams.get('gist');
  const githubPath = urlParams.get('github');

  if (!sharedData && !gistId && !githubPath) return null;

  try {
    if (githubPath) {
      const parts = githubPath.split('/');
      if (parts.length >= 3) {
        const username = parts[0];
        const repoName = parts[1];
        const filePath = parts.slice(2).join('/');
        const apiUrl = `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`;

        const res = await fetch(apiUrl, {
          headers: { Accept: 'application/vnd.github.v3+json' }
        });
        if (!res.ok) throw new Error(`GitHub Error: ${res.status}`);

        const fileJson = await res.json();
        const decodedContent = base64ToUtf8(fileJson.content);
        const parsed = JSON.parse(decodedContent);

        return {
          type: parsed.type || 'note',
          data: parsed,
          source: `GitHub (${username}/${repoName})`
        };
      }
    }

    if (gistId) {
      const res = await fetch(`https://api.github.com/gists/${gistId}`);
      if (!res.ok) throw new Error(`Gist Error: ${res.status}`);

      const gist = await res.json();
      const files = Object.values(gist.files);
      if (!files.length) throw new Error('Gist vacío');

      const jsonFile = files.find((f) => f.filename.includes('.json') || f.filename.includes('escriba')) || files[0];
      const parsed = JSON.parse(jsonFile.content);

      return {
        type: parsed.type || 'note',
        data: parsed,
        source: 'GitHub Gist'
      };
    }

    if (sharedData) {
      const jsonStr = base64ToUtf8(decodeURIComponent(sharedData));
      const parsed = JSON.parse(jsonStr);

      return {
        type: parsed.type || 'note',
        data: parsed,
        source: 'Enlace directo'
      };
    }
  } catch (err) {
    console.error('Error loading shared content:', err);
    throw err;
  }

  return null;
};
