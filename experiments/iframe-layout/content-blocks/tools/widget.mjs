// A simple, clear demo widget as a saved-post iframe, for specimens. widget(side, width, opts)
//   side: 'left' | 'right' | 'full'; width: '25%' | '33%' | '38%' | '50%'; opts: { bottom: true, height: 220, label: 'Widget' }
// The widget has no background (Ronny's rule): a thin outline, a label and a small bar chart.
export function widget(side = 'right', width = '33%', opts = {}) {
  const height = opts.height ?? 220;
  const label = opts.label ?? `Widget, ${side} ${width}${opts.bottom ? ' bottom' : ''}`;
  const meta = side === 'full' ? '' : `<meta name="lw-layout" content="position=${side} width=${width}${opts.bottom ? ' align=bottom' : ''}">`;
  const bars = [40, 70, 55, 90, 65].map((h, i) => `<rect x="${8 + i * 20}%" y="${100 - h}" width="12%" height="${h}" fill="#2f6f4f" opacity="0.75"/>`).join('');
  const html = `${meta}<style>body{margin:0;font:13px/1.35 system-ui,sans-serif;color:#1f3d2e}.w{border:1px solid #2f6f4f;border-radius:4px;padding:10px;height:${height - 22}px;box-sizing:border-box}</style>`
    + `<div class="w"><b>${label}</b><svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%;height:${height - 70}px;display:block;margin-top:8px">${bars}</svg></div>`;
  const esc = html.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<iframe data-lexical-iframe-widget="true" sandbox="allow-scripts" srcdoc="${esc}"></iframe>`;
}
