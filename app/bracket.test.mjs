import assert from 'node:assert/strict'
import { choices, rounds } from './src/bracket.ts'
for (let n = 0; n <= 256; n++) {
 let count = n
 for (const group of rounds(n)) {
  assert.equal(group.reduce((a,b)=>a+b,0), count)
  assert.ok(group.every(size=>size===2||size===3))
  count = group.length
 }
 assert.ok(count <= 1)
 if(n>=2) for(const b of choices(n)) {
  assert.equal((n-3*b)%2,0)
  assert.ok(n-3*b>=0)
 }
}
assert.deepEqual(rounds(9),[[2,2,2,3],[2,2],[2]])
assert.deepEqual(rounds(3),[[3]])
console.log('Bracket integrity passed for 0–256 dancers, including the agreed nine-dancer example.')

// Moving a battle preserves the entire competing group, even when group sizes differ.
const { moveBattle } = await import('./src/bracket.ts')
const mixed = { ids: ['a','b','c','d','e','f','g','h'], rounds: [[2,3,3],[3]], judges: ['Judge'] }
const moved = moveBattle(mixed,0,0,2)
assert.deepEqual(moved.ids,['c','d','e','f','g','h','a','b'])
assert.deepEqual(moved.rounds,[[3,3,2],[3]])
assert.deepEqual(moved.judges,['Judge'])
assert.deepEqual(moveBattle(moved,0,2,0),mixed)
assert.deepEqual(mixed.ids,['a','b','c','d','e','f','g','h'])

// A later-round move carries its earlier battles rather than changing their opponents.
const tree = { ids: Array.from({length:9},(_,i)=>String(i)), rounds:[[2,2,2,3],[2,2],[2]] }
const semi = moveBattle(tree,1,0,1)
assert.deepEqual(semi.ids,['4','5','6','7','8','0','1','2','3'])
assert.deepEqual(semi.rounds,[[2,3,2,2],[2,2],[2]])
assert.deepEqual(moveBattle(semi,1,1,0),tree)
assert.equal(moveBattle(tree,0,-1,0),tree)
assert.equal(moveBattle(tree,0,0,4),tree)
for(let n=2;n<=128;n++) {
 const initial={ids:Array.from({length:n},(_,i)=>String(i)),rounds:rounds(n)}
 for(let r=0;r<initial.rounds.length;r++) {
  const last=initial.rounds[r].length-1
  if(last<1)continue
  const next=moveBattle(initial,r,0,last)
  assert.equal(new Set(next.ids).size,n)
  assert.deepEqual([...next.ids].sort(),[...initial.ids].sort())
  let count=n
  for(const g of next.rounds){assert.equal(g.reduce((a,b)=>a+b,0),count);count=g.length}
  assert.equal(count,1)
  assert.deepEqual(moveBattle(next,r,last,0),initial)
 }
}
console.log('Battle reorder checks passed: whole groups, later-round subtrees, reversibility, and no lost or duplicated dancers for 2–128 entrants.')
