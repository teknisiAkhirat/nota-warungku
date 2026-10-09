export function normalizeCatalogName(value){return String(value??'').trim().toLocaleLowerCase('id-ID')}
export function categoryNames(menus){return [...new Set(menus.map(m=>String(m.category??'').trim()).filter(Boolean))]}
export function catalogFromCloud(categories,rows){const names=new Map(categories.map(c=>[c.id,c.name]));return rows.map(m=>({id:m.id,category:names.get(m.category_id)||'Lainnya',name:m.name,price:Number(m.price)||0,active:m.is_active!==false}))}
export function findCloudMenu(local,rows,categoryId){const byId=rows.find(m=>m.id===local.id);if(byId)return byId;const name=normalizeCatalogName(local.name);return rows.find(m=>m.category_id===categoryId&&normalizeCatalogName(m.name)===name)}
export function orderedCategoryNames(menus){return categoryNames(menus).map((name,sort_order)=>({name,sort_order}))}
