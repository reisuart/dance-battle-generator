import { Fragment, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Printer, ZoomIn, ZoomOut } from 'lucide-react'
import { categories, pendingPeople } from './event'
import type { BattleEvent } from './event'
import { stickerNameLines, stickerSheets } from './stickers'
import { printStickers } from './printStickers'
import type { StickerSheet } from './stickers'
import PaperPreview from './PaperPreview'
import { SelectOverlay } from './StylePicker'
import './fonts/archivo-black/index.css'
import './StickerSheet.css'
import './Stickers.css'

// A label is exactly 105mm wide with 7mm padding on either side.
const TEXT_WIDTH = 91 * 96 / 25.4
function StickerText({ text, size, className, twoLines = false }: { text: string; size: number; className: string; twoLines?: boolean }) {
  const [fit, setFit] = useState({ text, lines: [text], fontSize: size })
  useEffect(() => {
    let cancelled = false
    void document.fonts.load(`400 ${size}px "Archivo Black"`, text).then(() => {
      if (cancelled) return
      const context = document.createElement('canvas').getContext('2d')
      if (!context) return
      context.font = `400 ${size}px "Archivo Black"`
      const measure = (value: string) => context.measureText(value).width
      const lines = twoLines ? stickerNameLines(text, measure, TEXT_WIDTH) : [text]
      const width = Math.max(...lines.map(measure))
      setFit({ text, lines, fontSize: width > TEXT_WIDTH ? size * TEXT_WIDTH / width : size })
    }).catch(() => { /* The print action reports font loading failures. */ })
    return () => { cancelled = true }
  }, [text, size, twoLines])
  return <span className={`sticker-text ${className}`} style={{ fontSize: fit.text === text ? fit.fontSize : size }}>{(fit.text === text ? fit.lines : [text]).map((line, i) => <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>)}</span>
}

function Sheet({ sheet, guides = false }: { sheet: StickerSheet; guides?: boolean }) {
  return <article className={`sticker-sheet${guides ? ' sticker-guides' : ''}`} aria-label={`Sticker sheet ${sheet.page}`}>
    {Array.from({ length: 4 }, (_, i) => {
      const label = sheet.labels[i]
      const heading = label?.category.label.toUpperCase() || ''
      return <section key={i} className="sticker-label" aria-label={label ? `Number ${label.number}, ${label.name}` : 'Unused sticker'}>
        {label && <><div className="sticker-heading"><StickerText text={heading} size={50} className="sticker-style" twoLines /></div><div className="sticker-number-wrap"><StickerText text={String(label.number)} size={90 * 96 / 25.4} className="sticker-number" /></div><StickerText text={label.name} size={50} className="sticker-name" twoLines /></>}
      </section>
    })}
  </article>
}

