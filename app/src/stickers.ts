import { categories, participants } from './event.ts'
import type { BattleEvent, Category } from './event.ts'

export type Sticker = { personId: string; number: number; name: string }
export type StickerSheet = { id: string; category: Category; page: number; labels: Sticker[] }

export function stickerSheets(event: BattleEvent, start = 1, displayName: 'nickname' | 'name' = 'nickname'): StickerSheet[] {
  if (!Number.isInteger(start) || start < 1 || start > 9999) throw Error('Starting number must be between 1 and 9999')
  return categories(event).flatMap(category => {
    // Use registration order, independent of the age-sort view or bracket rearrangements.
    const labels = participants(event, category).map((p, i) => ({
      personId: p.id, number: start + i,
      name: (displayName === 'nickname' ? p.nickname.trim() || p.name.trim() : p.name.trim() || p.nickname.trim()).toUpperCase(),
    }))
    return Array.from({ length: Math.ceil(labels.length / 4) }, (_, i) => ({
      id: `${category.id}:sheet-${i}`, category, page: i + 1, labels: labels.slice(i * 4, i * 4 + 4),
    }))
  })
}
