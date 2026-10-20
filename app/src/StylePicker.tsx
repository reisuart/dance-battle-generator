import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import type { DanceStyle } from './event'
import './StylePicker.css'

type Props = { styles: DanceStyle[]; selected: string[]; label: string; onChange: (ids: string[]) => void; onManage: () => void }
type SelectProps = { options: { id: string; name: string }[]; selected: string[]; label: string; onChange: (ids: string[]) => void; multiple?: boolean; onManage?: () => void }

export default function StylePicker({ styles, selected, label, onChange, onManage }: Props) {
  return <SelectOverlay options={styles} selected={selected} label={label} onChange={onChange} multiple onManage={onManage} />
}

export function SelectOverlay({ options, selected, label, onChange, multiple = false, onManage }: SelectProps) {
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

  const text = options.filter(s => selected.includes(s.id)).map(s => s.name).join(', ') || 'Select styles'
  return <div className="style-picker">
    <button ref={trigger} type="button" className="style-picker-trigger" aria-label={label} aria-haspopup={multiple ? undefined : 'menu'} aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)} onKeyDown={e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); requestAnimationFrame(() => menu.current?.querySelector<HTMLInputElement>('input,button')?.focus()) }
      if (e.key === 'Tab' && !e.shiftKey && open) { e.preventDefault(); menu.current?.querySelector<HTMLInputElement>('input,button')?.focus() }
    }} title={text}><span>{text}</span><ChevronDown size={16} aria-hidden="true" /></button>
    {open && createPortal(<div ref={menu} id={id} className="style-options style-popover" role={multiple ? 'group' : 'menu'} aria-label={label} style={position} onKeyDown={e => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return
      const controls = [...menu.current!.querySelectorAll<HTMLElement>('input,button:not(:disabled)')]
      const current = controls.indexOf(document.activeElement as HTMLElement)
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? controls.length - 1 : (current + (e.key === 'ArrowDown' ? 1 : controls.length - 1)) % controls.length
      e.preventDefault(); controls[next]?.focus()
    }}>
      <div className="style-popover-heading">{multiple ? 'Select styles' : label}</div>
      {options.map(option => multiple ? <label key={option.id}><input type="checkbox" checked={selected.includes(option.id)} onChange={e => onChange(e.target.checked ? [...selected, option.id] : selected.filter(id => id !== option.id))} />{option.name}</label> : <button type="button" className="select-overlay-option" role="menuitemradio" aria-checked={selected.includes(option.id)} key={option.id} onClick={() => { onChange([option.id]); setOpen(false); trigger.current?.focus() }}><span>{option.name}</span>{selected.includes(option.id) && <Check size={16} aria-hidden="true" />}</button>)}
      {!options.length && onManage && <button type="button" onClick={() => { setOpen(false); onManage() }}>Add styles first</button>}
      {multiple && <button type="button" className="style-picker-done" onClick={() => { setOpen(false); trigger.current?.focus() }}>Done</button>}
    </div>, document.body)}
  </div>
}
