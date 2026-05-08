import puppeteer from 'puppeteer'

const COLOR_NAMES: Record<string, string> = {
  '#ef4444': 'czerwony',
  '#f97316': 'pomarańczowy',
  '#eab308': 'żółty',
  '#22c55e': 'zielony',
  '#3b82f6': 'niebieski',
  '#8b5cf6': 'fioletowy',
  '#ec4899': 'różowy',
  '#14b8a6': 'turkusowy',
  '#f59e0b': 'bursztynowy',
  '#6366f1': 'indygo',
  '#78716c': 'szary',
  '#000000': 'czarny',
  '#b45309': 'brązowy',
  '#1e3a8a': 'granatowy',
  '#0ea5e9': 'błękitny',
  '#84cc16': 'limonkowy',
  '#991b1b': 'bordowy',
  '#374151': 'ciemnoszary',
}

const ERASER = '#ffffff'

export async function POST(request: Request) {
  const { cells, rows, cols } = await request.json() as {
    cells: string[]
    rows: number
    cols: number
  }

  const cellSize = Math.floor(Math.min(700 / cols, 700 / rows))
  const indexSize = 18

  const colHeaders = `<div></div>` +
    Array.from({ length: cols }, (_, c) =>
      `<div style="width:${cellSize}px;text-align:center;font-size:10px;color:#9ca3af;padding:2px 0;">${c + 1}</div>`
    ).join('')

  function buildRowsHtml(colored: boolean) {
    return Array.from({ length: rows }, (_, r) => {
      const rowLabel = `<div style="width:${indexSize}px;display:flex;align-items:center;justify-content:flex-end;padding-right:3px;font-size:10px;color:#9ca3af;">${r + 1}</div>`
      const rowCells = Array.from({ length: cols }, (_, c) => {
        const bg = colored ? cells[r * cols + c] : ERASER
        return `<div style="width:${cellSize}px;height:${cellSize}px;background:${bg};border:1px solid #d1d5db;box-sizing:border-box;"></div>`
      }).join('')
      return rowLabel + rowCells
    }).join('')
  }

  const paintedHtml = cells
    .map((color, i) => {
      if (color === ERASER) return ''
      const col = (i % cols) + 1
      const row = Math.floor(i / cols) + 1
      const name = COLOR_NAMES[color] ?? color
      return `<span style="display:inline-flex;align-items:center;gap:3px;margin-right:12px;white-space:nowrap;">` +
        `<span style="display:inline-block;width:10px;height:10px;background:${color};border:1px solid #d1d5db;border-radius:2px;"></span>` +
        `${col},${row} ${name}</span>`
    })
    .join('')

  const gridWidth = indexSize + cols * cellSize + 2

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; }
  .page {
    width: ${gridWidth}px;
    padding: 20px;
    page-break-after: always;
  }
  .page:last-child { page-break-after: avoid; }
  .grid {
    display: grid;
    grid-template-columns: ${indexSize}px repeat(${cols}, ${cellSize}px);
    border: 1px solid #9ca3af;
    width: fit-content;
  }
  .coords {
    margin-top: 12px;
    font-size: 11px;
    color: #374151;
    line-height: 1.8;
  }
</style>
</head>
<body>
  <div class="page">
    <div class="grid">${colHeaders}${buildRowsHtml(true)}</div>
  </div>
  <div class="page">
    <div class="grid">${colHeaders}${buildRowsHtml(false)}</div>
    ${paintedHtml ? `<div class="coords">${paintedHtml}</div>` : ''}
  </div>
</body>
</html>`

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    const pdf = await page.pdf({
      width: `${gridWidth + 40}px`,
      height: undefined,
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    })

    return new Response(pdf.buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="kolorowanki.pdf"',
      },
    })
  } finally {
    await browser.close()
  }
}
