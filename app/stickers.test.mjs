import assert from 'node:assert/strict'
import { fresh } from './src/event.ts'
import { stickerSheets } from './src/stickers.ts'

const makePerson = i => ({id:`p${i}`,name:`Person ${i}`,nickname:i===1?'NICK':'',birth:'2000',styles:['style-1']})
for(let count=0;count<=33;count++) {
 const event={...fresh(),people:Array.from({length:count},(_,i)=>makePerson(i+1))}
 const snapshot=JSON.stringify(event)
 const sheets=stickerSheets(event)
 assert.equal(sheets.length,Math.ceil(count/4))
 assert.ok(sheets.every(s=>s.labels.length>=1&&s.labels.length<=4))
 assert.deepEqual(sheets.flatMap(s=>s.labels.map(l=>l.number)),Array.from({length:count},(_,i)=>i+1))
 assert.equal(new Set(sheets.flatMap(s=>s.labels.map(l=>l.personId))).size,count)
 assert.equal(JSON.stringify(event),snapshot)
}
const event=fresh();event.year=2026;event.styles[0].split=true;event.styles[0].cutoff=18
 event.people=[{...makePerson(1),birth:'2009',styles:['style-1','style-2']},{...makePerson(2),birth:'2008'},{...makePerson(3),birth:''}]
const labels=stickerSheets(event)
assert.equal(labels.length,3)
assert.deepEqual(labels.map(s=>[s.category.division,s.labels[0].personId]),[['under','p1'],['over','p2'],['all','p1']])
assert.ok(labels.every(s=>s.labels[0].number===1))
assert.equal(labels[0].labels[0].name,'NICK')
assert.equal(stickerSheets(event,10,'name')[0].labels[0].name,'PERSON 1')
assert.equal(stickerSheets(event,10)[0].labels[0].number,10)
event.layouts={'style-1:under':{ids:['p2','p1'],rounds:[[2]],judges:[]}}
assert.deepEqual(stickerSheets(event),labels)
assert.throws(()=>stickerSheets(event,0))
assert.throws(()=>stickerSheets(event,1.5))
assert.throws(()=>stickerSheets(event,10000))
console.log('Sticker checks passed: 0–33 dancers, four labels per page, separate styles/divisions, numbering, name preference, and independence from bracket placements.')
