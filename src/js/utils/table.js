export function createTableHTML(rows, cols) {
  const r = Math.max(1, Math.floor(rows));
  const c = Math.max(1, Math.floor(cols));
  let html = '<table class="editable-table"><tbody>';
  for (let i = 0; i < r; i++) {
    html += '<tr>';
    for (let j = 0; j < c; j++) {
      html += '<td contenteditable="true"><br></td>';
    }
    html += '</tr>';
  }
  html += '</tbody></table><br>';
  return html;
}