export default function StickersPage({ event, onReview }: { event: BattleEvent; onReview: () => void }) {
  const [selected, setSelected] = useState('all')
  const [start, setStart] = useState(1)
  const [displayName, setDisplayName] = useState<'nickname' | 'name'>('nickname')
  const [guides, setGuides] = useState(true)
  const [optimize, setOptimize] = useState(false)
  const [previewWidth, setPreviewWidth] = useState(280)
  const [printAll, setPrintAll] = useState(false)
  const [error, setError] = useState('')
  const printSource = useRef<HTMLDivElement>(null)
  const groups = categories(event).filter(c => c.format === 'solo')
  const scope = selected === 'all' || groups.some(c => c.id === selected) ? selected : 'all'
  const sheets = stickerSheets(event, start, displayName, optimize)
  const current = scope === 'all' ? sheets : stickerSheets(event, start, displayName, optimize, [scope])
  const separateCount = stickerSheets(event, start, displayName, false, scope === 'all' ? undefined : [scope]).length
  const labelCount = current.reduce((sum, sheet) => sum + sheet.labels.length, 0)
  const unused = current.length * 4 - labelCount
  const waiting = event.styles.flatMap(style => pendingPeople(event, style))

  useEffect(() => {
    const reset = () => setPrintAll(false)
    window.addEventListener('afterprint', reset)
    return () => window.removeEventListener('afterprint', reset)
  }, [])

  useEffect(() => {
    // Also give Ctrl+P the correct orientation, without conflicting named @page rules.
    const style = document.createElement('style')
    style.textContent = '@page{size:A4 portrait;margin:0}@media print{body>#root{display:none!important}.sticker-print-area{display:block!important}}'
    document.head.append(style)
    document.body.classList.add('stickers-active')
    return () => { style.remove(); document.body.classList.remove('stickers-active') }
  }, [])

  const print = async (all: boolean) => {
    const active = groups.find(c => c.id === scope)
    if (all || scope === 'all' ? waiting.length : active && pendingPeople(event, active.style).length) { setError('Check missing or invalid birth years in Registration before printing age-divided stickers.'); return }
    const target = all ? sheets : current
    if (!target.length) return
    setError(''); setPrintAll(all)
    try {
      const characters = target.flatMap(s => s.labels.map(l => `${l.category.label} ${l.number} ${l.name}`)).join(' ')
      await document.fonts.load('400 50px "Archivo Black"', characters)
      await document.fonts.ready
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
      if (printSource.current) await printStickers(printSource.current, characters, () => setPrintAll(false))
    } catch { setError('The sticker print document could not load. Refresh the page and try again.') }
  }

  return <>
    <div className="sticker-workspace">
    <aside className="panel sticker-controls" aria-label="Sticker print settings" tabIndex={0}>
      <div className="panel-head"><div><h2>Sticker settings</h2><p>Four labels per portrait A4 sheet.</p></div></div>
      <div className="sticker-options"><div className="sticker-category"><span className="sticker-control-label">PRINT CATEGORIES</span><SelectOverlay options={[{ id: 'all', name: 'All categories' }, ...groups.map(c => ({ id: c.id, name: c.label }))]} selected={[scope]} label="Sticker categories" onChange={ids => { setSelected(ids[0]); setError('') }} /></div>
        <label className="sticker-start">START NUMBER<input type="number" min="1" max="9999" key={start} defaultValue={start} onBlur={e => { const value = Number(e.target.value); if (Number.isInteger(value) && value >= 1 && value <= 9999) setStart(value); else e.target.value = String(start) }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} /></label>
        <div className="sticker-name-choice"><span className="sticker-control-label">NAME ON STICKER</span><SelectOverlay label="Name on sticker" options={[{ id: 'nickname', name: 'Nickname, or full name' }, { id: 'name', name: 'Full name, or nickname' }]} selected={[displayName]} onChange={ids => setDisplayName(ids[0] as 'nickname' | 'name')} /></div>
        <label className="toggle sticker-optimize"><input type="checkbox" checked={optimize} onChange={e => setOptimize(e.target.checked)} /><span><strong>Optimize sheets</strong><small>Fill unused labels with the next category. Each sticker keeps its own heading and number.</small></span></label>
        <label className="toggle"><input type="checkbox" checked={guides} onChange={e => setGuides(e.target.checked)} />Show cut guides in preview</label>
      </div>
      <div className="sticker-usage" role="status"><strong>{current.length} {current.length === 1 ? 'sheet' : 'sheets'}</strong><span>{labelCount} labels · {unused} unused {unused === 1 ? 'slot' : 'slots'}</span>{optimize && separateCount > current.length && <span className="sticker-savings">Saves {separateCount - current.length} {separateCount - current.length === 1 ? 'sheet' : 'sheets'}</span>}</div>
      {(waiting.length > 0 || error) && <div className="warning sticker-warning">{error || 'Some dancers need a valid birth year before they can receive an Under / Over sticker.'} <button onClick={onReview}>Review registration</button></div>}
      <div className="sticker-print-note">Print at <strong>100% / Actual size</strong>, A4 portrait, with margins set to none and browser headers/footers off. Each label is <strong>105 × 148.5 mm</strong>. Guides never print.</div>
      <p className="sticker-number-note">Numbers follow registration order and restart per category, even on mixed sheets.</p>
      <div className="sticker-print-actions"><button className="primary" disabled={!current.length} onClick={() => void print(false)}><Printer size={16} aria-hidden="true" />Print / Save PDF</button>{scope !== 'all' && <button disabled={!sheets.length} onClick={() => void print(true)}>Print all categories</button>}</div>
    </aside>
    <section className="panel sticker-preview-panel" aria-label="Sticker page previews">
      <header className="sticker-preview-header"><div className="sticker-preview-title"><h2>Page preview</h2><span>{optimize ? 'Optimized sheets' : 'Separate categories'}</span></div><label className="preview-size-control"><span>Preview size</span><ZoomOut size={16} aria-hidden="true" /><input type="range" min="220" max="600" step="20" value={previewWidth} onChange={e => setPreviewWidth(Number(e.target.value))} aria-label="Preview size" /><ZoomIn size={16} aria-hidden="true" /></label></header>
      <div className="sticker-previews" tabIndex={0} aria-label="Scroll sticker pages">{current.length ? current.map((sheet, i) => <section className="canvas" key={sheet.id} style={{ width: previewWidth }}><div className="canvas-label"><span>{[...new Set(sheet.labels.map(l => l.category.label))].join(' / ')}</span><span>SHEET {i + 1} / {current.length}</span></div><PaperPreview widthMm={210} heightMm={297}><Sheet sheet={sheet} guides={guides} /></PaperPreview></section>) : <div className="empty">No dancers in the selected categories. Register dancers and select their styles to generate stickers.</div>}</div>
    </section>
    </div>
    {createPortal(<div ref={printSource} className="print-area sticker-print-area">{(printAll ? sheets : current).map(sheet => <Sheet sheet={sheet} key={sheet.id} />)}</div>, document.body)}
  </>
}
