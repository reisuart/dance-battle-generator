import { useState } from 'react'
import { PencilLine, Plus, Users, X } from 'lucide-react'
import { age, categoryLabel, duoAge, duoDivision, duoError, named } from './event'
import type { BattleEvent, Duo } from './event'
import { SelectOverlay } from './StylePicker'

const blank = () => ({ name: '', styleId: '', first: '', second: '' })
export default function DuosRegistration({ event, onChange, onSettings }: { event: BattleEvent; onChange: (event: BattleEvent) => void; onSettings: () => void }) {
  const [draft, setDraft] = useState(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const duos = event.duos || []
  const styles = event.styles.filter(s => s.duos)
  const styleId = draft.styleId || styles[0]?.id || ''
  const style = event.styles.find(s => s.id === styleId)
  const busy = new Set(duos.filter(d => d.styleId === styleId && d.id !== editing).flatMap(d => d.members))
  const people = event.people.filter(p => named(p) && !busy.has(p.id))
  const memberOptions = (other: string) => [{ id: '', name: 'Select dancer' }, ...people.filter(p => p.id !== other).map(p => ({ id: p.id, name: `${p.name || p.nickname}${p.name && p.nickname ? ` (${p.nickname})` : ''} · ${age(p, event.year) === null ? 'age unknown' : `age ${age(p, event.year)}`}` }))]
  const average = draft.first && draft.second ? duoAge(event, { id: editing || '', name: draft.name, styleId, members: [draft.first, draft.second] }) : null
  const reset = () => { setDraft(blank()); setEditing(null); setError('') }
  const save = () => {
    const duo: Duo = { id: editing || `duo:${crypto.randomUUID()}`, name: draft.name.trim(), styleId, members: [draft.first, draft.second] }
    const issue = !style?.duos ? 'Enable 2vs2 for this style in Event settings.' : duoError(event, duo)
    if (issue) { setError(issue); return }
    onChange({ ...event, duos: editing ? duos.map(d => d.id === editing ? duo : d) : [...duos, duo] })
    reset()
  }

  return <section className="panel">
    <div className="panel-head"><div><h2>Duos · 2vs2</h2><p>Register dancers individually, then pair them under their custom duo name. Duo entries do not produce stickers.</p></div><button onClick={onSettings}>Manage formats</button></div>
    {!styles.length ? <div className="empty"><strong>Enable 2vs2 for a dance style first.</strong><p>In Event settings, choose 2vs2 only or 1vs1 + 2vs2.</p><button onClick={onSettings}>Open Event settings</button></div> : <form className="duo-form" onSubmit={e => { e.preventDefault(); save() }}>
      <h3>{editing ? 'Edit duo' : 'Create a duo'}</h3>
      <div className="duo-form-fields"><label>DUO NAME<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} placeholder="Their chosen group name" /></label><div><span className="settings-field-label">STYLE</span><SelectOverlay label="Duo style" options={styles.map(s => ({ id: s.id, name: s.name }))} selected={[styleId]} onChange={ids => { setDraft({ ...draft, styleId: ids[0], first: '', second: '' }); setError('') }} /></div>
      <div><span className="settings-field-label">FIRST DANCER</span><SelectOverlay label="First duo member" options={memberOptions(draft.second)} selected={[draft.first]} onChange={ids => setDraft({ ...draft, first: ids[0] })} /></div><div><span className="settings-field-label">SECOND DANCER</span><SelectOverlay label="Second duo member" options={memberOptions(draft.first)} selected={[draft.second]} onChange={ids => setDraft({ ...draft, second: ids[0] })} /></div></div>
      <div className="duo-form-bottom"><p>{style?.duoSplit ? average === null ? 'Both dancers need valid birth years for the age division.' : `Average age: ${average}. Category: ${categoryLabel(style, average < (style.duoCutoff ?? style.cutoff) ? 'under' : 'over')}.` : 'All ages together. Birth years are only required if duo age divisions are enabled.'}</p><div className="actions">{editing && <button type="button" onClick={reset}>Cancel</button>}<button type="submit" className="primary"><Plus size={16} aria-hidden="true" />{editing ? 'Save duo' : 'Create duo'}</button></div></div>
      {error && <div className="warning" role="alert">{error}</div>}
      <small>Each dancer can join one duo per style. They can also enter 1vs1 independently.</small>
    </form>}
    <div className="duo-list">{duos.length ? duos.map(duo => {
      const s = event.styles.find(s => s.id === duo.styleId)
      if (!s) return null
      const division = duoDivision(event, duo, s), average = duoAge(event, duo)
      return <article className="duo-card" key={duo.id}><div className="duo-card-top"><div><h3><Users size={18} aria-hidden="true" />{duo.name}</h3><span className="division-badge">{division === 'pending' ? `${s.name} · Check birth years` : categoryLabel(s, division)}<span className="format-tag">2vs2</span></span></div><div className="actions"><button aria-label={`Edit ${duo.name}`} onClick={() => { setEditing(duo.id); setDraft({ name: duo.name, styleId: duo.styleId, first: duo.members[0], second: duo.members[1] }); setError('') }}><PencilLine size={15} aria-hidden="true" /></button><button aria-label={`Remove ${duo.name}`} onClick={() => { if (confirm(`Remove duo ${duo.name}? Both dancers will stay registered.`)) { onChange({ ...event, duos: duos.filter(d => d.id !== duo.id) }); if (editing === duo.id) reset() } }}><X size={16} aria-hidden="true" /></button></div></div>
        <div className="duo-members">{duo.members.map(id => { const p = event.people.find(p => p.id === id); return <span key={id}>{p?.name || p?.nickname || 'Unnamed dancer'}{p?.nickname && p.name ? ` (${p.nickname})` : ''}<small>{p && age(p, event.year) !== null ? `Age ${age(p, event.year)}` : 'Age unknown'}</small></span> })}</div>
        <p>{average === null ? 'Average age unavailable' : `Average age: ${average}`}{!s.duos ? ' · 2vs2 disabled in Event settings' : s.duoSplit ? ' · Average used for division' : ' · No age division'}</p>
      </article>
    }) : <div className="empty">No duos registered yet.</div>}</div>
  </section>
}
