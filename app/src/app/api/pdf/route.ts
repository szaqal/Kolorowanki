import puppeteer from 'puppeteer'

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

  const rowsHtml = Array.from({ length: rows }, (_, r) => {
    const rowLabel = `<div style="width:${indexSize}px;display:flex;align-items:center;justify-content:flex-end;padding-right:3px;font-size:10px;color:#9ca3af;">${r + 1}</div>`
    const rowCells = Array.from({ length: cols }, (_, c) =>
      `<div style="width:${cellSize}px;height:${cellSize}px;background:${cells[r * cols + c]};border:1px solid #d1d5db;box-sizing:border-box;"></div>`
    ).join('')
    return rowLabel + rowCells
  }).join('')

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { padding: 20px; }
  .grid {
    display: grid;
    grid-template-columns: ${indexSize}px repeat(${cols}, ${cellSize}px);
    border: 1px solid #9ca3af;
    width: fit-content;
  }
</style>
</head>
<body>
  <div class="grid">${colHeaders}${rowsHtml}</div>
</body>
</html>`

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'domcontentloaded' })

    const gridWidth = indexSize + cols * cellSize + 2
    const gridHeight = indexSize + rows * cellSize + 2

    const pdf = await page.pdf({
      width: `${gridWidth + 40}px`,
      height: `${gridHeight + 40}px`,
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
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
