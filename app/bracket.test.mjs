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
