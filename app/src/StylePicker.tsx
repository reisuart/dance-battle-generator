import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DanceStyle } from './event'
import './StylePicker.css'

type Props = { styles: DanceStyle[]; selected: string[]; label: string; onChange: (ids: string[]) => void; onManage: () => void }

export default function StylePicker({ styles, selected, label, onChange, onManage }: Props) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ left: 0, top: 0, width: 240, maxHeight: 320 })
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const id = useId()

  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      if (!trigger.current || !menu.current) return
      const rect = trigger.current.getBoundingClientRect()
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) { setOpen(false); return }
      const width = Math.min(Math.max(220, rect.width), window.innerWidth - 16)
      const below = Math.max(0, window.innerHeight - rect.bottom - 14)
      const above = Math.max(0, rect.top - 14)
      const desired = Math.min(320, menu.current.scrollHeight + 2)
      const upwards = below < desired && above > below
      const maxHeight = Math.min(320, upwards ? above : below)
      const top = upwards ? Math.max(8, rect.top - Math.min(desired, maxHeight) - 6) : rect.bottom + 6
      const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
      setPosition(old => old.left === left && old.top === top && old.width === width && old.maxHeight === maxHeight ? old : { left, top, width, maxHeight })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(trigger.current!); observer.observe(menu.current!)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { observer.disconnect(); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const outside = (e: Event) => {
      const target = e.target as Node
      if (!trigger.current?.contains(target) && !menu.current?.contains(target)) setOpen(false)
    }
    const keyboard = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); trigger.current?.focus() }
    }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('focusin', outside)
    document.addEventListener('keydown', keyboard)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); document.removeEventListener('keydown', keyboard) }
  }, [open])

  const text = styles.filter(s => selected.includes(s.id)).map(s => s.name).join(', ') || 'Select styles'
  return <div className="style-picker">
    <button ref={trigger} type="button" className="style-picker-trigger" aria-label={label} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)} onKeyDown={e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); requestAnimationFrame(() => menu.current?.querySelector<HTMLInputElement>('input,button')?.focus()) }
      if (e.key === 'Tab' && !e.shiftKey && open) { e.preventDefault(); menu.current?.querySelector<HTMLInputElement>('input,button')?.focus() }
    }} title={text}><span>{text}</span><span aria-hidden="true">⌄</span></button>
    {open && createPortal(<div ref={menu} id={id} className="style-options style-popover" role="group" aria-label={label} style={position}>
      <div className="style-popover-heading">Select styles</div>
      {styles.map(style => <label key={style.id}><input type="checkbox" checked={selected.includes(style.id)} onChange={e => onChange(e.target.checked ? [...selected, style.id] : selected.filter(id => id !== style.id))} />{style.name}</label>)}
      {!styles.length && <button type="button" onClick={() => { setOpen(false); onManage() }}>Add styles first</button>}
      <button type="button" className="style-picker-done" onClick={() => { setOpen(false); trigger.current?.focus() }}>Done</button>
    </div>, document.body)}
  </div>
}
