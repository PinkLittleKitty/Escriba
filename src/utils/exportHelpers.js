import { formatDate } from './helpers.js';

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

export const extractCodeBlock = (container) => {
  if (!container) return { code: '', lang: '' };

  let code = container.getAttribute('data-code');
  if (!code) {
    const aceEl = container.querySelector('.inline-ace-editor');
    code = aceEl?.getAttribute('data-code');
  }
  if (!code) {
    const printCode = container.querySelector('.print-code-block code, pre code');
    code = printCode?.textContent;
  }
  if (!code) {
    const aceLines = container.querySelectorAll('.ace_line');
    if (aceLines && aceLines.length > 0) {
      code = Array.from(aceLines).map((l) => l.textContent).join('\n');
    }
  }

  let lang =
    container.getAttribute('data-lang') ||
    container.querySelector('.inline-ace-editor')?.getAttribute('data-lang') ||
    container.querySelector('.code-block-lang-select')?.value ||
    '';

  return { code: (code || '').trim(), lang: (lang || '').toLowerCase() };
};

export const extractUmlBlock = (container) => {
  if (!container) return { umlCode: '', svgHtml: '' };

  let umlCode = container.getAttribute('data-uml-code');
  if (!umlCode) {
    const textarea = container.querySelector('textarea');
    umlCode = textarea?.value || textarea?.textContent;
  }
  if (!umlCode) {
    umlCode = container.getAttribute('data-code');
  }

  const svgEl = container.querySelector('.printWrapper svg, [class*="printWrapper"] svg, .svgCanvas svg, svg');
  const svgHtml = svgEl ? svgEl.outerHTML : '';

  return { umlCode: (umlCode || '').trim(), svgHtml };
};

export const extractMathBlock = (container) => {
  if (!container) return '';
  const formula =
    container.getAttribute('data-math-code') ||
    container.querySelector('.katex-mathml annotation')?.textContent ||
    container.textContent ||
    '';
  return formula.trim();
};

