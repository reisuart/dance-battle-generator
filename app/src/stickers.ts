import { categories, participants } from './event.ts'
import type { BattleEvent, Category } from './event.ts'

export type Sticker = { personId: string; number: number; name: string; category: Category }
export type StickerSheet = { id: string; category: Category; page: number; labels: Sticker[] }

export function stickerNameLines(text: string, measure: (value: string) => number, width: number): string[] {
  if (measure(text) <= width) return [text]
  const words = text.trim().split(/\s+/)
  // Prefer whole words; a single long nickname can split between characters.
  const parts = words.length > 1 ? words : Array.from(text)
  const separator = words.length > 1 ? ' ' : ''
  if (parts.length < 2) return [text]
  let best = [text], bestWidth = Infinity
  for (let i = 1; i < parts.length; i++) {
    const lines = [parts.slice(0, i).join(separator), parts.slice(i).join(separator)]
    const longest = Math.max(...lines.map(measure))
    if (longest < bestWidth) { best = lines; bestWidth = longest }
  }
  return best
}

export function stickerSheets(event: BattleEvent, start = 1, displayName: 'nickname' | 'name' = 'nickname', optimize = false, categoryIds?: string[]): StickerSheet[] {
  if (!Number.isInteger(start) || start < 1 || start > 9999) throw Error('Starting number must be between 1 and 9999')
  const sheets = categories(event).filter(category => category.format === 'solo' && (!categoryIds || categoryIds.includes(category.id))).flatMap(category => {
    // Use registration order, independent of the age-sort view or bracket rearrangements.
    const labels = participants(event, category).map((p, i) => ({
      personId: p.id, number: start + i, category,
      name: (displayName === 'nickname' ? p.nickname.trim() || p.name.trim() : p.name.trim() || p.nickname.trim()).toUpperCase(),
    }))
    return Array.from({ length: Math.ceil(labels.length / 4) }, (_, i) => ({
      id: `${category.id}:sheet-${i}`, category, page: i + 1, labels: labels.slice(i * 4, i * 4 + 4),
    }))
  })
  if (!optimize) return sheets
  const labels = sheets.flatMap(sheet => sheet.labels)
  return Array.from({ length: Math.ceil(labels.length / 4) }, (_, i) => ({
    id: `packed:sheet-${i}`, category: labels[i * 4].category, page: i + 1, labels: labels.slice(i * 4, i * 4 + 4),
  }))
}
