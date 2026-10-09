import test from'node:test';import assert from'node:assert/strict';import{transactionRow,itemRows,markSynced,pendingTransactions}from'../src/sync-core.js';
const tx={id:'tx-1',number:'260925001',createdAt:'2026-09-25T10:00:00.000Z',total:14000,status:'PENDING_SYNC',items:[{id:'m1',itemId:'item-1',name:'Nasi',price:10000,qty:1,subtotal:10000},{id:'m2',itemId:'item-2',name:'Teh',price:4000,qty:1,subtotal:4000}]};
test('sync row uses stable transaction id for idempotent upsert',()=>assert.equal(transactionRow(tx,'hash').owner_key_hash,'hash'));
test('item rows use stable client item ids',()=>assert.deepEqual(itemRows(tx,'hash').map(x=>x.client_item_id),['item-1','item-2']));
test('local menu IDs like m4 are not sent to UUID menu_id column',()=>assert.deepEqual(itemRows({...tx,items:[{...tx.items[0],id:'m4'}]},'hash').map(x=>x.menu_id),[null]));
test('valid UUID menu IDs are preserved',()=>{const id='550e8400-e29b-41d4-a716-446655440000';assert.equal(itemRows({...tx,items:[{...tx.items[0],id}]},'hash')[0].menu_id,id)});
test('pending queue excludes synced transactions',()=>assert.equal(pendingTransactions([tx,{...tx,id:'tx-2',status:'SYNCED'}]).length,1));
test('markSynced is idempotent',()=>{const once=markSynced([tx],'tx-1');const twice=markSynced(once,'tx-1');assert.deepEqual(twice,once);assert.equal(twice[0].status,'SYNCED')});
test('recovery key hashing is deterministic and non-plaintext',async()=>{const {hashKey}=await import('../src/sync-core.js');const a=await hashKey('ABC123');const b=await hashKey('ABC123');assert.equal(a,b);assert.notEqual(a,'ABC123');assert.equal(a.length,64)});
