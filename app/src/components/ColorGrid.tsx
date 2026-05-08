'use client'

import { useState, useCallback } from 'react'

const PALETTE = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
  '#f59e0b', '#6366f1', '#78716c', '#000000',
]

const ERASER = '#ffffff'

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
}

function makeGrid(rows: number, cols: number) {
  return Array(rows * cols).fill(ERASER)
}

export default function ColorGrid() {
  const [rows, setRows] = useState(20)
  const [cols, setCols] = useState(20)
  const [cells, setCells] = useState(() => makeGrid(20, 20))
  const [selectedColor, setSelectedColor] = useState(PALETTE[0])
  const [painting, setPainting] = useState(false)

  const paint = useCallback((i: number) => {
    setCells(prev => {
      const next = [...prev]
      next[i] = selectedColor
      return next
    })
  }, [selectedColor])

  const resizeGrid = (newRows: number, newCols: number) => {
    setRows(newRows)
    setCols(newCols)
    setCells(makeGrid(newRows, newCols))
  }

  const clear = () => setCells(makeGrid(rows, cols))

  const [downloading, setDownloading] = useState(false)

  const downloadPdf = async () => {
    setDownloading(true)
    try {
      const res = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cells, rows, cols }),
      })
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'kolorowanki.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div
      className="flex flex-col gap-4"
      onMouseUp={() => setPainting(false)}
      onMouseLeave={() => setPainting(false)}
    >
      <div className="no-print flex flex-wrap items-center gap-4">
        <div className="flex gap-1">
          {[...PALETTE, ERASER].map(color => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              title={color === ERASER ? 'Eraser' : color}
              className="w-7 h-7 rounded border-2 transition-transform hover:scale-110"
              style={{
                backgroundColor: color,
                borderColor: selectedColor === color ? '#1d4ed8' : '#d1d5db',
                boxShadow: selectedColor === color ? '0 0 0 2px #93c5fd' : undefined,
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-700">
          <label htmlFor="rows">Rows</label>
          <input
            id="rows"
            type="number"
            min={2}
            max={50}
            value={rows}
            onChange={e => resizeGrid(Math.min(50, Math.max(2, Number(e.target.value))), cols)}
            className="w-16 border rounded px-2 py-1 text-center"
          />
          <label htmlFor="cols">Cols</label>
          <input
            id="cols"
            type="number"
            min={2}
            max={50}
            value={cols}
            onChange={e => resizeGrid(rows, Math.min(50, Math.max(2, Number(e.target.value))))}
            className="w-16 border rounded px-2 py-1 text-center"
          />
        </div>

        <button
          onClick={clear}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-100 transition-colors"
        >
          Clear
        </button>

        <button
          onClick={() => window.print()}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Print
        </button>

        <button
          onClick={downloadPdf}
          disabled={downloading}
          className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      <div
        className="border border-gray-400 select-none w-full"
        style={{ display: 'grid', gridTemplateColumns: `auto repeat(${cols}, 1fr)` }}
      >
        <div />
        {Array.from({ length: cols }, (_, c) => (
          <div key={`ch-${c}`} className="text-center text-xs text-gray-400 py-0.5 leading-none">
            {c + 1}
          </div>
        ))}
        {Array.from({ length: rows }, (_, r) => (
          <>
            <div key={`rh-${r}`} className="flex items-center justify-end pr-1 text-xs text-gray-400 leading-none">
              {r + 1}
            </div>
            {Array.from({ length: cols }, (_, c) => {
              const i = r * cols + c
              return (
                <div
                  key={i}
                  style={{ backgroundColor: cells[i], aspectRatio: '1' }}
                  className="border border-gray-200 cursor-crosshair"
                  onMouseDown={() => { setPainting(true); paint(i) }}
                  onMouseEnter={() => { if (painting) paint(i) }}
                />
              )
            })}
          </>
        ))}
      </div>
      {cells.some(c => c !== ERASER) && (
        <div className="text-sm text-gray-700 flex flex-wrap gap-x-3 gap-y-1 mt-1">
          {cells.map((color, i) => {
            if (color === ERASER) return null
            const col = (i % cols) + 1
            const row = Math.floor(i / cols) + 1
            return (
              <span key={i} className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-sm border border-gray-300 shrink-0"
                  style={{ backgroundColor: color }}
                />
                {col},{row} {COLOR_NAMES[color] ?? color}
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}
