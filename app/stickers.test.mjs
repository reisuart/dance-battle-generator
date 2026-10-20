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

const { stickerNameLines } = await import('./src/stickers.ts')
const measure = text => text.length * 10
assert.deepEqual(stickerNameLines('RAFY',measure,100),['RAFY'])
assert.deepEqual(stickerNameLines('ARIANNA MAGGI',measure,90),['ARIANNA','MAGGI'])
const multiword = stickerNameLines('MARIA LUISA ROSSI',measure,110)
assert.equal(multiword.join(' '),'MARIA LUISA ROSSI')
assert.equal(multiword.length,2)
assert.ok(multiword.every(line=>measure(line)<=110))
assert.deepEqual(stickerNameLines('VERYLONGNICKNAME',measure,80).join(''),'VERYLONGNICKNAME')
assert.ok(stickerNameLines('ONE TWO THREE FOUR FIVE',measure,60).length<=2)
console.log('Sticker name wrapping passed: short names unchanged, balanced word wrapping, long nicknames, and at most two lines.')

// Optimization packs categories in order without changing label identity or category numbering.
const packedEvent=fresh()
packedEvent.people=[
 {...makePerson(1),styles:['style-1']},
 {...makePerson(2),styles:['style-2']},
 {...makePerson(3),styles:['style-2']},
 {...makePerson(4),styles:['style-3']},
 {...makePerson(5),styles:['style-3']},
]
const separate=stickerSheets(packedEvent)
const optimized=stickerSheets(packedEvent,1,'nickname',true)
assert.equal(separate.length,3)
assert.equal(optimized.length,2)
assert.deepEqual(optimized.map(s=>s.labels.length),[4,1])
assert.deepEqual(optimized.flatMap(s=>s.labels),separate.flatMap(s=>s.labels))
assert.deepEqual(optimized[0].labels.map(l=>l.category.style.name),['Hip Hop','Modern','Modern','Contemporary'])
assert.deepEqual(optimized.flatMap(s=>s.labels.map(l=>l.number)),[1,1,2,1,2])
const onlyModern=stickerSheets(packedEvent,10,'name',true,['style-2:all'])
assert.equal(onlyModern.length,1)
assert.ok(onlyModern[0].labels.every(l=>l.category.id==='style-2:all'))
assert.deepEqual(onlyModern[0].labels.map(l=>l.number),[10,11])
assert.equal(stickerSheets(fresh(),1,'nickname',true).length,0)
for(let a=0;a<=5;a++)for(let b=0;b<=5;b++)for(let c=0;c<=5;c++) {
 const fixture=fresh()
 fixture.people=[a,b,c].flatMap((n,style)=>Array.from({length:n},(_,i)=>({...makePerson(style*10+i),styles:[`style-${style+1}`]})))
 const plain=stickerSheets(fixture)
 const packed=stickerSheets(fixture,1,'nickname',true)
 assert.equal(packed.length,Math.ceil((a+b+c)/4))
 assert.deepEqual(packed.flatMap(s=>s.labels),plain.flatMap(s=>s.labels))
 assert.ok(packed.slice(0,-1).every(s=>s.labels.length===4))
}
console.log('Optimization passed: mixed categories retain headings and numbers, selected-category isolation, and minimal pages for 216 category-count combinations.')
