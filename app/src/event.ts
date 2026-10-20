import { rounds } from './bracket.ts'

export type Person = { id: string; name: string; nickname: string; birth: string; styles: string[] }
export type DanceStyle = { id: string; name: string; split: boolean; cutoff: number; solo?: boolean; duos?: boolean; duoSplit?: boolean; duoCutoff?: number }
export type Duo = { id: string; name: string; styleId: string; members: [string, string] }
export type Layout = { ids: string[]; rounds: number[][]; judges: string[] }
type StoredLayout = Omit<Layout, 'judges'> & { judges: string | string[] }
export type BattleEvent = { version: 2; title: string; year: number; people: Person[]; styles: DanceStyle[]; layouts: Record<string, Layout>; duos?: Duo[] }
export type Category = { id: string; style: DanceStyle; division: 'all' | 'under' | 'over'; label: string; format: 'solo' | 'duo' }
export type Entry = { id: string; name: string }

export const STORAGE_KEY = 'dance-battle-v1'
const defaults = (): DanceStyle[] => ['Hip Hop', 'Modern', 'Contemporary'].map((name, i) => ({ id: `style-${i + 1}`, name, split: false, cutoff: 18 }))
export const normalize = (name: string) => name.trim().toLocaleLowerCase()
export const fresh = (): BattleEvent => ({ version: 2, title: 'Dance battle', year: new Date().getFullYear(), people: [], styles: defaults(), layouts: {} })

export function age(person: Person, year: number): number | null {
  if (!/^\d{4}$/.test(person.birth)) return null
  const birth = Number(person.birth)
  return birth >= 1900 && birth <= year ? year - birth : null
}

export function sortPeopleByAge(people: Person[], year: number, direction: 'none' | 'ascending' | 'descending'): Person[] {
  if (direction === 'none') return people
  return [...people].sort((a, b) => {
    const first = age(a, year), second = age(b, year)
    if (first === null) return second === null ? 0 : 1
    if (second === null) return -1
    return direction === 'ascending' ? first - second : second - first
  })
}

export function division(person: Person, style: DanceStyle, year: number): 'all' | 'under' | 'over' | 'pending' {
  if (!style.split) return 'all'
  const years = age(person, year)
  return years === null ? 'pending' : years < style.cutoff ? 'under' : 'over'
}

export function categoryLabel(style: DanceStyle, division: 'all' | 'under' | 'over'): string {
  return style.name + (division === 'all' ? '' : division === 'under' ? ' Under' : ' Over')
}

export function categories(event: BattleEvent): Category[] {
  return event.styles.flatMap(style => {
    const solo: Category[] = style.solo === false ? [] : (style.split ? ['under', 'over'] as const : ['all'] as const).map(d => ({ id: `${style.id}:${d}`, style, division: d, label: categoryLabel(style, d), format: 'solo' }))
    const duos: Category[] = !style.duos ? [] : (style.duoSplit ? ['under', 'over'] as const : ['all'] as const).map(d => ({ id: `${style.id}:duo:${d}`, style, division: d, label: categoryLabel(style, d), format: 'duo' }))
    return [...solo, ...duos]
  })
}

export const named = (person: Person) => Boolean(person.name.trim() || person.nickname.trim())
export function participants(event: BattleEvent, category: Category): Person[] {
  if (category.format === 'duo' || category.style.solo === false) return []
  return event.people.filter(p => named(p) && p.styles.includes(category.style.id) && division(p, category.style, event.year) === category.division)
}
export function pendingPeople(event: BattleEvent, style: DanceStyle): Person[] {
  if (style.solo === false) return []
  return event.people.filter(p => named(p) && p.styles.includes(style.id) && division(p, style, event.year) === 'pending')
}

export function duoAge(event: BattleEvent, duo: Duo): number | null {
  const members = duo.members.map(id => event.people.find(p => p.id === id))
  if (!members[0] || !members[1]) return null
  const first = age(members[0], event.year), second = age(members[1], event.year)
  return first === null || second === null ? null : (first + second) / 2
}

export function duoDivision(event: BattleEvent, duo: Duo, style: DanceStyle): 'all' | 'under' | 'over' | 'pending' {
  if (!style.duoSplit) return 'all'
  const average = duoAge(event, duo)
  return average === null ? 'pending' : average < (style.duoCutoff ?? style.cutoff) ? 'under' : 'over'
}

export function entryName(event: BattleEvent, id: string): string {
  const duo = event.duos?.find(d => d.id === id)
  if (duo) return duo.name
  const person = event.people.find(p => p.id === id)
  return person ? person.nickname || person.name : 'Removed entry'
}

export function entries(event: BattleEvent, category: Category): Entry[] {
  if (category.format === 'solo') return participants(event, category).map(p => ({ id: p.id, name: entryName(event, p.id) }))
  return (event.duos || []).filter(d => d.styleId === category.style.id && duoDivision(event, d, category.style) === category.division).map(d => ({ id: d.id, name: d.name }))
}

export function pendingEntries(event: BattleEvent, category: Category): Entry[] {
  if (category.format === 'solo') return pendingPeople(event, category.style).map(p => ({ id: p.id, name: entryName(event, p.id) }))
  return (event.duos || []).filter(d => d.styleId === category.style.id && duoDivision(event, d, category.style) === 'pending').map(d => ({ id: d.id, name: d.name }))
}