export const convertHtmlToMarkdown = (html = '', title = '', subjectName = '') => {
  if (!html) return (title ? `# ${title}\n\n` : '');

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;

  const codeBlocks = [];
  const umlBlocks = [];
  const mathBlocks = [];

  const processedCodeNodes = new Set();
  root.querySelectorAll('.code-block-container, .inline-ace-editor').forEach((block) => {
    const parent = block.closest('.code-block-container') || block;
    if (processedCodeNodes.has(parent)) return;
    processedCodeNodes.add(parent);

    const { code, lang } = extractCodeBlock(parent);
    const idx = codeBlocks.length;
    codeBlocks.push({ code, lang });

    const marker = doc.createElement('p');
    marker.textContent = `\n\n__CODE_BLOCK_${idx}__\n\n`;
    parent.replaceWith(marker);
  });

  const processedUmlNodes = new Set();
  root.querySelectorAll('.uml-block-container, .uml-diagram-container, [class*="umlContainer"]').forEach((block) => {
    const parent = block.closest('.uml-block-container') || block.closest('.uml-diagram-container') || block;
    if (processedUmlNodes.has(parent)) return;
    processedUmlNodes.add(parent);

    const { umlCode } = extractUmlBlock(parent);
    const idx = umlBlocks.length;
    umlBlocks.push(umlCode || 'graph TD\n  A --> B');

    const marker = doc.createElement('p');
    marker.textContent = `\n\n__UML_BLOCK_${idx}__\n\n`;
    parent.replaceWith(marker);
  });

  const processedMathNodes = new Set();
  root.querySelectorAll('.math-block-container').forEach((block) => {
    if (processedMathNodes.has(block)) return;
    processedMathNodes.add(block);

    const formula = extractMathBlock(block);
    const idx = mathBlocks.length;
    mathBlocks.push(formula);

    const marker = doc.createElement('p');
    marker.textContent = `\n\n__MATH_BLOCK_${idx}__\n\n`;
    block.replaceWith(marker);
  });

  root.querySelectorAll('table').forEach((table) => {
    const rows = Array.from(table.rows);
    if (rows.length === 0) return;

    let tableMd = '\n\n';
    rows.forEach((row, rIdx) => {
      const cells = Array.from(row.cells).map((c) => c.innerText.trim().replace(/\|/g, '\\|') || ' ');
      tableMd += `| ${cells.join(' | ')} |\n`;

      if (rIdx === 0) {
        const separator = cells.map(() => '---').join(' | ');
        tableMd += `| ${separator} |\n`;
      }
    });
    tableMd += '\n\n';

    const p = doc.createElement('p');
    p.textContent = tableMd;
    table.replaceWith(p);
  });

  root.querySelectorAll('a').forEach((a) => {
    const noteId = a.getAttribute('data-note-id');
    const text = a.innerText.trim();
    if (noteId) {
      a.replaceWith(doc.createTextNode(`[[${text.replace(/^\[\[|\]\]$/g, '')}]]`));
    } else {
      a.replaceWith(doc.createTextNode(`[${text}](${a.getAttribute('href') || ''})`));
    }
  });

  for (let i = 1; i <= 6; i++) {
    root.querySelectorAll(`h${i}`).forEach((h) => {
      const prefix = '#'.repeat(i);
      h.replaceWith(doc.createTextNode(`\n\n${prefix} ${h.innerText.trim()}\n\n`));
    });
  }

  root.querySelectorAll('blockquote').forEach((bq) => {
    const text = bq.innerText.trim().split('\n').map((l) => `> ${l}`).join('\n');
    bq.replaceWith(doc.createTextNode(`\n\n${text}\n\n`));
  });

  root.querySelectorAll('ul > li').forEach((li) => {
    li.replaceWith(doc.createTextNode(`\n- ${li.innerText.trim()}`));
  });
  root.querySelectorAll('ol > li').forEach((li, idx) => {
    li.replaceWith(doc.createTextNode(`\n${idx + 1}. ${li.innerText.trim()}`));
  });

  root.querySelectorAll('img').forEach((img) => {
    const alt = img.getAttribute('alt') || 'imagen';
    const src = img.getAttribute('src') || '';
    img.replaceWith(doc.createTextNode(`![${alt}](${src})`));
  });

  root.querySelectorAll('strong, b').forEach((el) => {
    el.replaceWith(doc.createTextNode(`**${el.innerText}**`));
  });
  root.querySelectorAll('em, i').forEach((el) => {
    el.replaceWith(doc.createTextNode(`*${el.innerText}*`));
  });
  root.querySelectorAll('s, strike, del').forEach((el) => {
    el.replaceWith(doc.createTextNode(`~~${el.innerText}~~`));
  });
  root.querySelectorAll('code').forEach((el) => {
    if (el.parentElement?.tagName !== 'PRE') {
      el.replaceWith(doc.createTextNode(`\`${el.innerText}\``));
    }
  });
  root.querySelectorAll('hr').forEach((el) => {
    el.replaceWith(doc.createTextNode('\n\n---\n\n'));
  });
  root.querySelectorAll('br').forEach((el) => {
    el.replaceWith(doc.createTextNode('\n'));
  });
  root.querySelectorAll('p, div').forEach((el) => {
    el.prepend(doc.createTextNode('\n\n'));
    el.append(doc.createTextNode('\n\n'));
  });

  let rawText = root.textContent || '';
  rawText = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  codeBlocks.forEach(({ code, lang }, idx) => {
    const blockMd = `\`\`\`${lang}\n${code}\n\`\`\``;
    rawText = rawText.replaceAll(`__CODE_BLOCK_${idx}__`, blockMd);
  });

  umlBlocks.forEach((umlCode, idx) => {
    const blockMd = `\`\`\`mermaid\n${umlCode}\n\`\`\``;
    rawText = rawText.replaceAll(`__UML_BLOCK_${idx}__`, blockMd);
  });

  mathBlocks.forEach((formula, idx) => {
    const blockMd = `$$\n${formula}\n$$`;
    rawText = rawText.replaceAll(`__MATH_BLOCK_${idx}__`, blockMd);
  });

  let frontmatter = '---\n';
  if (title) frontmatter += `title: "${title.replace(/"/g, '\\"')}"\n`;
  if (subjectName) frontmatter += `subject: "${subjectName.replace(/"/g, '\\"')}"\n`;
  frontmatter += `date: "${new Date().toISOString().split('T')[0]}"\n`;
  frontmatter += `exportedBy: "Escriba"\n`;
  frontmatter += '---\n\n';

  return frontmatter + (title ? `# ${title}\n\n` : '') + rawText + '\n';
};

