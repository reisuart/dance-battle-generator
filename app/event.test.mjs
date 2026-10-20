import assert from 'node:assert/strict'
import { age, categories, division, fresh, getLayout, parseEvent, participants, pendingPeople, stale } from './src/event.ts'

const legacy = {
 version: 1, title: 'Existing event', year: 2026,
 people: [
  { id: 'a', name: 'Patricia', nickname: 'Pat', birth: '2009', styles: 'Hip Hop, House' },
  { id: 'b', name: 'Iria', nickname: '', birth: '2008', styles: 'hip hop' },
  { id: 'c', name: 'Iris', nickname: '', birth: '', styles: 'Hip Hop' },
 ],
 layouts: { 'Hip Hop': { ids: ['c','a','b'], rounds: [[3]], judges: 'Judge A' } },
}
const event = parseEvent(legacy)
const hiphop = event.styles.find(s=>s.name==='Hip Hop')
assert.ok(hiphop)
assert.deepEqual(event.styles.map(s=>s.name), ['Hip Hop','Modern','Contemporary','House'])
assert.deepEqual(event.people[0].styles, [hiphop.id, event.styles[3].id])
assert.deepEqual(event.people[1].styles, [hiphop.id])
const all = categories(event).find(c=>c.style.id===hiphop.id)
assert.deepEqual(getLayout(event,all).ids, ['c','a','b'])
assert.deepEqual(getLayout(event,all).judges,['Judge A'])
assert.equal(stale(event,all),false)
assert.deepEqual(parseEvent(JSON.parse(JSON.stringify(event))),event)
hiphop.split=true
const divided = categories(event).filter(c=>c.style.id===hiphop.id)
assert.deepEqual(divided.map(c=>c.division), ['under','over'])
assert.deepEqual(participants(event,divided[0]).map(p=>p.id),['a'])
assert.deepEqual(participants(event,divided[1]).map(p=>p.id),['b'])
assert.deepEqual(pendingPeople(event,hiphop).map(p=>p.id),['c'])
assert.equal(division(event.people[1],hiphop,2026),'over') // cutoff itself belongs in Over
assert.equal(age(event.people[0],2026),17)
assert.equal(age({...event.people[0],birth:'2027'},2026),null)
assert.equal(age({...event.people[0],birth:'2008.5'},2026),null)
event.layouts[divided[0].id]={ids:['a'],rounds:[],judges:['Under judge']}
event.layouts[divided[1].id]={ids:['b'],rounds:[],judges:['Over judge']}
assert.equal(stale(event,divided[0]),false)
hiphop.cutoff=17
assert.equal(stale(event,divided[0]),true)
assert.equal(stale(event,divided[1]),true)
assert.deepEqual(getLayout(event,divided[1]).judges,['Over judge'])
hiphop.split=false
assert.deepEqual(getLayout(event,categories(event).find(c=>c.style.id===hiphop.id)).ids,['c','a','b'])
assert.throws(()=>parseEvent({...fresh(),styles:[...fresh().styles,{id:'duplicate',name:' hip hop ',split:false,cutoff:18}]}))
assert.throws(()=>parseEvent({...fresh(),people:[{id:'x',name:'X',nickname:'',birth:'2000',styles:['missing']}]}))
assert.throws(()=>parseEvent({...fresh(),layouts:{bad:{ids:['a','b'],rounds:[[3]],judges:''}}}))
assert.throws(()=>parseEvent({...fresh(),styles:[{...fresh().styles[0],cutoff:0}]}))
console.log('Event tests passed: legacy migration, dropdown styles, exact cutoff, missing ages, independent divisions, changed cutoffs, and import validation.')
const oldJudges = parseEvent({...fresh(), layouts: { old: { ids: [], rounds: [], judges: 'Nake, Alex, Max' } }})
assert.deepEqual(oldJudges.layouts.old.judges,['Nake','Alex','Max'])
assert.deepEqual(parseEvent(JSON.parse(JSON.stringify(oldJudges))).layouts.old.judges,['Nake','Alex','Max'])
const individualJudges = parseEvent({...fresh(), layouts: { individual: { ids: [], rounds: [], judges: ['Nake', 'Alex, Jr.', ''] } }})
assert.deepEqual(individualJudges.layouts.individual.judges,['Nake','Alex, Jr.',''])
assert.throws(()=>parseEvent({...fresh(),layouts:{bad:{ids:[],rounds:[],judges:[42]}}}))
console.log('Separate judge boxes and migration from comma-separated names passed.')