export function missingAgePeople(event: BattleEvent): Person[] {
  const ids = new Set(event.styles.flatMap(s => pendingPeople(event, s).map(p => p.id)))
  for (const duo of event.duos || []) {
    const style = event.styles.find(s => s.id === duo.styleId)
    if (!style?.duos || !style.duoSplit) continue
    for (const id of duo.members) { const p = event.people.find(p => p.id === id); if (p && age(p, event.year) === null) ids.add(id) }
  }
  return event.people.filter(p => ids.has(p.id))
}

export function duoError(event: BattleEvent, duo: Duo): string | null {
  if (!duo.name.trim()) return 'Enter a duo name.'
  if (!event.styles.some(s => s.id === duo.styleId)) return 'Select a dance style.'
  if (duo.members.length !== 2 || duo.members[0] === duo.members[1] || duo.members.some(id => !event.people.some(p => p.id === id))) return 'Select two different registered dancers.'
  const others = (event.duos || []).filter(d => d.id !== duo.id && d.styleId === duo.styleId)
  if (others.some(d => normalize(d.name) === normalize(duo.name))) return 'This duo name is already used in this style.'
  if (others.some(d => d.members.some(id => duo.members.includes(id)))) return 'A dancer can belong to only one duo per style.'
  return null
}
export function getLayout(event: BattleEvent, category: Category): Layout {
  return event.layouts[category.id] || { ids: entries(event, category).map(p => p.id), rounds: rounds(entries(event, category).length), judges: ['', '', ''] }
}
export function stale(event: BattleEvent, category: Category): boolean {
  const ids = entries(event, category).map(p => p.id), layout = getLayout(event, category)
  return ids.length !== layout.ids.length || ids.some(id => !layout.ids.includes(id))
}

function object(v: unknown): v is Record<string, unknown> { return Boolean(v) && typeof v === 'object' && !Array.isArray(v) }
function validLayouts(value: unknown): value is Record<string, StoredLayout> {
  if (!object(value)) return false
  return Object.values(value).every(l => {
    if (!object(l) || !(typeof l.judges === 'string' || Array.isArray(l.judges) && l.judges.every(j => typeof j === 'string')) || !Array.isArray(l.ids) || l.ids.some(id => typeof id !== 'string') || new Set(l.ids).size !== l.ids.length || !Array.isArray(l.rounds)) return false
    let n = l.ids.length
    for (const g of l.rounds) {
      if (!Array.isArray(g) || n < 2 || g.some(x => x !== 2 && x !== 3) || g.reduce((a, b) => a + b, 0) !== n) return false
      n = g.length
    }
    return n <= 1
  })
}

function migrateLayout(layout: StoredLayout): Layout {
  return { ...layout, judges: Array.isArray(layout.judges) ? [...layout.judges] : layout.judges.trim() ? layout.judges.split(/[,;\n]/).map(j => j.trim()).filter(Boolean) : ['', '', ''] }
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
    const legacy = value as unknown as { title: string; year: number; people: (Omit<Person, 'styles'> & { styles: string })[]; layouts: Record<string, StoredLayout> }
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
      if (!layouts[id]) layouts[id] = migrateLayout(layout)
      else delete layouts[id]
    }
    return { version: 2, title: legacy.title, year: legacy.year, people, styles, layouts }
  }
  if (!Array.isArray(value.styles)) throw Error('Invalid styles')
  const ids = new Set<string>(), names = new Set<string>()
  for (const s of value.styles) {
    if (!object(s) || typeof s.id !== 'string' || !s.id || typeof s.name !== 'string' || !s.name.trim() || s.name.includes(',') || ids.has(s.id) || names.has(normalize(s.name)) || typeof s.split !== 'boolean' || !Number.isInteger(s.cutoff) || (s.cutoff as number) < 1 || (s.cutoff as number) > 120) throw Error('Invalid styles')
    ids.add(s.id); names.add(normalize(s.name))
    for (const option of ['solo', 'duos', 'duoSplit']) if (s[option] !== undefined && typeof s[option] !== 'boolean') throw Error('Invalid battle format')
    if (s.duoCutoff !== undefined && (!Number.isInteger(s.duoCutoff) || (s.duoCutoff as number) < 1 || (s.duoCutoff as number) > 120)) throw Error('Invalid duo age cutoff')
    if (s.solo === false && !s.duos) throw Error('At least one battle format is required')
  }
  if (value.people.some(p => (p.styles as string[]).some(id => !ids.has(id)))) throw Error('Unknown style')
  const result = { ...value, layouts: Object.fromEntries(Object.entries(value.layouts).map(([id, layout]) => [id, migrateLayout(layout)])) } as unknown as BattleEvent
  if (result.duos !== undefined) {
    if (!Array.isArray(result.duos)) throw Error('Invalid duos')
    const duoIds = new Set<string>()
    for (const d of result.duos) {
      if (!object(d) || typeof d.id !== 'string' || !d.id || seen.has(d.id) || duoIds.has(d.id) || typeof d.name !== 'string' || typeof d.styleId !== 'string' || !Array.isArray(d.members) || d.members.some(id => typeof id !== 'string')) throw Error('Invalid duo')
      duoIds.add(d.id)
      if (duoError(result, d)) throw Error('Invalid duo registration')
    }
  }
  return result
}
