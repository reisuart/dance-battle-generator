import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

const PIXELS_PER_MM = 96 / 25.4
const PAGE_WIDTH = 297 * PIXELS_PER_MM
const PAGE_HEIGHT = 210 * PIXELS_PER_MM

// Resize the viewport around the paper, never the paper's own layout.
export default function PaperPreview({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const element = viewport.current
    if (!element) return
    const resize = (width: number) => setScale(Math.min(1, width / PAGE_WIDTH))
    resize(element.getBoundingClientRect().width)
    const observer = new ResizeObserver(entries => resize(entries[0].contentRect.width))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <div ref={viewport} className="paper-preview" style={{ height: PAGE_HEIGHT * scale }}>
    <div className="paper-preview-transform" style={{ transform: `scale(${scale})` }}>{children}</div>
  </div>
}
