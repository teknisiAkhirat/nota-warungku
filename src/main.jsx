import React,{useEffect,useMemo,useRef,useState}from'react';
import{createRoot}from'react-dom/client';
import{createClient}from'@supabase/supabase-js';
import'./styles.css';
import{money,operationalDate,calculateTotal,matchesHistory,receiptText,snapshotItems}from'./core.js';

const DB='nota-warungku',STORE='app';
const DEFAULT=[{id:'m1',category:'Makanan',name:'Nasi Pecel',price:10000,active:true},{id:'m2',category:'Makanan',name:'Nasi Goreng',price:12000,active:true},{id:'m3',category:'Lauk',name:'Telur',price:4000,active:true},{id:'m4',category:'Lauk',name:'Tempe',price:2000,active:true},{id:'m5',category:'Minuman',name:'Teh',price:3000,active:true},{id:'m6',category:'Minuman',name:'Kopi',price:4000,active:true}];
const URL=import.meta.env.VITE_SUPABASE_URL,KEY=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase=URL&&KEY?createClient(URL,KEY):null;
const db=(mode='readonly')=>new Promise((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>resolve(r.result.transaction(STORE,mode).objectStore(STORE));r.onerror=()=>reject(r.error)});
const get=k=>db().then(o=>new Promise((r,j)=>{const q=o.get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>j(q.error)}));
const put=(k,v)=>db('readwrite').then(o=>new Promise((r,j)=>{const q=o.put(v,k);q.onsuccess=()=>r();q.onerror=()=>j(q.error)}));

async function syncPending(history,setHistory,setNotice){
 if(!supabase)return{ok:false,reason:'Supabase belum dikonfigurasi.'};
 const{data:{session}}=await supabase.auth.getSession();
 if(!session)return{ok:false,reason:'Sesi sinkronisasi belum tersedia. Gunakan PULIHKAN DATA setelah akun recovery disiapkan.'};
 const pending=history.filter(t=>t.status!=='SYNCED');
 for(const tx of pending){
  const{error}=await supabase.from('nota_warungku_transactions').upsert({id:tx.id,owner_id:session.user.id,receipt_no:tx.number,operational_date:`20${operationalDate(tx.createdAt).slice(0,2)}-${operationalDate(tx.createdAt).slice(2,4)}-${operationalDate(tx.createdAt).slice(4,6)}`,created_at:tx.createdAt,total:tx.total,status:'SYNCED',updated_at:new Date().toISOString()},{onConflict:'id'});
  if(error)return{ok:false,reason:error.message};
  const rows=tx.items.map((i,n)=>({transaction_id:tx.id,owner_id:session.user.id,menu_id:i.id,client_item_id:i.itemId||`${tx.id}-${n}`,menu_name:i.name,unit_price:i.price,quantity:i.qty,subtotal:i.subtotal}));
  const{error:itemError}=await supabase.from('nota_warungku_transaction_items').upsert(rows,{onConflict:'transaction_id,client_item_id'});
  if(itemError)return{ok:false,reason:itemError.message};
 }
 const next=history.map(t=>pending.some(p=>p.id===t.id)?{...t,status:'SYNCED'}:t);await put('history',next);setHistory(next);setNotice(`${pending.length} nota berhasil disinkronkan.`);return{ok:true,count:pending.length};
}

function MenuButton({menu,qty,onAdd,onLongStart,onLongStop}){return <button className="menu" onClick={onAdd} onPointerDown={onLongStart} onPointerUp={onLongStop} onPointerCancel={onLongStop} onPointerLeave={onLongStop}><b>{menu.name}</b><span>{money(menu.price)}</span>{qty>0&&<em>{qty}</em>}</button>}

