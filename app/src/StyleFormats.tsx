import type { DanceStyle } from './event'
import { SelectOverlay } from './StylePicker'

export default function StyleFormats({ style, onChange }: { style: DanceStyle; onChange: (patch: Partial<DanceStyle>) => void }) {
  const format = style.duos ? style.solo === false ? 'duo' : 'both' : 'solo'
  return <div className="style-formats">
    <div className="format-selector"><span className="settings-field-label">BATTLE FORMATS</span><SelectOverlay label={`Battle formats for ${style.name}`} options={[{ id: 'solo', name: '1vs1 only' }, { id: 'both', name: '1vs1 + 2vs2' }, { id: 'duo', name: '2vs2 only' }]} selected={[format]} onChange={ids => onChange({ solo: ids[0] !== 'duo', duos: ids[0] !== 'solo' })} /></div>
    {style.solo !== false && <div className="format-age-setting"><label className="toggle division-switch"><input type="checkbox" checked={style.split} onChange={e => onChange({ split: e.target.checked })} /><span>1vs1 <small>Split into Under / Over</small></span></label>{style.split && <Cutoff label={`${style.name} solo age cutoff`} value={style.cutoff} onChange={cutoff => onChange({ cutoff })} />}<small>{style.split ? `Under: age below ${style.cutoff}. Over: age ${style.cutoff} and above.` : 'Solo dancers of all ages in one bracket.'}</small></div>}
    {style.duos && <div className="format-age-setting"><label className="toggle division-switch"><input type="checkbox" checked={Boolean(style.duoSplit)} onChange={e => onChange({ duoSplit: e.target.checked })} /><span>2vs2 <small>Split into Under / Over</small></span></label>{style.duoSplit && <Cutoff label={`${style.name} duo average age cutoff`} value={style.duoCutoff ?? style.cutoff} onChange={duoCutoff => onChange({ duoCutoff })} />}<small>{style.duoSplit ? `Use both ages’ exact average. Under: below ${style.duoCutoff ?? style.cutoff}. Over: at or above it.` : 'No age divisions for duos. Enable only if needed.'}</small></div>}
  </div>
}

function Cutoff({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="format-cutoff">AGE CUTOFF<input aria-label={label} type="number" min="1" max="120" key={value} defaultValue={value} onBlur={e => { const n = Number(e.target.value); if (Number.isInteger(n) && n >= 1 && n <= 120) onChange(n); else e.target.value = String(value) }} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }} /></label>
}

