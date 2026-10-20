import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUp, ArrowUpDown, GripVertical, Plus, X } from 'lucide-react'
import './fonts/montserrat/index.css'
import { rounds } from './bracket'
import BattleStructure from './BattleStructure'
import PaperPreview from './PaperPreview'
import StylePicker, { SelectOverlay } from './StylePicker'
import { age, categories, division, fresh, getLayout, normalize, parseEvent, participants, pendingPeople, sortPeopleByAge, stale, STORAGE_KEY } from './event'
import type { BattleEvent, Category, DanceStyle, Layout, Person } from './event'
import './App.css'
import './Sidebar.css'
import './Theme.css'

const SIDEBAR_TABS = [
  { id: 'participants', label: 'Participants' },
  { id: 'judges', label: 'Judges' },
  { id: 'battles', label: 'Battle settings' },
] as const

function load(): { event: BattleEvent; error: boolean } {
  try { const raw = localStorage.getItem(STORAGE_KEY); return { event: raw ? parseEvent(JSON.parse(raw)) : fresh(), error: false } }
  catch { return { event: fresh(), error: true } }
}

function BracketName({ text, x, y, width }: { text: string; x: number; y: number; width: number }) {
  const ref = useRef<SVGTextElement>(null)
  useEffect(() => {
    let cancelled = false
    void document.fonts.load('700 18px "Montserrat Variable"', text).then(() => {
      const node = ref.current
      if (!node || cancelled) return
      // Canvas also measures the hidden print copy, whose SVG has no screen dimensions.
      const context = document.createElement('canvas').getContext('2d')
      if (!context) return
      context.font = '700 18px "Montserrat Variable"'
      const measuredWidth = context.measureText(text).width
      node.setAttribute('font-size', String(measuredWidth > width ? 18 * width / measuredWidth : 18))
    }).catch(() => { /* The Print button reports a font-loading failure. */ })
    return () => { cancelled = true }
  }, [text, width])
  return <text ref={ref} className="printed-name" x={x} y={y} dominantBaseline="central" fontWeight="700" fontSize="18">{text}</text>
}

