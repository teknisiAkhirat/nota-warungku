import test from'node:test';import assert from'node:assert/strict';import{transactionRow,itemRows,markSynced,pendingTransactions}from'../src/sync-core.js';
const tx={id:'tx-1',number:'260925001',createdAt:'2026-09-25T10:00:00.000Z',total:14000,status:'PENDING_SYNC',items:[{id:'m1',itemId:'item-1',name:'Nasi',price:10000,qty:1,subtotal:10000},{id:'m2',itemId:'item-2',name:'Teh',price:4000,qty:1,subtotal:4000}]};
test('sync row uses stable transaction id for idempotent upsert',()=>assert.equal(transactionRow(tx,'hash').owner_key_hash,'tx-1'));
test('item rows use stable client item ids',()=>assert.deepEqual(itemRows(tx,'hash').map(x=>x.client_item_id),['item-1','item-2']));
test('pending queue excludes synced transactions',()=>assert.equal(pendingTransactions([tx,{...tx,id:'tx-2',status:'SYNCED'}]).length,1));
test('markSynced is idempotent',()=>{const once=markSynced([tx],'tx-1');const twice=markSynced(once,'tx-1');assert.deepEqual(twice,once);assert.equal(twice[0].status,'SYNCED')});