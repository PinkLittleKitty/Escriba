export const copySvgToClipboard = async (svgString) => {
  if (!svgString) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(svgString);
      return true;
    }
  } catch (err) {
    console.warn('[umlExportUtils] Failed to copy SVG text:', err);
  }
  return false;
};

export const copyCodeToClipboard = async (code) => {
  if (!code) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(code);
      return true;
    }
  } catch (err) {
    console.warn('[umlExportUtils] Failed to copy code:', err);
  }
  return false;
};

export const exportSvgToFile = (svgString, filename = 'diagrama-mermaid.svg') => {
  if (!svgString) return false;
  try {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.download = filename;
    a.href = url;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (err) {
    console.error('[umlExportUtils] Failed to download SVG:', err);
    return false;
  }
};

export const exportSvgToPng = async (svgElement, filename = 'diagrama-mermaid.png', background = '#ffffff') => {
  if (!svgElement) return false;
  try {
    const clone = svgElement.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    const svgString = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URLObj = window.URL || window.webkitURL || window;
    const blobURL = URLObj.createObjectURL(svgBlob);

    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = (e) => reject(new Error('Failed loading SVG as Image'));
      image.src = blobURL;
    });

    const rect = svgElement.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width) || 800, 600);
    const height = Math.max(Math.round(rect.height) || 600, 400);

    const canvas = document.createElement('canvas');
    const scale = 2; // 2x Retina resolution
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.scale(scale, scale);

    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(image, 0, 0, width, height);
    URLObj.revokeObjectURL(blobURL);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.download = filename;
    a.href = pngUrl;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch (err) {
    console.error('[umlExportUtils] Failed to download PNG:', err);
    return false;
  }
};