export const convertHtmlToPlainText = (html = '', title = '', subjectName = '') => {
  if (!html) return (title ? `${title}\n\n` : '');

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;

  const processedCodeNodes = new Set();
  root.querySelectorAll('.code-block-container, .inline-ace-editor').forEach((block) => {
    const parent = block.closest('.code-block-container') || block;
    if (processedCodeNodes.has(parent)) return;
    processedCodeNodes.add(parent);

    const { code, lang } = extractCodeBlock(parent);
    const p = doc.createElement('p');
    p.textContent = `\n\n[Código: ${lang || 'texto'}]\n${'-'.repeat(45)}\n${code}\n${'-'.repeat(45)}\n\n`;
    parent.replaceWith(p);
  });

  const processedUmlNodes = new Set();
  root.querySelectorAll('.uml-block-container, .uml-diagram-container, [class*="umlContainer"]').forEach((block) => {
    const parent = block.closest('.uml-block-container') || block.closest('.uml-diagram-container') || block;
    if (processedUmlNodes.has(parent)) return;
    processedUmlNodes.add(parent);

    const { umlCode } = extractUmlBlock(parent);
    const p = doc.createElement('p');
    p.textContent = `\n\n[Diagrama UML (Mermaid)]\n${'-'.repeat(45)}\n${umlCode}\n${'-'.repeat(45)}\n\n`;
    parent.replaceWith(p);
  });

  root.querySelectorAll('.math-block-container').forEach((block) => {
    const formula = extractMathBlock(block);
    const p = doc.createElement('p');
    p.textContent = `\n\n[Fórmula: ${formula}]\n\n`;
    block.replaceWith(p);
  });

  root.querySelectorAll('table').forEach((table) => {
    const rows = Array.from(table.rows);
    let tableTxt = '\n';
    rows.forEach((row) => {
      const cells = Array.from(row.cells).map((c) => c.innerText.trim());
      tableTxt += `${cells.join('\t|\t')}\n`;
    });
    tableTxt += '\n';
    const p = doc.createElement('p');
    p.textContent = tableTxt;
    table.replaceWith(p);
  });

  for (let i = 1; i <= 6; i++) {
    root.querySelectorAll(`h${i}`).forEach((h) => {
      h.replaceWith(doc.createTextNode(`\n\n=== ${h.innerText.trim()} ===\n\n`));
    });
  }

  root.querySelectorAll('ul > li').forEach((li) => {
    li.replaceWith(doc.createTextNode(`\n• ${li.innerText.trim()}`));
  });
  root.querySelectorAll('ol > li').forEach((li, idx) => {
    li.replaceWith(doc.createTextNode(`\n${idx + 1}. ${li.innerText.trim()}`));
  });

  root.querySelectorAll('br').forEach((el) => {
    el.replaceWith(doc.createTextNode('\n'));
  });
  root.querySelectorAll('p, div').forEach((el) => {
    el.prepend(doc.createTextNode('\n'));
    el.append(doc.createTextNode('\n'));
  });

  let rawText = root.textContent || '';
  rawText = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  let header = '';
  if (title) header += `${title}\n`;
  if (subjectName) header += `Materia: ${subjectName}\n`;
  header += `Fecha: ${new Date().toLocaleDateString('es-AR')}\n`;
  header += `${'='.repeat(50)}\n\n`;

  return header + rawText + '\n';
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
    peluche: {
      bgPrimary: '#f5effe',
      bgCard: '#ffffff',
      bgSecondary: '#ebdcfb',
      textPrimary: '#350e4a',
      textSecondary: '#5c2a7a',
      borderColor: '#d6bdf5',
      accentBlue: '#8a4fcf'
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
      borderColor: '#333333',
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
      bgPrimary: '#22150e',
      bgCard: '#281911',
      bgSecondary: '#3a251a',
      textPrimary: '#fff7ed',
      textSecondary: '#fed7aa',
      borderColor: '#42291c',
      accentBlue: '#f97316'
    }
  };

  const palette = THEME_PALETTES[theme] || THEME_PALETTES.dark;
  const isDark = theme !== 'light' && theme !== 'sakura' && theme !== 'peluche';
  const cleanTitle = title || 'Apunte';
  const cleanSubject = subjectName ? `<div class="subject-tag">${subjectName}</div>` : '';

  const escapeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const root = doc.body.firstElementChild;

  const processedCodeNodes = new Set();
  root.querySelectorAll('.code-block-container, .inline-ace-editor').forEach((block) => {
    const parent = block.closest('.code-block-container') || block;
    if (processedCodeNodes.has(parent)) return;
    processedCodeNodes.add(parent);

    const { code, lang } = extractCodeBlock(parent);
    const card = doc.createElement('div');
    card.className = 'standalone-code-card';
    card.innerHTML = `
      <div class="code-card-header">
        <span class="code-card-title">Bloque de Código</span>
      </div>
      <pre class="code-card-pre"><code class="language-${escapeHtml(lang)}">${escapeHtml(code)}</code></pre>
    `;
    parent.replaceWith(card);
  });

  const processedUmlNodes = new Set();
  root.querySelectorAll('.uml-block-container, .uml-diagram-container, [class*="umlContainer"]').forEach((block) => {
    const parent = block.closest('.uml-block-container') || block.closest('.uml-diagram-container') || block;
    if (processedUmlNodes.has(parent)) return;
    processedUmlNodes.add(parent);

    const { umlCode } = extractUmlBlock(parent);
    const card = doc.createElement('div');
    card.className = 'standalone-uml-card';
    card.innerHTML = `
      <div class="uml-card-header">
        <span class="uml-card-title">Diagrama UML</span>
      </div>
      <div class="uml-card-body">
        <pre class="mermaid">${escapeHtml(umlCode || 'graph TD\n  A --> B')}</pre>
      </div>
    `;
    parent.replaceWith(card);
  });

  root.querySelectorAll('.math-block-container').forEach((block) => {
    const formula = extractMathBlock(block);
    const card = doc.createElement('div');
    card.className = 'standalone-math-card';
    card.innerHTML = `<div class="math-tex">\\[${escapeHtml(formula)}\\]</div>`;
    block.replaceWith(card);
  });

  const contentHtml = root.innerHTML;

  return `<!DOCTYPE html>
<html lang="es-AR" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(cleanTitle)} - Escriba</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
  <link rel="stylesheet" href="${isDark ? 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css' : 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css'}">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
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
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.65;
      padding: 2.5rem 1rem;
      margin: 0;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 860px;
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 2.5rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    }
    h1 { font-size: 2.2rem; font-weight: 800; margin-top: 0; margin-bottom: 0.5rem; color: var(--text-primary); letter-spacing: -0.5px; }
    h2 { font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 0.5rem; color: var(--text-primary); }
    h3 { font-size: 1.25rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: var(--text-primary); }
    .subject-tag {
      display: inline-block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--accent-blue);
      background: rgba(67, 97, 238, 0.12);
      padding: 0.2rem 0.65rem;
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
    .editable-table thead { background: var(--bg-secondary); font-weight: 600; }
    code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
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

    .standalone-code-card {
      margin: 1.5rem 0;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }
    .code-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      background: rgba(0,0,0,0.15);
      border-bottom: 1px solid var(--border-color);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .code-card-pre {
      margin: 0;
      padding: 1.25rem;
      background: transparent;
      overflow-x: auto;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 0.875rem;
      line-height: 1.55;
    }
    .code-card-pre code {
      background: transparent;
      padding: 0;
      border-radius: 0;
      font-family: inherit;
      color: inherit;
    }

    .standalone-uml-card {
      margin: 1.75rem 0;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
    .uml-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      background: rgba(0,0,0,0.12);
      border-bottom: 1px solid var(--border-color);
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
    }
    .uml-card-body {
      padding: 1.5rem 1rem;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #ffffff;
      min-height: 120px;
    }
    .uml-card-body .mermaid {
      width: 100%;
      text-align: center;
      display: flex;
      justify-content: center;
    }
    .uml-card-body .mermaid svg {
      max-width: 100% !important;
      height: auto !important;
    }

    .standalone-math-card {
      margin: 1.25rem 0;
      padding: 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow-x: auto;
    }

    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .standalone-code-card, .standalone-uml-card, .standalone-math-card {
        page-break-inside: avoid;
        break-inside: avoid;
        border-color: #cbd5e1;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${cleanSubject}
    <h1>${escapeHtml(cleanTitle)}</h1>
    <div class="content">
      ${contentHtml}
    </div>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      if (window.mermaid) {
        mermaid.initialize({ startOnLoad: true, theme: 'default' });
      }
      if (window.renderMathInElement) {
        renderMathInElement(document.body, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '\\\\[', right: '\\\\]', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\\\(', right: '\\\\)', display: false }
          ]
        });
      }
      if (window.Prism) {
        Prism.highlightAll();
      }
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
      ? `Escriba Subject: ${data.name || data.subjectName || 'Materia'}`
      : `Escriba Note: ${data.title || data.t || 'Apunte'}`;

    const gistData = {
      description,
      public: true,
      files: {
        [filename]: {
          content: JSON.stringify(data, null, 2)
        }
      }
    };

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.github.v3+json'
    };
    const authToken = token || localStorage.getItem('github_access_token') || localStorage.getItem('github_token');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers,
      body: JSON.stringify(gistData)
    });

    if (response.ok) {
      const gist = await response.json();
      return `${getShareBaseUrl()}?gist=${gist.id}`;
    } else {
      const errText = await response.text();
      console.warn('Error creating GitHub Gist:', response.status, errText);
    }
  } catch (error) {
    console.error('Error creating GitHub Gist:', error);
  }
  return null;
};

export const generateShareUrl = async (noteOrSubject, options = {}) => {
  const { type = 'note', subjectName = '', github = null, useGist = false } = options;
  const baseUrl = getShareBaseUrl();
  const token = github?.token || localStorage.getItem('github_access_token') || localStorage.getItem('github_token');

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
      icon: subject.icon || null,
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

    if (token || useGist) {
      const gistUrl = await createGitHubGist(shareData, true, token);
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

export const printSubjectFolder = async (subject) => {
  if (!subject) return { success: false, error: 'no_subject' };
  if (!Array.isArray(subject.notes) || subject.notes.length === 0) {
    return { success: false, error: 'empty' };
  }

  let printContainer = document.getElementById('printFolderContainer');
  if (!printContainer) {
    printContainer = document.createElement('div');
    printContainer.id = 'printFolderContainer';
    document.body.appendChild(printContainer);
  }
  printContainer.innerHTML = '';

  const escapeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const coverPage = document.createElement('div');
  coverPage.className = 'print-cover-page';
  coverPage.style.borderTop = `10px solid ${subject.color || '#3b82f6'}`;
  coverPage.innerHTML = `
    <div class="print-cover-header">
      <h1 class="print-cover-title">${escapeHtml(subject.name)}</h1>
      ${subject.code ? `<p class="print-cover-meta"><strong>Código:</strong> ${escapeHtml(subject.code)}</p>` : ''}
      ${subject.professor ? `<p class="print-cover-meta"><strong>Profesor/a:</strong> ${escapeHtml(subject.professor)}</p>` : ''}
    </div>
    <div class="print-cover-footer">
      <p><strong>Cantidad de apuntes:</strong> ${subject.notes.length}</p>
      <p><strong>Fecha de exportación:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
      <p class="print-cover-watermark">Generado con Escriba</p>
    </div>
  `;
  printContainer.appendChild(coverPage);

  const notesToExport = [...subject.notes].sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
  );

  for (const note of notesToExport) {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'print-note';

    const noteHeader = document.createElement('div');
    noteHeader.className = 'print-note-header';
    noteHeader.innerHTML = `
      <h2 class="print-note-title">${escapeHtml(note.title || 'Apunte sin título')}</h2>
      <div class="print-note-meta">
        <span>Materia: ${escapeHtml(subject.name)}</span>
        <span>Fecha: ${formatDate(note.updatedAt || note.createdAt)}</span>
      </div>
    `;
    noteDiv.appendChild(noteHeader);

    const noteContentDiv = document.createElement('div');
    noteContentDiv.className = 'print-note-content note-content';

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = note.content || '';

    try {
      const processedCodeContainers = new Set();
      tempDiv.querySelectorAll('.code-block-container, .inline-ace-editor').forEach((container) => {
        const parent = container.closest('.code-block-container') || container;
        if (processedCodeContainers.has(parent)) return;
        processedCodeContainers.add(parent);

        const { code } = extractCodeBlock(parent);
        const pre = document.createElement('pre');
        pre.className = 'print-code-block';
        const codeEl = document.createElement('code');
        codeEl.textContent = code;
        pre.appendChild(codeEl);

        if (parent.parentNode) {
          parent.replaceWith(pre);
        }
      });

      const processedUmlContainers = new Set();
      const umlBlocks = tempDiv.querySelectorAll('.uml-block-container, .uml-diagram-container, [class*="umlContainer"]');
      for (const container of umlBlocks) {
        const parent = container.closest('.uml-block-container') || container.closest('.uml-diagram-container') || container;
        if (processedUmlContainers.has(parent)) continue;
        processedUmlContainers.add(parent);

        const { umlCode, svgHtml } = extractUmlBlock(parent);
        const umlWrapper = document.createElement('div');
        umlWrapper.className = 'print-uml-wrapper';

        if (svgHtml) {
          umlWrapper.innerHTML = svgHtml;
        } else {
          try {
            const { default: mermaid } = await import('mermaid');
            const id = `print-uml-${Math.random().toString(36).substr(2, 9)}`;
            const { svg } = await mermaid.render(id, umlCode || 'graph TD\n  A --> B');
            umlWrapper.innerHTML = svg;
          } catch (e) {
            const pre = document.createElement('pre');
            pre.className = 'print-code-block';
            pre.textContent = umlCode;
            umlWrapper.appendChild(pre);
          }
        }
        if (parent.parentNode) {
          parent.replaceWith(umlWrapper);
        }
      }

      tempDiv.querySelectorAll('.math-block-container').forEach((container) => {
        const formula = extractMathBlock(container);
        const katexEl = container.querySelector('.katex-html');
        if (container.parentNode) {
          if (katexEl) {
            container.replaceWith(katexEl.cloneNode(true));
          } else if (formula) {
            const div = document.createElement('div');
            div.style.textAlign = 'center';
            div.style.margin = '1rem 0';
            div.style.fontStyle = 'italic';
            div.textContent = `$$ ${formula} $$`;
            container.replaceWith(div);
          }
        }
      });
    } catch (noteErr) {
      console.warn('Error formatting note for print:', noteErr);
    }

    noteContentDiv.innerHTML = tempDiv.innerHTML;
    noteDiv.appendChild(noteContentDiv);
    printContainer.appendChild(noteDiv);
  }

  document.body.classList.add('print-folder-mode');

  setTimeout(() => {
    window.print();

    const cleanup = () => {
      document.body.classList.remove('print-folder-mode');
      if (printContainer) printContainer.innerHTML = '';
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 1200);
  }, 300);

  return { success: true };
};
