import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const PIXELS_PER_MM = 96 / 25.4

// Resize the viewport around the paper, never the paper's own layout.
export default function PaperPreview({ children, widthMm = 297, heightMm = 210 }: { children: ReactNode; widthMm?: number; heightMm?: number }) {
  const pageWidth = widthMm * PIXELS_PER_MM
  const pageHeight = heightMm * PIXELS_PER_MM
  const viewport = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const element = viewport.current
    if (!element) return
    const resize = (width: number) => setScale(Math.min(1, width / pageWidth))
    resize(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(entries => resize(entries[0].contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [pageWidth])

  return <div ref={viewport} className="paper-preview" style={{ height: pageHeight * scale, maxWidth: `${widthMm}mm` }}>
    <div className="paper-preview-transform" style={{ transform: `scale(${scale})`, width: `${widthMm}mm`, height: `${heightMm}mm` }}>{children}</div>
  </div>
}
