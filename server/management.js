const express = require('express');
const {randomUUID} = require('node:crypto');
const {query, withTransaction} = require('./db/pool');
const {requireAuth, requireRole} = require('./middleware/auth');
const router = express.Router();
router.use(requireAuth, requireRole('admin','librarian'));
const fail = (status, message) => Object.assign(new Error(message), {status, code: status === 409 ? 'CONFLICT' : 'INVALID_INPUT'});
const route = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
function id(value) { if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value)<1) throw fail(400,'Invalid record ID'); return Number(value); }
function str(body,key,max=500,required=false) { const value=body[key]; if(value == null && !required) return ''; if(typeof value!=='string' || value.length>max || (required && !value.trim())) throw fail(400,`Invalid ${key}`); return value.trim(); }
function num(body,key,min=0,max=100000,integer=false) { const raw=body[key]; const n=Number(raw); if((typeof raw!=='string' && typeof raw!=='number') || raw==='' || !Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n))) throw fail(400,`Invalid ${key}`);return n; }
function date(value) { if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString().slice(0,10)!==value) throw fail(400,'Invalid date');return value; }
function person(b) { const birth=str(b,'dateOfBirth',10); if(birth && date(birth)>new Date().toISOString().slice(0,10)) throw fail(400,'Birth date cannot be in the future'); const photo=str(b,'photoUrl',3000000); if(photo&&!/^(https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(photo)) throw fail(400,'Invalid photo'); return {firstName:str(b,'firstName',80,true),lastName:str(b,'lastName',80,true),dateOfBirth:birth||null,nationality:str(b,'nationality',60),photoUrl:photo||null}; }
const definitions = {
 publishers: {table:'publishers', validate:b=>({name:str(b,'name',200,true),address:str(b,'address',2000),country:str(b,'country',100),website:str(b,'website',500)||null,contactEmail:str(b,'contactEmail',254),contactPhone:str(b,'contactPhone',30)})},
 authors: {table:'authors',validate:b=>({...person(b),bio:str(b,'bio',5000)})},
 'membership-plans': {table:'membership_plans',validate:b=>{if(!['monthly','annual'].includes(b.billingTerm)||typeof b.isActive!=='boolean') throw fail(400,'Invalid plan settings');return {name:str(b,'name',100,true),description:str(b,'description',2000),price:num(b,'price',0,100000000),billingTerm:b.billingTerm,borrowingLimit:num(b,'borrowingLimit',1,1000,true),loanPeriodDays:num(b,'loanPeriodDays',1,3650,true),fineRatePerDay:num(b,'fineRatePerDay',0,1000000),isActive:b.isActive}}},
 members: {table:'members',validate:b=>{const email=str(b,'email',254,true).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail(400,'Invalid email');return {...person(b),email,phone:str(b,'phone',30,true),membershipId:id(b.membershipId)}}},
};
function mapped(row) {
 const out={...row,id:String(row.id)};
 if(out.membershipId!=null) out.membershipId=String(out.membershipId);
 for(const key of ['price','fineRatePerDay']) if(out[key]!=null) out[key]=Number(out[key]);
 if(out.dateOfBirth instanceof Date) out.dateOfBirth=out.dateOfBirth.toISOString().slice(0,10);
 return out;
}
for(const [name,def] of Object.entries(definitions)) {
 router.get('/'+name,route(async(_req,res)=>res.json({items:(await query(`SELECT * FROM ${def.table} ORDER BY id DESC`)).rows.map(mapped)})));
 for(const method of ['post','put']) router[method]('/'+name+(method==='put'?'/:id':''),route(async(req,res)=>{
   const data=def.validate(req.body);const recordId=method==='put'?id(req.params.id):null;
   if(name==='members' && !recordId) data.memberNumber=`MBR-${randomUUID()}`;
   const keys=Object.keys(data), values=Object.values(data);
   const sql=recordId ? `UPDATE ${def.table} SET ${keys.map((k,i)=>`"${k}"=$${i+1}`).join(',')}, "updatedAt"=now() WHERE id=$${values.length+1} RETURNING *` : `INSERT INTO ${def.table} (${keys.map(k=>`"${k}"`).join(',')}) VALUES (${values.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`;
   const result=await query(sql,recordId?[...values,recordId]:values);if(!result.rows[0]) throw fail(404,'Record not found');res.status(recordId?200:201).json({item:mapped(result.rows[0])});
 }));
 router.delete('/'+name+'/:id',route(async(req,res)=>{const r=await query(`DELETE FROM ${def.table} WHERE id=$1 RETURNING id`,[id(req.params.id)]);if(!r.rowCount) throw fail(404,'Record not found');res.json({ok:true})}));
}
const bookSelect=`SELECT b.*, count(c.id)::int AS total_copies,count(c.id) FILTER(WHERE c.status='available')::int AS available_copies FROM books b LEFT JOIN copies c ON c.book_id=b.id`;
function bookMap(b) {return {id:String(b.id),title:b.title,author:b.author,isbn:b.isbn,publishedYear:b.published_year,genre:b.genre,language:b.language,publisherId:b.publisher_id?String(b.publisher_id):'',edition:b.edition,description:b.description,totalCopies:b.total_copies,availableCopies:b.available_copies,createdAt:b.created_at,updatedAt:b.updated_at};}
router.get('/books',route(async(_req,res)=>res.json({items:(await query(bookSelect+' GROUP BY b.id ORDER BY b.id DESC')).rows.map(bookMap)})));
for(const method of ['post','put']) router[method]('/books'+(method==='put'?'/:id':''),route(async(req,res)=>{
 const b=req.body; const isbn=str(b,'isbn',20,true).replace(/[\s-]/g,'').toUpperCase();if(!/^(\d{9}[\dX]|\d{13})$/.test(isbn)) throw fail(400,'Invalid ISBN');
 const values=[str(b,'title',500,true),str(b,'author',200,true),isbn,num(b,'publishedYear',1000,new Date().getUTCFullYear()+1,true),str(b,'genre',60,true),str(b,'language',50,true),id(b.publisherId),str(b,'edition',40),str(b,'description',2000)];
 const count=num(b,'totalCopies',0,10000,true);
 const item=await withTransaction(async client=>{
 let bookId;
 if(method==='put') {bookId=id(req.params.id);if(!(await client.query('SELECT id FROM books WHERE id=$1 FOR UPDATE',[bookId])).rowCount)throw fail(404,'Book not found');await client.query('UPDATE books SET title=$1,author=$2,isbn=$3,published_year=$4,genre=$5,language=$6,publisher_id=$7,edition=$8,description=$9,updated_at=now() WHERE id=$10',[...values,bookId]);}
 else bookId=(await client.query('INSERT INTO books(title,author,isbn,published_year,genre,language,publisher_id,edition,description) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',values)).rows[0].id;
 const copies=(await client.query('SELECT id,status FROM copies WHERE book_id=$1 ORDER BY id FOR UPDATE',[bookId])).rows;
 if(count<copies.length) {const free=(await client.query("SELECT c.id FROM copies c WHERE c.book_id=$1 AND c.status='available' AND NOT EXISTS(SELECT 1 FROM loans l WHERE l.copy_id=c.id) ORDER BY c.id DESC LIMIT $2",[bookId,copies.length-count])).rows;if(free.length<copies.length-count)throw fail(409,'Cannot remove copies with loan history or unavailable copies');await client.query('DELETE FROM copies WHERE id=ANY($1::int[])',[free.map(c=>c.id)]);}
 for(let i=copies.length;i<count;i++)await client.query("INSERT INTO copies(book_id,barcode,status) VALUES($1,$2,'available')",[bookId,randomUUID()]);
 return bookMap((await client.query(bookSelect+' WHERE b.id=$1 GROUP BY b.id',[bookId])).rows[0]);
 });res.status(method==='post'?201:200).json({item});
}));
router.delete('/books/:id',route(async(req,res)=>{const r=await query('DELETE FROM books WHERE id=$1 RETURNING id',[id(req.params.id)]);if(!r.rowCount)throw fail(404,'Book not found');res.json({ok:true})}));
const loanSelect=`SELECT l.*,c.book_id FROM loans l JOIN copies c ON c.id=l.copy_id`;
function loanMap(l) {const day=v=>v?new Date(v).toISOString().slice(0,10):null;return {id:String(l.id),bookId:String(l.book_id),memberId:l.member_id?String(l.member_id):'',issueDate:day(l.issued_at),dueDate:day(l.due_at),returnDate:day(l.returned_at),status:l.status==='active'&&new Date(l.due_at)<new Date()?'overdue':l.status,createdAt:l.issued_at,updatedAt:l.returned_at||l.issued_at};}
router.get('/loans',route(async(_req,res)=>res.json({items:(await query(loanSelect+' ORDER BY l.id DESC')).rows.map(loanMap)})));
router.post('/loans',route(async(req,res)=>{
 const bookId=id(req.body.bookId),memberId=id(req.body.memberId),issue=date(req.body.issueDate),due=date(req.body.dueDate);
 if(issue>new Date().toISOString().slice(0,10)||due<=issue)throw fail(400,'Invalid loan dates');
 const item=await withTransaction(async client=>{
 const m=(await client.query('SELECT m.*,p.* FROM members m JOIN membership_plans p ON p.id=m."membershipId" WHERE m.id=$1 FOR UPDATE OF m',[memberId])).rows[0];
 if(!m||m.status!=='active'||!m.isActive)throw fail(409,'Member and plan must be active');
 const open=Number((await client.query("SELECT count(*) FROM loans WHERE member_id=$1 AND status!='returned'",[memberId])).rows[0].count);
 if(open>=m.borrowingLimit||(Date.parse(due)-Date.parse(issue))/86400000>m.loanPeriodDays)throw fail(409,'Membership borrowing limit or loan period exceeded');
 await client.query('SELECT id FROM books WHERE id=$1 FOR UPDATE',[bookId]);
 const copy=(await client.query("SELECT id FROM copies WHERE book_id=$1 AND status='available' ORDER BY id LIMIT 1 FOR UPDATE",[bookId])).rows[0];
 if(!copy)throw fail(409,'No available physical copy');
 const l=(await client.query("INSERT INTO loans(copy_id,user_id,member_id,issued_at,due_at) VALUES($1,$2,$3,$4,$5) RETURNING *",[copy.id,req.user.id,memberId,issue+'T00:00:00Z',due+'T23:59:59.999Z'])).rows[0];
 await client.query("UPDATE copies SET status='loaned' WHERE id=$1",[copy.id]);return loanMap({...l,book_id:bookId});
 });res.status(201).json({item});
}));
router.put('/loans/:id',route(async()=>{throw fail(409,'Issued loans cannot be rewritten. Return this loan and issue a new one.')}));
router.delete('/loans/:id',route(async()=>{throw fail(409,'Loan history must be retained. Return the loan instead.')}));
router.post('/loans/:id/return',route(async(req,res)=>{
 const result=await withTransaction(async client=>{
 const l=(await client.query('SELECT * FROM loans WHERE id=$1 FOR UPDATE',[id(req.params.id)])).rows[0];if(!l)throw fail(404,'Loan not found');if(!['active','overdue'].includes(l.status))throw fail(409,'Loan is not active');
 await client.query("UPDATE loans SET status='returned',returned_at=now() WHERE id=$1",[l.id]);await client.query("UPDATE copies SET status='available' WHERE id=$1",[l.copy_id]);
 const days=Math.max(0,Math.ceil((Date.now()-new Date(l.due_at).getTime())/86400000));
 if(days) {const plan=(await client.query('SELECT p."fineRatePerDay" FROM members m JOIN membership_plans p ON p.id=m."membershipId" WHERE m.id=$1',[l.member_id])).rows[0];const cents=Math.round(Number(plan?.fineRatePerDay??20)*100)*days;await client.query("INSERT INTO fines(loan_id,user_id,member_id,amount_cents) VALUES($1,$2,$3,$4)",[l.id,l.user_id,l.member_id,cents]);}
 return {ok:true};
 });res.json(result);
}));
router.get('/fines',route(async(_req,res)=>{const rows=(await query('SELECT f.*,l.due_at,l.returned_at,c.book_id FROM fines f JOIN loans l ON l.id=f.loan_id JOIN copies c ON c.id=l.copy_id ORDER BY f.id DESC')).rows;res.json({items:rows.map(f=>({id:String(f.id),loanId:String(f.loan_id),memberId:f.member_id?String(f.member_id):'',bookId:String(f.book_id),dueDate:new Date(f.due_at).toISOString().slice(0,10),daysOverdue:Math.max(0,Math.ceil((new Date(f.returned_at||f.created_at)-new Date(f.due_at))/86400000)),amount:f.amount_cents/100,status:f.status,createdAt:f.created_at,updatedAt:f.paid_at||f.created_at}))})}));
router.post('/fines/:id/pay',route(async(req,res)=>{const r=await query("UPDATE fines SET status='paid',paid_at=now() WHERE id=$1 AND status='outstanding' RETURNING id",[id(req.params.id)]);if(!r.rowCount)throw fail(409,'Fine is not outstanding');res.json({ok:true})}));
router.delete('/fines/:id',route(async()=>{throw fail(409,'Fine records must be retained for audit.')}));
module.exports=router;