function App() {
  const [initial] = useState(load)
  const [event, setEvent] = useState(initial.event)
  const [tab, setTab] = useState('registration')
  const [sidebarTab, setSidebarTab] = useState<typeof SIDEBAR_TABS[number]['id']>('participants')
  const [categoryId, setCategoryId] = useState('')
  const [selected, setSelected] = useState('')
  const [message, setMessage] = useState(initial.error ? 'The saved event could not be read. It has not been overwritten. Import a backup or reload before editing.' : '')
  const [saveBlocked, setSaveBlocked] = useState(initial.error)
  const [saved, setSaved] = useState(!initial.error)
  const [all, setAll] = useState(false)
  const [newStyle, setNewStyle] = useState('')
  const [filter, setFilter] = useState('all')
  const [ageSort, setAgeSort] = useState<'none' | 'ascending' | 'descending'>('none')
  const groups = categories(event)
  const active = groups.find(c => c.id === categoryId) || groups[0]
  const layout = active ? getLayout(event, active) : null
  const hasDivisions = event.styles.some(s => s.split)
  const pending = event.styles.flatMap(s => pendingPeople(event, s).map(p => ({ person: p, style: s })))
  const visiblePeople = sortPeopleByAge(event.people.filter(p => filter === 'all' || groups.some(c => c.id === filter && p.styles.includes(c.style.id) && division(p, c.style, event.year) === c.division) || filter === 'pending' && event.styles.some(s => p.styles.includes(s.id) && division(p, s, event.year) === 'pending')), event.year, ageSort)

  useEffect(() => {
    if (saveBlocked) return
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(event)); setSaved(true) } catch { setSaved(false) }
  }, [event, saveBlocked])
  useEffect(() => {
    const reset = () => setAll(false)
    window.addEventListener('afterprint', reset)
    return () => window.removeEventListener('afterprint', reset)
  }, [])

  const saveLayout = (next: Layout) => {
    if (active) setEvent(e => ({ ...e, layouts: { ...e.layouts, [active.id]: next } }))
  }
  const name = (id: string) => { const p = event.people.find(p => p.id === id); return p ? p.nickname || p.name : 'Removed dancer' }
  const swap = (id: string, index: number) => {
    if (!active || !layout || stale(event, active)) return
    const ids = [...layout.ids], from = ids.indexOf(id)
    if (from < 0) return
    const previous = ids[index]
    ids[index] = ids[from]; ids[from] = previous
    saveLayout({ ...layout, ids }); setSelected('')
  }
  const update = (id: string, field: keyof Person, value: string | string[]) => setEvent(e => ({ ...e, people: e.people.map(p => p.id === id ? { ...p, [field]: value } : p) }))
  const setStyle = (id: string, patch: Partial<DanceStyle>) => {
    setEvent(e => ({ ...e, styles: e.styles.map(s => s.id === id ? { ...s, ...patch } : s) }))
    setSelected(''); setFilter('all')
  }
  const renameStyle = (id: string, value: string): boolean => {
    const name = value.trim()
    if (!name || name.includes(',') || event.styles.some(s => s.id !== id && normalize(s.name) === normalize(name))) {
      setMessage('Choose a unique style name without commas.'); return false
    }
    setStyle(id, { name }); return true
  }
  const addStyle = () => {
    const name = newStyle.trim()
    if (!name || name.includes(',') || event.styles.some(s => normalize(s.name) === normalize(name))) { setMessage('Choose a unique style name without commas.'); return }
    setEvent(e => ({ ...e, styles: [...e.styles, { id: crypto.randomUUID(), name, split: false, cutoff: 18 }] }))
    setNewStyle('')
  }
  const exportEvent = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(event, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a'); a.href = url; a.download = 'dance-battle-event.json'; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const print = async (every: boolean) => {
    const targets = every ? groups.filter(c => participants(event, c).length) : active ? [active] : []
    const affectedStyles = new Set(targets.map(c => c.style.id))
    if (pending.some(p => every || affectedStyles.has(p.style.id))) { setMessage('Add valid birth years for dancers awaiting age divisions before printing this style.'); return }
    if (targets.some(c => stale(event, c))) { setMessage('Registration or age divisions changed. Update the affected brackets before printing.'); return }
    try {
      await Promise.all([document.fonts.load('400 16px "Montserrat Variable"'), document.fonts.load('700 18px "Montserrat Variable"')])
      await document.fonts.ready
      setAll(every); setTimeout(() => window.print(), 100)
    } catch { setMessage('The print font could not load. Refresh the page and try printing again.') }
  }

  function paper(category: Category) {
    const l = getLayout(event, category), height = Math.max(480, l.ids.length * 60) + 50
    const boxHeight = 48, verticalEdge = 1
    const columns: { text: string; y: number; id?: string }[][] = [l.ids.map((id, i) => ({
      text: name(id).toUpperCase(),
      y: l.ids.length === 1 ? (height - boxHeight) / 2 : verticalEdge + i * (height - boxHeight - verticalEdge * 2) / (l.ids.length - 1),
      id,
    }))]
    l.rounds.forEach((g, r) => {
      let offset = 0
      columns.push(g.map(n => { const inputs = columns[r].slice(offset, offset + n); offset += n; return { text: '', y: inputs.reduce((a, p) => a + p.y, 0) / n } }))
    })
    const width = 1000, gap = 32, edge = 1, cornerRadius = 4
    const boxWidth = (width - edge * 2 - gap * (columns.length - 1)) / columns.length
    const x = (r: number) => edge + r * (boxWidth + gap)
    return <article className="paper" key={category.id}>
      <div className="judges"><b>JUDGES</b>{l.judges.map((judge, i) => <span className="judge-box" key={i}>{judge.trim().toUpperCase() || '\u00a0'}</span>)}</div>
      <h2>{category.style.name.toUpperCase()} <span>BATTLE 1VS1</span></h2>
      {category.division !== 'all' && <div className="division-heading">{category.division === 'under' ? `UNDER ${category.style.cutoff}` : `OVER ${category.style.cutoff} · AGE ${category.style.cutoff}+`}</div>}
      {l.ids.length ? <svg viewBox={`0 0 ${width} ${height}`} aria-label={`${category.label} bracket`}>
        {l.rounds.flatMap((g, r) => {
          let offset = 0
          return g.flatMap((n, b) => {
            const inputs = columns[r].slice(offset, offset + n); offset += n
            return inputs.map((p, k) => {
              const startX = x(r) + boxWidth, endX = x(r + 1), midX = startX + gap / 2
              const startY = p.y + 24, endY = columns[r + 1][b].y + 24
              const direction = Math.sign(endY - startY)
              const radius = Math.min(cornerRadius, Math.abs(endY - startY) / 2)
              const path = radius === 0 ? `M ${startX} ${startY} H ${endX}`
                : `M ${startX} ${startY} H ${midX - radius} Q ${midX} ${startY} ${midX} ${startY + direction * radius} V ${endY - direction * radius} Q ${midX} ${endY} ${midX + radius} ${endY} H ${endX}`
              return <path key={`${r}-${b}-${k}`} d={path} fill="none" stroke="#a0a5a0" strokeWidth="1.5" />
            })
          })
        })}
        {columns.flatMap((col, r) => col.map((p, i) => <g key={`${r}-${i}`}>
          <rect x={x(r)} y={p.y} width={boxWidth} height="48" rx={cornerRadius} fill="white" stroke={r === 0 && selected === p.id ? '#d97947' : '#969d95'} strokeWidth="1.5" />
          {r === 0 && <>
            <foreignObject className="interactive-slot" x={x(r) + 4} y={p.y + 2} width={boxWidth - 8} height="44">
              <button className="slot" title={p.text} aria-label={p.text} draggable onDragStart={e => e.dataTransfer.setData('text/plain', p.id!)} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (category.id === active?.id) swap(e.dataTransfer.getData('text/plain'), i) }} onClick={() => category.id === active?.id && (selected ? swap(selected, i) : setSelected(p.id!))} />
            </foreignObject>
            <BracketName text={p.text} x={x(r) + 9} y={p.y + 24} width={boxWidth - 18} />
          </>}
        </g>))}
      </svg> : <div className="empty">No dancers in this category yet.</div>}
    </article>
  }

  return <>
    <header className="app-header">
      <div className="brand"><b>DB↗</b><div>Dance Battle Generator<small>THE LINEUP STARTS HERE</small></div></div>
      <div className="actions"><span className="save-status">{saved ? 'Saved on this browser' : 'Save unavailable — export a backup'}</span><button onClick={exportEvent}>Export event</button>
        <label className="button">Import event<input hidden type="file" accept=".json" onChange={async e => {
          const file = e.target.files?.[0]; if (!file) return
          try {
            const next = parseEvent(JSON.parse(await file.text()))
            if (confirm('Replace this event with the imported event?')) { setEvent(next); setSaveBlocked(false); setSelected(''); setFilter('all'); setCategoryId(''); setMessage('Event imported.') }
          } catch { setMessage('This is not a valid Dance Battle event file.') }
          e.target.value = ''
        }} /></label>
      </div>
    </header>
    <main>
      <nav className="tabs">
        <button className={tab === 'styles' ? 'active' : ''} onClick={() => setTab('styles')}>01 / Styles & divisions</button>
        <button className={tab === 'registration' ? 'active' : ''} onClick={() => setTab('registration')}>02 / Registration</button>
        <button className={tab === 'brackets' ? 'active' : ''} onClick={() => setTab('brackets')}>03 / Brackets & print</button>
      </nav>
      {message && <div className="notice" role="status">{message}<button onClick={() => setMessage('')}>Dismiss</button></div>}
      {tab === 'styles' && <section className="panel">
        <div className="panel-head"><div><h2>Styles & age divisions</h2><p>Define styles once, then select them for each dancer. Age divisions are optional for each style.</p></div></div>
        <div className="age-reference"><label>AGE REFERENCE YEAR<input type="number" min="1900" max="2200" value={event.year} onChange={e => { const year = Number(e.target.value); if (year >= 1900 && year <= 2200) setEvent({ ...event, year }) }} /></label><p>Age is the age a dancer turns in this year.</p></div>
        <div className="style-config-list">{event.styles.map(s => {
          const count = event.people.filter(p => p.styles.includes(s.id)).length
          return <section className="style-config" key={s.id}>
            <div className="style-config-name"><label>STYLE NAME<input aria-label={`Style name: ${s.name}`} key={s.name} defaultValue={s.name} onBlur={e => { if (e.target.value !== s.name && !renameStyle(s.id, e.target.value)) e.target.value = s.name }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} /></label><small>{count} registered</small></div>
            <label className="toggle"><input type="checkbox" checked={s.split} onChange={e => setStyle(s.id, { split: e.target.checked })} />Split into Under / Over</label>
            {s.split ? <div className="cutoff"><label>AGE CUTOFF<input type="number" min="1" max="120" aria-label={`Age cutoff for ${s.name}`} key={s.cutoff} defaultValue={s.cutoff} onBlur={e => { const n = Number(e.target.value); if (Number.isInteger(n) && n >= 1 && n <= 120) setStyle(s.id, { cutoff: n }); else { e.target.value = String(s.cutoff); setMessage('The age cutoff must be a whole number from 1 to 120.') } }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} /></label><p>Under {s.cutoff}: ages below {s.cutoff}.<br />Over {s.cutoff}: ages {s.cutoff} and above.</p></div> : <p className="all-ages">All ages in one bracket.</p>}
            <button disabled={count > 0} title={count ? 'Remove this style from dancers before deleting it.' : 'Remove unused style'} onClick={() => { if (confirm(`Remove ${s.name}?`)) { setEvent(e => ({ ...e, styles: e.styles.filter(x => x.id !== s.id) })); setFilter('all') } }}>Remove</button>
          </section>
        })}</div>
        <form className="add-style" onSubmit={e => { e.preventDefault(); addStyle() }}><label>NEW STYLE<input value={newStyle} onChange={e => setNewStyle(e.target.value)} placeholder="e.g. House" /></label><button className="primary" type="submit"><Plus size={16} aria-hidden="true" /> Add style</button></form>
        <div className="panel-bottom">Changing age divisions keeps registrations. Existing brackets may need updating.<button onClick={() => setTab('registration')}>Go to registration <ArrowRight size={15} aria-hidden="true" /></button></div>
      </section>}
      {tab === 'registration' && <section className="panel">
        <div className="panel-head"><div><h2>The registration desk</h2><p>Select one or more styles from each dancer’s dropdown.</p></div><div className="actions"><button onClick={() => setTab('styles')}>Manage styles</button><button className="primary" onClick={() => { setFilter('all'); setEvent({ ...event, people: [...event.people, { id: crypto.randomUUID(), name: '', nickname: '', birth: '', styles: [] }] }) }}><Plus size={16} aria-hidden="true" /> Add dancer</button></div></div>
        <div className="registration-filter"><div className="registration-filter-control"><span className="control-label">SHOW REGISTRATIONS</span><SelectOverlay label="Show registrations" options={[{ id: 'all', name: 'All dancers' }, ...groups.map(c => ({ id: c.id, name: c.label })), ...(pending.length || filter === 'pending' ? [{ id: 'pending', name: 'Missing or invalid birth year' }] : [])]} selected={[filter]} onChange={ids => setFilter(ids[0])} /></div><span>{visiblePeople.length} dancers shown</span></div>
        {pending.length > 0 && <div className="warning registration-warning">{new Set(pending.map(p => p.person.id)).size} dancers need a valid birth year to join age-divided brackets. <button onClick={() => setFilter('pending')}>Show dancers</button></div>}
        {ageSort !== 'none' && <div className="registration-sort-status"><span role="status">{ageSort === 'ascending' ? 'Youngest first' : 'Oldest first'} · Missing birth years last</span><button onClick={() => setAgeSort('none')}>Reset order</button></div>}
        <div className="table-wrap"><table><thead><tr><th>#</th><th>Full name</th><th>Nickname</th><th>Birth year</th><th aria-sort={ageSort}><button className="age-sort" title={ageSort === 'ascending' ? 'Sort oldest first' : 'Sort youngest first'} onClick={() => setAgeSort(ageSort === 'ascending' ? 'descending' : 'ascending')}>Age {ageSort === 'ascending' ? <ArrowUp size={14} aria-hidden="true" /> : ageSort === 'descending' ? <ArrowDown size={14} aria-hidden="true" /> : <ArrowUpDown size={14} aria-hidden="true" />}</button></th><th>Styles</th>{hasDivisions && <th>Age divisions</th>}<th /></tr></thead><tbody>
          {visiblePeople.map(p => {
            const i = event.people.findIndex(person => person.id === p.id)
            return <tr key={p.id}><td>{String(i + 1).padStart(2, '0')}</td>
              {(['name', 'nickname', 'birth'] as const).map(field => <td key={field}><input aria-label={`${field} for dancer ${i + 1}`} type={field === 'birth' ? 'number' : 'text'} min={field === 'birth' ? 1900 : undefined} max={field === 'birth' ? event.year : undefined} value={p[field]} placeholder={field === 'birth' ? '2000' : field === 'name' ? 'Dancer name' : 'Stage name'} onChange={e => update(p.id, field, e.target.value)} /></td>)}
              <td className="age">{age(p, event.year) ?? '—'}</td>
              <td><StylePicker styles={event.styles} selected={p.styles} label={`Styles for dancer ${i + 1}`} onChange={ids => update(p.id, 'styles', ids)} onManage={() => setTab('styles')} /></td>
              {hasDivisions && <td className="division-cell">{event.styles.filter(s => s.split && p.styles.includes(s.id)).map(s => <span className={division(p, s, event.year) === 'pending' ? 'division-badge pending' : 'division-badge'} key={s.id}>{s.name} · {division(p, s, event.year) === 'pending' ? 'Birth year needed' : division(p, s, event.year) === 'under' ? `Under ${s.cutoff}` : `Over ${s.cutoff} (${s.cutoff}+)`}</span>)}</td>}
              <td><button className="remove" aria-label={`Remove dancer ${i + 1}`} onClick={() => { if (confirm(`Remove ${p.nickname || p.name || 'this dancer'}?`)) setEvent({ ...event, people: event.people.filter(d => d.id !== p.id) }) }}><X size={16} aria-hidden="true" /></button></td>
            </tr>
          })}
        </tbody></table></div>
        {!visiblePeople.length && <div className="empty"><strong>{event.people.length ? 'No dancers in this category.' : 'Every battle starts with a name.'}</strong><p>{event.people.length ? 'Choose another filter or update registrations.' : 'Add your first dancer to get started.'}</p></div>}
        <div className="panel-bottom">Brackets use nicknames when provided, otherwise full names.<button onClick={() => setTab('brackets')}>Arrange brackets <ArrowRight size={15} aria-hidden="true" /></button></div>
      </section>}
      {tab === 'brackets' && <>
        <div className="toolbar"><div className="style-tabs">{groups.map(c => <button key={c.id} className={c.id === active?.id ? 'active' : ''} onClick={() => { setCategoryId(c.id); setSelected('') }}>{c.label} <small>{participants(event, c).length}</small></button>)}</div><div className="actions"><button disabled={!groups.some(c => participants(event, c).length)} onClick={() => print(true)}>Print all categories</button><button className="primary" disabled={!active || !participants(event, active).length} onClick={() => print(false)}>Print / Save PDF</button></div></div>
        {pending.length > 0 && <div className="warning">Some dancers are waiting for a birth year before they can be placed in Under / Over brackets. <button onClick={() => { setFilter('pending'); setTab('registration') }}>Review registration</button></div>}
        {!active || !layout ? <div className="panel empty">Define a dance style to create brackets.</div> : <div className="workspace">
          <aside className="sidebar"><div className="eyebrow">YOUR LINEUP</div><h2>{active.label}</h2>
            {stale(event, active) && <div className="warning">Registration or age divisions changed. Update this bracket before arranging or printing.<button onClick={() => { if (confirm('Rebuild this bracket? Manual placements will reset.')) saveLayout({ ids: participants(event, active).map(p => p.id), rounds: rounds(participants(event, active).length), judges: layout.judges }) }}>Update bracket</button></div>}
            <div className="sidebar-tabs" role="tablist" aria-label="Bracket editor sections">
              {SIDEBAR_TABS.map((item, i) => <button type="button" key={item.id} id={`sidebar-tab-${item.id}`} role="tab" aria-selected={sidebarTab === item.id} aria-controls={`sidebar-panel-${item.id}`} tabIndex={sidebarTab === item.id ? 0 : -1} onClick={() => { setSidebarTab(item.id); setSelected('') }} onKeyDown={e => {
                let next = i
                if (e.key === 'ArrowRight') next = (i + 1) % SIDEBAR_TABS.length
                else if (e.key === 'ArrowLeft') next = (i + SIDEBAR_TABS.length - 1) % SIDEBAR_TABS.length
                else if (e.key === 'Home') next = 0
                else if (e.key === 'End') next = SIDEBAR_TABS.length - 1
                else return
                e.preventDefault(); setSidebarTab(SIDEBAR_TABS[next].id); setSelected('')
                document.getElementById(`sidebar-tab-${SIDEBAR_TABS[next].id}`)?.focus()
              }}>{item.label}</button>)}
            </div>
            <section className="sidebar-panel" key={`${active.id}-${sidebarTab}`} id={`sidebar-panel-${sidebarTab}`} role="tabpanel" aria-labelledby={`sidebar-tab-${sidebarTab}`} tabIndex={0}>
            {sidebarTab === 'participants' && <>
              <p>Drag a name onto a slot to swap. Or click a name, then a slot.</p>
              <div className="participant-count">{participants(event, active).length} participants</div>
              <div className="participants">{participants(event, active).map(p => <button key={p.id} draggable className={selected === p.id ? 'chosen' : ''} onDragStart={e => e.dataTransfer.setData('text/plain', p.id)} onClick={() => setSelected(selected === p.id ? '' : p.id)}><GripVertical size={16} className="participant-grip" aria-hidden="true" />{name(p.id)}</button>)}</div>
              {!participants(event, active).length && <p>No participants in this category yet.</p>}
            </>}
            {sidebarTab === 'judges' && <><p>Add one judge per box. Names appear above this category’s bracket.</p><fieldset className="judge-editor"><legend>JUDGES</legend>
              {layout.judges.map((judge, i) => <div className="judge-input" key={i}>
                <input aria-label={`Judge ${i + 1}`} value={judge} placeholder={`Judge ${i + 1}`} onChange={e => saveLayout({ ...layout, judges: layout.judges.map((name, j) => j === i ? e.target.value : name) })} />
                <button className="remove" aria-label={`Remove judge ${i + 1}`} onClick={() => saveLayout({ ...layout, judges: layout.judges.filter((_, j) => j !== i) })}><X size={16} aria-hidden="true" /></button>
              </div>)}
              <button className="add-judge" onClick={() => saveLayout({ ...layout, judges: [...layout.judges, ''] })}><Plus size={14} aria-hidden="true" /> Add judge</button>
            </fieldset></>}
            {sidebarTab === 'battles' && <BattleStructure layout={layout} name={name} onChange={saveLayout} disabled={stale(event, active)} />}
            </section>
          </aside>
          <section className="canvas"><div className="canvas-label"><span>PRINT PREVIEW / A4 LANDSCAPE</span><span>Winner boxes stay blank for handwriting</span></div>{layout.ids.length > 16 && <div className="warning">More than 16 dancers: names will print smaller on one A4 page. Multi-page brackets are planned.</div>}<PaperPreview>{paper(active)}</PaperPreview></section>
        </div>}
      </>}
    </main>
    <div className="print-area">{(all ? groups.filter(c => participants(event, c).length) : active ? [active] : []).map(paper)}</div>
  </>
}
export default App
