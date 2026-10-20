import { rounds } from './bracket.ts'

export type Person = { id: string; name: string; nickname: string; birth: string; styles: string[] }
export type DanceStyle = { id: string; name: string; split: boolean; cutoff: number }
export type Layout = { ids: string[]; rounds: number[][]; judges: string }
export type BattleEvent = { version: 2; title: string; year: number; people: Person[]; styles: DanceStyle[]; layouts: Record<string, Layout> }
export type Category = { id: string; style: DanceStyle; division: 'all' | 'under' | 'over'; label: string }

export const STORAGE_KEY = 'dance-battle-v1'
const defaults = (): DanceStyle[] => ['Hip Hop', 'Modern', 'Contemporary'].map((name, i) => ({ id: `style-${i + 1}`, name, split: false, cutoff: 18 }))
export const normalize = (name: string) => name.trim().toLocaleLowerCase()
export const fresh = (): BattleEvent => ({ version: 2, title: 'Dance battle', year: new Date().getFullYear(), people: [], styles: defaults(), layouts: {} })

export function age(person: Person, year: number): number | null {
  if (!/^\d{4}$/.test(person.birth)) return null
  const birth = Number(person.birth)
  return birth >= 1900 && birth <= year ? year - birth : null
}

export function division(person: Person, style: DanceStyle, year: number): 'all' | 'under' | 'over' | 'pending' {
  if (!style.split) return 'all'
  const years = age(person, year)
  return years === null ? 'pending' : years < style.cutoff ? 'under' : 'over'
}

export function categories(event: BattleEvent): Category[] {
  return event.styles.flatMap(style => (style.split ? ['under', 'over'] as const : ['all'] as const).map(d => ({
    id: `${style.id}:${d}`, style, division: d,
    label: style.name + (d === 'all' ? '' : d === 'under' ? ` · Under ${style.cutoff}` : ` · Over ${style.cutoff} (${style.cutoff}+)`),
  })))
}

export const named = (person: Person) => Boolean(person.name.trim() || person.nickname.trim())
export function participants(event: BattleEvent, category: Category): Person[] {
  return event.people.filter(p => named(p) && p.styles.includes(category.style.id) && division(p, category.style, event.year) === category.division)
}
export function pendingPeople(event: BattleEvent, style: DanceStyle): Person[] {
  return event.people.filter(p => named(p) && p.styles.includes(style.id) && division(p, style, event.year) === 'pending')
}
export function getLayout(event: BattleEvent, category: Category): Layout {
  return event.layouts[category.id] || { ids: participants(event, category).map(p => p.id), rounds: rounds(participants(event, category).length), judges: '' }
}
export function stale(event: BattleEvent, category: Category): boolean {
  const ids = participants(event, category).map(p => p.id), layout = getLayout(event, category)
  return ids.length !== layout.ids.length || ids.some(id => !layout.ids.includes(id))
}

function object(v: unknown): v is Record<string, unknown> { return Boolean(v) && typeof v === 'object' && !Array.isArray(v) }
function validLayouts(value: unknown): value is Record<string, Layout> {
  if (!object(value)) return false
  return Object.values(value).every(l => {
    if (!object(l) || typeof l.judges !== 'string' || !Array.isArray(l.ids) || l.ids.some(id => typeof id !== 'string') || new Set(l.ids).size !== l.ids.length || !Array.isArray(l.rounds)) return false
    let n = l.ids.length
    for (const g of l.rounds) {
      if (!Array.isArray(g) || n < 2 || g.some(x => x !== 2 && x !== 3) || g.reduce((a, b) => a + b, 0) !== n) return false
      n = g.length
    }
    return n <= 1
  })
}

// Read both versions so existing local events and exported backups retain their dancers and placements.
export function parseEvent(value: unknown): BattleEvent {
  if (!object(value) || ![1, 2].includes(value.version as number) || typeof value.title !== 'string' || !Number.isInteger(value.year) || (value.year as number) < 1900 || (value.year as number) > 2200 || !Array.isArray(value.people) || !validLayouts(value.layouts)) throw Error('Invalid event')
  const seen = new Set<string>()
  for (const p of value.people) {
    if (!object(p) || !['id', 'name', 'nickname', 'birth'].every(k => typeof p[k] === 'string') || seen.has(p.id as string)) throw Error('Invalid dancers')
    seen.add(p.id as string)
    if (value.version === 1 ? typeof p.styles !== 'string' : !Array.isArray(p.styles) || p.styles.some(id => typeof id !== 'string') || new Set(p.styles).size !== p.styles.length) throw Error('Invalid registrations')
  }
  if (value.version === 1) {
    const legacy = value as unknown as { title: string; year: number; people: (Omit<Person, 'styles'> & { styles: string })[]; layouts: Record<string, Layout> }
    const styles = defaults()
    const styleFor = (name: string) => {
      let style = styles.find(s => normalize(s.name) === normalize(name))
      if (!style) { style = { id: `style-${styles.length + 1}`, name: name.trim(), split: false, cutoff: 18 }; styles.push(style) }
      return style
    }
    const people = legacy.people.map(p => ({ ...p, styles: [...new Set(p.styles.split(',').map(s => s.trim()).filter(Boolean).map(s => styleFor(s).id))] }))
    const layouts: Record<string, Layout> = {}
    for (const [name, layout] of Object.entries(legacy.layouts)) {
      const id = `${styleFor(name).id}:all`
      // If legacy spelling variants collide, regenerate instead of dropping registrations.
      if (!layouts[id]) layouts[id] = layout
      else delete layouts[id]
    }
    return { version: 2, title: legacy.title, year: legacy.year, people, styles, layouts }
  }
  if (!Array.isArray(value.styles)) throw Error('Invalid styles')
  const ids = new Set<string>(), names = new Set<string>()
  for (const s of value.styles) {
    if (!object(s) || typeof s.id !== 'string' || !s.id || typeof s.name !== 'string' || !s.name.trim() || s.name.includes(',') || ids.has(s.id) || names.has(normalize(s.name)) || typeof s.split !== 'boolean' || !Number.isInteger(s.cutoff) || (s.cutoff as number) < 1 || (s.cutoff as number) > 120) throw Error('Invalid styles')
    ids.add(s.id); names.add(normalize(s.name))
  }
  if (value.people.some(p => (p.styles as string[]).some(id => !ids.has(id)))) throw Error('Unknown style')
  return value as unknown as BattleEvent
}
