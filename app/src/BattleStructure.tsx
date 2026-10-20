import { choices, rounds } from './bracket'
import type { Layout } from './event'

type Props = { layout: Layout; name: (id: string) => string; onChange: (layout: Layout) => void; disabled: boolean }

function formatLabel(entrants: number, triples: number) {
  const pairs = (entrants - triples * 3) / 2
  return [pairs ? `${pairs} two-person ${pairs === 1 ? 'battle' : 'battles'}` : '', triples ? `${triples} three-person ${triples === 1 ? 'battle' : 'battles'}` : ''].filter(Boolean).join(' + ')
}

export default function BattleStructure({ layout, name, onChange, disabled }: Props) {
  return <details className="battle-editor" open>
    <summary>Arrange battles</summary>
    <p className="battle-help">One dancer advances from every battle. In a three-person battle, all three compete together.</p>
    {disabled && <p className="battle-help">Update the bracket above to arrange these battles.</p>}
    {!layout.rounds.length && <p className="battle-help">Add at least two dancers to create a battle.</p>}
    <fieldset className="battle-controls" disabled={disabled}>
      {layout.rounds.map((groups, r) => {
        const entrants = groups.reduce((a, b) => a + b, 0)
        const formats = choices(entrants)
        const mixed = groups.includes(2) && groups.includes(3)
        const title = groups.length === 1 ? 'Final' : groups.length === 2 ? 'Semifinals' : groups.length === 4 ? 'Quarterfinals' : 'Battles'
        let offset = 0
        return <section className="battle-round" key={r}>
          <header><span className="round-number">{r + 1}</span><div><h3>{title}</h3><p>{entrants} dancers <span aria-hidden="true">→</span> {groups.length === 1 ? '1 champion' : `${groups.length} advance`}</p></div></header>
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
              return <li key={battle} className={size === 3 ? 'battle-card three-person' : 'battle-card'}>
                <div className="battle-card-heading"><strong>Battle {battle + 1}</strong><span>{size === 3 ? '3 together' : '1 vs 1'}</span></div>
                {r === 0 ? <ul className="battle-dancers">{layout.ids.slice(start, start + size).map(id => <li key={id}>{name(id).toUpperCase()}</li>)}</ul> : <p className="battle-sources">Winners of round {r}, battles {Array.from({ length: size }, (_, i) => start + i + 1).join(' + ')}</p>}
                {mixed && size === 3 && <div className="battle-move"><span>Position</span>{[-1, 1].map(dir => <button key={dir} type="button" aria-label={`Move round ${r + 1} battle ${battle + 1} ${dir < 0 ? 'up' : 'down'}`} disabled={battle + dir < 0 || battle + dir >= groups.length || groups[battle + dir] === size} onClick={() => {
                  const next = [...groups]; [next[battle], next[battle + dir]] = [next[battle + dir], next[battle]]
                  onChange({ ...layout, rounds: layout.rounds.map((g, i) => i === r ? next : g) })
                }}>{dir < 0 ? '↑ Up' : '↓ Down'}</button>)}</div>}
              </li>
            })}
          </ol>
          <p className="round-guidance">{mixed ? 'Move a three-person battle up or down to choose its position.' : r === 0 && groups.length > 1 ? 'To change opponents, swap names on the paper.' : groups.length === 1 ? 'The winner is the champion.' : 'Each winner moves to the next round.'}</p>
        </section>
      })}
    </fieldset>
  </details>
}
