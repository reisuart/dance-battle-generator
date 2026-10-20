import fontStyles from './fonts/archivo-black/index.css?inline'
import sheetStyles from './StickerSheet.css?inline'

// Print a standalone document: no landscape bracket rules, editor layout, or named-page transitions.
export async function printStickers(source: HTMLElement, characters: string, onAfterPrint?: () => void): Promise<void> {
  const frame = document.createElement('iframe')
  frame.title = 'Sticker print document'
  frame.tabIndex = -1
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:210mm;height:297mm;border:0;pointer-events:none'
  document.body.append(frame)
  const cleanup = () => frame.remove()
  try {
    const doc = frame.contentDocument!, view = frame.contentWindow!
    doc.open()
    doc.write('<!doctype html><html><head><meta charset="utf-8"><title>Dancer stickers</title></head><body></body></html>')
    doc.close()
    const base = doc.createElement('base')
    base.href = document.baseURI
    doc.head.append(base)
    const style = doc.createElement('style')
    style.textContent = `${fontStyles}\n${sheetStyles}\n*{box-sizing:border-box}html,body{margin:0!important;padding:0!important;background:#fff;color:#000} @page{size:A4 portrait;margin:0} .sticker-sheet{page:auto}`
    doc.head.append(style)
    for (const sheet of source.children) doc.body.append(doc.importNode(sheet, true))
    await doc.fonts.load('400 50px "Archivo Black"', characters)
    await doc.fonts.ready
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    view.addEventListener('afterprint', () => { cleanup(); onAfterPrint?.() }, { once: true })
    view.focus()
    view.print()
  } catch (error) { cleanup(); throw error }
}
