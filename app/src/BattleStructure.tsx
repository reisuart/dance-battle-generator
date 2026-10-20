import { Fragment, useState } from 'react'
import { ArrowRight, ChevronDown, ChevronUp, GripVertical } from 'lucide-react'
import { choices, moveBattle, rounds } from './bracket'
import type { Layout } from './event'

type Props = { layout: Layout; name: (id: string) => string; onChange: (layout: Layout) => void; disabled: boolean }

function formatLabel(entrants: number, triples: number) {
  const pairs = (entrants - triples * 3) / 2
  return [pairs ? `${pairs} two-person ${pairs === 1 ? 'battle' : 'battles'}` : '', triples ? `${triples} three-person ${triples === 1 ? 'battle' : 'battles'}` : ''].filter(Boolean).join(' + ')
}

export default function BattleStructure({ layout, name, onChange, disabled }: Props) {
  const [dragging, setDragging] = useState<{ round: number; battle: number } | null>(null)
  const [dropTarget, setDropTarget] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const move = (round: number, from: number, to: number) => {
    if (disabled) return
    onChange(moveBattle(layout, round, from, to))
    setAnnouncement(`Round ${round + 1}: battle ${from + 1} moved to position ${to + 1}.`)
    setDragging(null); setDropTarget(null)
  }
  return <div className="battle-editor">
    <p className="battle-help">One dancer advances from every battle. In a three-person battle, all three compete together.</p>
    {disabled && <p className="battle-help">Update the bracket above to arrange these battles.</p>}
    {!layout.rounds.length && <p className="battle-help">Add at least two dancers to create a battle.</p>}
    <fieldset className="battle-controls" disabled={disabled}>
      {layout.rounds.map((groups, r) => {
        const entrants = groups.reduce((a, b) => a + b, 0)
        const formats = choices(entrants)
        const title = groups.length === 1 ? 'Final' : groups.length === 2 ? 'Semifinals' : groups.length === 4 ? 'Quarterfinals' : 'Battles'
        let offset = 0
        return <details className="battle-round" key={r} open={r === 0}>
          <summary><span className="round-number">{r + 1}</span><span className="round-caption"><strong>{title}</strong><span>{entrants} dancers <ArrowRight size={12} className="round-flow-icon" aria-hidden="true" /> {groups.length === 1 ? '1 champion' : `${groups.length} advance`}</span></span><ChevronDown size={16} className="round-chevron" aria-hidden="true" /></summary>
          {formats.length > 1 ? <fieldset className="battle-format"><legend>BATTLE FORMAT</legend>
            {formats.map(triples => <label className="format-option" key={triples}>
              <input type="radio" name={`round-format-${r}`} checked={groups.filter(n => n === 3).length === triples} onChange={() => {
                const next: number[] = [...Array((entrants - triples * 3) / 2).fill(2), ...Array(triples).fill(3)]
                onChange({ ...layout, rounds: [...layout.rounds.slice(0, r), next, ...rounds(next.length)] })
              }} /><span>{formatLabel(entrants, triples)}</span>
            </label>)}
            <span className="format-hint">Changing the format updates later rounds.</span>
          </fieldset> : <p className="fixed-format">{formatLabel(entrants, groups.filter(n => n === 3).length)}</p>}
          <ol className="battle-cards">
            {groups.map((size, battle) => {
              const start = offset; offset += size
              const contestants = r === 0 ? layout.ids.slice(start, start + size).map(id => name(id).toUpperCase()) : Array.from({ length: size }, (_, i) => `Winner R${r} · Battle ${start + i + 1}`)
              const isDragging = dragging?.round === r && dragging.battle === battle
              const isTarget = dragging?.round === r && dropTarget === battle && !isDragging
              return <li key={battle} className={`battle-card${size === 3 ? ' three-person' : ''}${isDragging ? ' is-dragging' : ''}${isTarget ? ' drop-target' : ''}`} draggable={!disabled && groups.length > 1} onDragStart={e => {
                if (disabled || groups.length < 2) { e.preventDefault(); return }
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('application/x-dance-battle', JSON.stringify({ round: r, battle }))
                setDragging({ round: r, battle }); setDropTarget(null)
              }} onDragOver={e => {
                if (disabled || dragging?.round !== r || dragging.battle === battle) return
                e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropTarget(battle)
              }} onDrop={e => {
                if (disabled || dragging?.round !== r) return
                e.preventDefault(); move(r, dragging.battle, battle)
              }} onDragEnd={() => { setDragging(null); setDropTarget(null) }}>
                <div className="battle-card-heading"><div className="battle-card-title">{groups.length > 1 && <GripVertical className="battle-grip" size={16} aria-hidden="true" />}<strong>Battle {battle + 1}</strong></div><span>{size === 3 ? '3 together' : '1 vs 1'}</span></div>
                <div className={`battle-matchup matchup-${size}`} aria-label={contestants.join(' versus ')}>{contestants.map((person, i) => <Fragment key={i}>{i > 0 && <span className="matchup-vs" aria-hidden="true">vs</span>}<span className="matchup-person">{person}</span></Fragment>)}</div>
                {groups.length > 1 && <div className="battle-move"><span>Drag to reorder</span>{[-1, 1].map(dir => <button className="battle-move-button" key={dir} type="button" draggable={false} title={`Move ${dir < 0 ? 'up' : 'down'}`} aria-label={`Move round ${r + 1} battle ${battle + 1} ${dir < 0 ? 'up' : 'down'}`} disabled={disabled || battle + dir < 0 || battle + dir >= groups.length} onClick={() => move(r, battle, battle + dir)}>{dir < 0 ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}</button>)}</div>}
              </li>
            })}
          </ol>
          <p className="round-guidance">{groups.length === 1 ? 'The winner is the champion.' : 'Drag battles within this round, or use the arrows. Their dancers move together.'}</p>
        </details>
      })}
    </fieldset>
    <span className="battle-announcement" role="status">{announcement}</span>
  </div>
}
