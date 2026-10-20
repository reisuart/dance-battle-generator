import assert from 'node:assert/strict'
import { categories, duoAge, duoDivision, duoError, entries, entryName, fresh, getLayout, missingAgePeople, parseEvent, pendingEntries, stale } from './src/event.ts'
import { stickerSheets } from './src/stickers.ts'
import { moveBattle } from './src/bracket.ts'
const event=fresh();event.year=2026
const style=event.styles[0];style.duos=true;style.split=true;style.cutoff=14
const person=(id,birth,styles=[])=>({id,name:`Dancer ${id}`,nickname:`Nick ${id}`,birth,styles})
event.people=[person('a','2014',['style-1']),person('b','2011'),person('c','2012',['style-1']),person('d','2012'),person('e',''),person('f','2010')]
event.duos=[{id:'duo:alpha',name:'Alpha',styleId:style.id,members:['a','b']},{id:'duo:beta',name:'Beta',styleId:style.id,members:['c','d']},{id:'duo:gamma',name:'Gamma',styleId:style.id,members:['e','f']}]
const soloCats=categories(event).filter(c=>c.format==='solo'&&c.style.id===style.id)
const duoCat=categories(event).find(c=>c.format==='duo')
assert.equal(duoCat.id,'style-1:duo:all')
assert.equal(duoCat.label,'Hip Hop')
assert.deepEqual(soloCats.map(c=>c.id),['style-1:under','style-1:over'])
assert.equal(duoDivision(event,event.duos[0],style),'all') // solo division does not divide duos
assert.equal(duoAge(event,event.duos[0]),13.5)
assert.equal(duoAge(event,event.duos[1]),14)
assert.equal(duoAge(event,event.duos[2]),null)
assert.deepEqual(entries(event,duoCat).map(p=>p.name),['Alpha','Beta','Gamma'])
assert.deepEqual(getLayout(event,duoCat).rounds,[[3]]) // three duos, not six individual dancers
assert.deepEqual(pendingEntries(event,duoCat),[])
assert.equal(entryName(event,'duo:alpha'),'Alpha')
assert.equal(entryName(event,'a'),'Nick a')
assert.deepEqual(stickerSheets(event).flatMap(s=>s.labels.map(l=>l.personId)),['a','c'])
assert.ok(stickerSheets(event).every(s=>s.category.format==='solo'))
style.duoSplit=true;style.duoCutoff=14
const divided=categories(event).filter(c=>c.format==='duo')
assert.deepEqual(divided.map(c=>c.label),['Hip Hop Under','Hip Hop Over'])
assert.deepEqual(entries(event,divided[0]).map(d=>d.id),['duo:alpha'])
assert.deepEqual(entries(event,divided[1]).map(d=>d.id),['duo:beta'])
assert.deepEqual(pendingEntries(event,divided[0]).map(d=>d.id),['duo:gamma'])
assert.deepEqual(missingAgePeople(event).map(p=>p.id),['e'])
event.layouts[divided[0].id]=getLayout(event,divided[0])
assert.equal(stale(event,divided[0]),false)
event.year=2027
assert.equal(duoAge(event,event.duos[0]),14.5)
assert.equal(stale(event,divided[0]),true)
event.year=2026
assert.deepEqual(parseEvent(JSON.parse(JSON.stringify(event))),event)
assert.equal(duoError(event,{id:'new',name:'Other',styleId:style.id,members:['a','d']}),'A dancer can belong to only one duo per style.')
assert.equal(duoError(event,{...event.duos[0],name:'Renamed'}),null)
assert.equal(duoError(event,{id:'new',name:' ALPHA ',styleId:style.id,members:['e','f']}),'This duo name is already used in this style.')
assert.match(duoError(event,{id:'new',name:'New',styleId:style.id,members:['a','a']}),/two different/)
assert.match(duoError(event,{id:'new',name:'New',styleId:style.id,members:['missing','a']}),/two different/)
assert.equal(duoError(event,{id:'new',name:'Other style',styleId:'style-2',members:['a','b']}),null)
assert.throws(()=>parseEvent({...event,duos:[...event.duos,{id:'bad',name:'Bad',styleId:style.id,members:['a','a']}]}))
assert.throws(()=>parseEvent({...event,duos:[...event.duos,{...event.duos[0],id:'a'}]}))
assert.throws(()=>parseEvent({...event,people:event.people.filter(p=>p.id!=='a')}))
assert.throws(()=>parseEvent({...event,styles:[{...style,duoCutoff:0}]}))
assert.throws(()=>parseEvent({...event,styles:[{...style,duos:'yes'}]}))
const old=fresh();const imported=parseEvent(JSON.parse(JSON.stringify(old)))
assert.deepEqual(imported,old)
style.solo=false
assert.equal(stickerSheets(event).length,0)
assert.ok(categories(event).filter(c=>c.style.id===style.id).every(c=>c.format==='duo'))
// Reordering battles moves whole duo entries and preserves opponents.
const roster={ids:['duo:a','duo:b','duo:c','duo:d','duo:e'],rounds:[[2,3],[2]],judges:['Judge']}
const moved=moveBattle(roster,0,1,0)
assert.deepEqual(moved.ids,['duo:c','duo:d','duo:e','duo:a','duo:b'])
assert.deepEqual(moved.rounds,[[3,2],[2]])
assert.deepEqual(moved.judges,['Judge'])
console.log('Duo checks passed: legacy compatibility, independent formats/divisions, exact average boundary, missing ages, duplicate prevention, import validation, three-duo bracket, and sticker exclusion.')
