export function choices(n: number) { return Array.from({ length: Math.floor(n / 3) + 1 }, (_, b) => b).filter(b => (n - b * 3) % 2 === 0) }
export function rounds(n: number): number[][] { const result: number[][] = []; while(n > 1) { const b = choices(n)[0]; const g: number[] = [...Array((n - b * 3) / 2).fill(2), ...Array(b).fill(3)]; result.push(g); n = g.length } return result }

