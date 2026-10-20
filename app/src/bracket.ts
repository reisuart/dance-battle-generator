export function choices(n: number) { return Array.from({ length: Math.floor(n / 3) + 1 }, (_, b) => b).filter(b => (n - b * 3) % 2 === 0) }
export function rounds(n: number): number[][] { const result: number[][] = []; while(n > 1) { const b = choices(n)[0]; const g: number[] = [...Array((n - b * 3) / 2).fill(2), ...Array(b).fill(3)]; result.push(g); n = g.length } return result }

// Move a battle with its entire input subtree, preserving opponents in every earlier round.
export function moveBattle<T extends { ids: string[]; rounds: number[][] }>(layout: T, round: number, from: number, to: number): T {
  const groups = layout.rounds[round]
  if (!groups || ![from, to].every(i => Number.isInteger(i) && i >= 0 && i < groups.length) || from === to) return layout
  type Node = { id: string } | { children: Node[] }
  let nodes: Node[] = layout.ids.map(id => ({ id }))
  for (let r = 0; r <= round; r++) {
    let offset = 0
    nodes = layout.rounds[r].map(size => {
      const children = nodes.slice(offset, offset + size)
      offset += size
      return { children }
    })
  }
  const [moved] = nodes.splice(from, 1)
  nodes.splice(to, 0, moved)
  const nextRounds = [...layout.rounds]
  for (let r = round; r >= 0; r--) {
    nextRounds[r] = nodes.map(node => 'children' in node ? node.children.length : 0)
    nodes = nodes.flatMap(node => 'children' in node ? node.children : [])
  }
  return { ...layout, ids: nodes.map(node => 'id' in node ? node.id : ''), rounds: nextRounds }
}

