export const OPERATIONAL_HOUR=5;
export function operationalDate(value){
 const d=new Date(value);if(Number.isNaN(d.getTime()))throw new Error('Invalid date');
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(d);
 const get=k=>parts.find(p=>p.type===k)?.value;
 let y=Number(get('year')),m=Number(get('month')),day=Number(get('day')),hour=Number(get('hour'));
 if(hour<OPERATIONAL_HOUR){const x=new Date(Date.UTC(y,m-1,day));x.setUTCDate(x.getUTCDate()-1);y=x.getUTCFullYear();m=x.getUTCMonth()+1;day=x.getUTCDate()}
 return `${String(y).slice(2)}${String(m).padStart(2,'0')}${String(day).padStart(2,'0')}`;
}
export function money(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n)}
export function calculateTotal(items){return items.reduce((sum,item)=>sum+(item.price*item.qty),0)}
export function snapshotItems(items){return items.map(({id,name,category,price,qty})=>({id,name,category,price,qty,subtotal:price*qty}))}
export function receiptText(t){return ['WARUNG BU SUKARNI','Nota '+t.number,new Date(t.createdAt).toLocaleString('id-ID'),' ',...t.items.map(i=>`${i.name} x${i.qty} @ ${money(i.price)} = ${money(i.subtotal)}`),' ','TOTAL '+money(t.total),' ','Terima kasih telah berbelanja di Warung Bu Sukarni.'].join('\n')}
export function matchesHistory(t,q){q=q.trim().toLowerCase();if(!q)return true;const d=new Date(t.createdAt),date=d.toLocaleDateString('id-ID'),iso=d.toISOString().slice(0,10),compact=iso.split('-').reverse().join('/');return t.number.toLowerCase().includes(q)||date.includes(q)||iso.includes(q)||compact.includes(q)||t.items.some(i=>i.name.toLowerCase().includes(q))}
export function canSend(online){return Boolean(online)}