function App(){
 const[menus,setMenus]=useState(DEFAULT),[items,setItems]=useState([]),[history,setHistory]=useState([]),[view,setView]=useState('kasir'),[notice,setNotice]=useState(''),[search,setSearch]=useState(''),[admin,setAdmin]=useState(false),[editing,setEditing]=useState(null),[online,setOnline]=useState(navigator.onLine),[syncing,setSyncing]=useState(false),[recovery,setRecovery]=useState(false),[recoveryCode,setRecoveryCode]=useState('');
 const timers=useRef(new Map());
 useEffect(()=>{(async()=>{setMenus((await get('menus'))||DEFAULT);setHistory((await get('history'))||[]);setItems((await get('draft'))||[])})()},[]);
 useEffect(()=>{put('draft',items)},[items]);
 useEffect(()=>{const on=()=>setOnline(true),off=()=>setOnline(false);addEventListener('online',on);addEventListener('offline',off);return()=>{removeEventListener('online',on);removeEventListener('offline',off)}},[]);
 const cats=useMemo(()=>[...new Set(menus.filter(m=>m.active).map(m=>m.category))],[menus]);
 const total=calculateTotal(items);
 const add=m=>setItems(p=>{const x=p.find(i=>i.id===m.id);return x?p.map(i=>i.id===m.id?{...i,qty:i.qty+1}:i):[...p,{...m,qty:1}]});
 const minus=m=>setItems(p=>p.map(i=>i.id===m.id?{...i,qty:i.qty-1}:i).filter(i=>i.qty>0));
 const longStart=m=>timers.current.set(m.id,setTimeout(()=>minus(m),600));
 const longStop=m=>{const t=timers.current.get(m.id);if(t){clearTimeout(t);timers.current.delete(m.id)}};
 const nextNo=async()=>{const day=operationalDate(new Date()),c=(await get('counter'))||{},n=(c.day===day?c.n:0)+1;await put('counter',{day,n});return day+String(n).padStart(3,'0')};
 const finalize=async send=>{if(!items.length)return;if(send&&!online){setNotice('KIRIM NOTA membutuhkan internet.');return}if(!confirm(send?'Simpan nota lalu buka Share?':'Simpan nota ini?'))return;const number=await nextNo(),tx={id:crypto.randomUUID(),number,createdAt:new Date().toISOString(),items:snapshotItems(items).map(i=>({...i,itemId:crypto.randomUUID()})),total,status:'PENDING_SYNC'};const next=[tx,...history];await put('history',next);setHistory(next);setItems([]);if(send){try{await navigator.share({title:'Nota '+number,text:receiptText(tx)});setNotice(`Nota ${number} siap dibagikan.`)}catch(e){setNotice(e?.name==='AbortError'?`Nota ${number} tersimpan; Share dibatalkan. Gunakan KIRIM ULANG.`:`Nota ${number} tersimpan; Share tidak tersedia.`)}}else setNotice(`Nota ${number} berhasil disimpan.`);if(online){const r=await syncPending(next,setHistory,setNotice);if(!r.ok&&r.reason)setNotice(`Nota ${number} tersimpan. ${r.reason}`)}};
 const clear=()=>{if(items.length&&confirm('Kosongkan nota? Semua item yang sedang dipilih akan dihapus.'))setItems([])};
 const openAdmin=()=>{const pin=prompt('PIN admin');if(pin==='1234')setAdmin(true);else if(pin!==null)setNotice('PIN admin salah.')};
 const saveMenus=async next=>{setMenus(next);await put('menus',next)};
 const sync=async()=>{if(!online){setNotice('Sinkronisasi membutuhkan internet.');return}setSyncing(true);const r=await syncPending(history,setHistory,setNotice);if(!r.ok)setNotice(r.reason);setSyncing(false)};
 const recoverySubmit=async()=>{const code=recoveryCode.trim().toUpperCase();if(code.length<8){setNotice('Kode pemulihan tidak valid.');return}if(!supabase){setNotice('Supabase belum dikonfigurasi.');return}setNotice('Kode diterima. Mekanisme autentikasi recovery harus diaktifkan pada project Supabase.');setRecovery(false);setRecoveryCode('')};
 const shown=history.filter(t=>matchesHistory(t,search));
 return <main>
  <header><div className="adminTrigger" role="button" tabIndex="0" onClick={()=>{window.__t=(window.__t||0)+1;if(window.__t>=5){window.__t=0;openAdmin()}clearTimeout(window.__timer);window.__timer=setTimeout(()=>window.__t=0,1500)}}><small>NOTA WARUNGKU</small><h1>WARUNG BU SUKARNI</h1></div><b>{online?'ONLINE':'OFFLINE'}</b></header>
  <nav><button className={view==='kasir'?'on':''} onClick={()=>setView('kasir')}>KASIR</button><button className={view==='riwayat'?'on':''} onClick={()=>setView('riwayat')}>RIWAYAT NOTA</button>{admin&&<button className={view==='admin'?'on':''} onClick={()=>setView('admin')}>ADMIN</button>}</nav>
  {notice&&<div className="notice" onClick={()=>setNotice('')}>{notice}</div>}
  {view==='kasir'&&<><section className="receipt"><h2>Nota sekarang</h2>{items.length?items.map(i=><div className="line" key={i.id}><div><b>{i.name}</b><small>{money(i.price)} × {i.qty}</small></div><strong>{money(i.price*i.qty)}</strong><button onClick={()=>minus(i)}>−</button><button onClick={()=>add(i)}>+</button></div>):<p className="empty">Belum ada menu dipilih.</p>}{items.length&&<div className="total"><span>TOTAL</span><b>{money(total)}</b></div>}</section>
  <section><h2>Pilih menu</h2>{cats.map(c=><div key={c}><h3>{c}</h3><div className="grid">{menus.filter(m=>m.active&&m.category===c).map(m=><MenuButton key={m.id} menu={m} qty={items.find(i=>i.id===m.id)?.qty||0} onAdd={()=>add(m)} onLongStart={()=>longStart(m)} onLongStop={()=>longStop(m)}/>)}</div></div>)}</section>
  <div className="actions"><button disabled={!items.length||!online} className="primary" onClick={()=>finalize(true)}>KIRIM NOTA</button><button disabled={!items.length} onClick={()=>finalize(false)}>SIMPAN NOTA</button><button disabled={!items.length} onClick={clear}>KOSONGKAN NOTA</button></div>
  <div className="sync"><button disabled={!online||syncing} onClick={sync}>{syncing?'MENYINKRONKAN…':'SINKRONKAN SEKARANG'}</button><button disabled={!online} onClick={()=>setRecovery(true)}>PULIHKAN DATA</button></div></>}
  {view==='admin'&&<section><div className="adminHead"><div><h2>Admin Menu</h2><small>Perubahan berlaku untuk transaksi baru.</small></div><button onClick={()=>{setAdmin(false);setView('kasir')}}>KELUAR</button></div>{editing?<div className="editor"><h3>{editing.id?'Edit menu':'Tambah menu'}</h3><label>Nama menu<input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><label>Kategori<input value={editing.category} onChange={e=>setEditing({...editing,category:e.target.value})}/></label><label>Harga<input type="number" min="0" step="500" value={editing.price} onChange={e=>setEditing({...editing,price:Math.max(0,Number(e.target.value)||0)})}/></label><label className="check"><input type="checkbox" checked={editing.active} onChange={e=>setEditing({...editing,active:e.target.checked})}/> Menu aktif di kasir</label><div className="editorActions"><button onClick={()=>setEditing(null)}>BATAL</button><button className="primary" onClick={async()=>{if(!editing.name.trim()||!editing.category.trim()||editing.price<=0){setNotice('Nama, kategori, dan harga harus diisi.');return}const next=editing.id?menus.map(m=>m.id===editing.id?{...editing,name:editing.name.trim(),category:editing.category.trim()}:m):[...menus,{...editing,id:'m'+crypto.randomUUID(),name:editing.name.trim(),category:editing.category.trim()}];await saveMenus(next);setEditing(null);setNotice('Menu berhasil disimpan.')}}>SIMPAN</button></div></div>:<><button className="primary addMenu" onClick={()=>setEditing({name:'',category:'Makanan',price:0,active:true})}>+ TAMBAH MENU</button><div className="adminList">{menus.map(m=><article className="adminItem" key={m.id}><div><b>{m.name}</b><small>{m.category} • {money(m.price)} • {m.active?'Aktif':'Nonaktif'}</small></div><button onClick={()=>setEditing({...m})}>EDIT</button></article>)}</div></>}</section>}
  {view==='riwayat'&&<section><div className="historyHead"><h2>Riwayat Nota</h2><button onClick={()=>setView('kasir')}>KEMBALI</button></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cari nomor, tanggal, atau nama menu…"/>{shown.map(t=><article className="history" key={t.id}><div className="historyHead"><b>{t.number}</b><small>{new Date(t.createdAt).toLocaleString('id-ID')}</small></div>{t.items.map(i=><div key={i.itemId||i.id}>{i.name} × {i.qty}<span>{money(i.subtotal)}</span></div>)}<strong>TOTAL {money(t.total)}</strong><small>Status: {t.status==='SYNCED'?'Tersinkron':'Belum tersinkron'}</small><button onClick={async()=>{if(!confirm(`Kirim ulang nota ${t.number}?`))return;try{await navigator.share({title:'Nota '+t.number,text:receiptText(t)})}catch(e){setNotice(e?.name==='AbortError'?'Kirim ulang dibatalkan. Nomor tetap sama.':'Share tidak tersedia.')}}}>KIRIM ULANG</button></article>)}{!shown.length&&<p className="empty">Belum ada nota.</p>}</section>}
  {recovery&&<div className="modal"><div className="modalCard"><h2>PULIHKAN DATA</h2><p>Masukkan kode pemulihan warung.</p><input autoFocus value={recoveryCode} onChange={e=>setRecoveryCode(e.target.value.toUpperCase())} placeholder="KODE PEMULIHAN"/><div className="editorActions"><button onClick={()=>setRecovery(false)}>BATAL</button><button className="primary" onClick={recoverySubmit}>PULIHKAN</button></div></div></div>}
  <footer>Offline-first • data tersimpan di perangkat</footer>
 </main>
}
createRoot(document.getElementById('root')).render(<App/>);