const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const app=require('./index');
const {pool,query}=require('./db/pool');
const bcrypt=require('bcryptjs');

test('real PostgreSQL: login, persistence, concurrent checkout, return, payment, session revocation',async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 const tag=randomUUID(), password=randomUUID();let userId,memberId,bookId,planId,publisherId,authorId,cookie;
 async function request(path,method='GET',body,session=cookie){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(session?{Cookie:session}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,body:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 try {
  userId=(await query("INSERT INTO users(username,email,password_hash,role) VALUES($1,$2,$3,'admin') RETURNING id",[tag,tag+'@example.test',await bcrypt.hash(password,10)])).rows[0].id;
  assert.equal((await request('/api/manage/books')).status,401);
  assert.equal((await request('/api/auth/login','POST',{username:tag,password:'incorrect'})).status,401);
  const login=await request('/api/auth/login','POST',{username:tag,password});assert.equal(login.status,200);cookie=login.cookie;assert.ok(cookie);
  assert.equal((await request('/api/auth/me')).body.user.id,userId);
  async function create(resource,data){const r=await request('/api/manage/'+resource,'POST',data);assert.equal(r.status,201,JSON.stringify(r.body));return r.body.item;}
  publisherId=(await create('publishers',{name:tag})).id;
  authorId=(await create('authors',{firstName:'Test',lastName:tag})).id;
  planId=(await create('membership-plans',{name:tag,price:0,billingTerm:'monthly',borrowingLimit:2,loanPeriodDays:30,fineRatePerDay:20,isActive:true})).id;
  memberId=(await create('members',{firstName:'Test',lastName:tag,email:tag+'@example.test',phone:'12345678',membershipId:planId})).id;
  const book={title:tag,author:'Test Author',isbn:String(Date.now()),publishedYear:2025,genre:'Test',language:'English',publisherId,totalCopies:1};
  bookId=(await create('books',book)).id;
  assert.equal((await query('SELECT count(*) FROM copies WHERE book_id=$1',[bookId])).rows[0].count,'1');
  assert.ok((await request('/api/manage/books')).body.items.some(b=>b.id===bookId));
  const bad=await request('/api/manage/books/'+bookId,'PUT',{...book,totalCopies:-1});assert.equal(bad.status,400);
  const issue=new Date(Date.now()-3*86400000).toISOString().slice(0,10),due=new Date(Date.now()-86400000).toISOString().slice(0,10);
  const loans=await Promise.all([request('/api/manage/loans','POST',{bookId,memberId,issueDate:issue,dueDate:due}),request('/api/manage/loans','POST',{bookId,memberId,issueDate:issue,dueDate:due})]);
  assert.deepEqual(loans.map(r=>r.status).sort(),[201,409]);
  const loanId=loans.find(r=>r.status===201).body.item.id;
  assert.equal((await request('/api/manage/books/'+bookId,'PUT',{...book,totalCopies:0})).status,409);
  assert.equal((await request('/api/manage/loans/'+loanId+'/return','POST')).status,200);
  assert.equal((await request('/api/manage/loans/'+loanId+'/return','POST')).status,409);
  const fine=(await request('/api/manage/fines')).body.items.find(f=>f.loanId===loanId);assert.ok(fine);assert.ok(fine.amount>0);
  assert.equal((await request('/api/manage/fines/'+fine.id+'/pay','POST')).status,200);
  assert.equal((await request('/api/manage/fines/'+fine.id+'/pay','POST')).status,409);
  await query("UPDATE users SET role='member' WHERE id=$1",[userId]);assert.equal((await request('/api/manage/members')).status,403);
  assert.equal((await request('/api/auth/logout','POST')).status,200);
  assert.equal((await request('/api/auth/me')).status,401);
 } finally {
  if(userId){await query('DELETE FROM fines WHERE user_id=$1',[userId]);await query('DELETE FROM loans WHERE user_id=$1',[userId]);}
  if(bookId)await query('DELETE FROM books WHERE id=$1',[bookId]);
  if(memberId)await query('DELETE FROM members WHERE id=$1',[memberId]);
  if(planId)await query('DELETE FROM membership_plans WHERE id=$1',[planId]);
  if(publisherId)await query('DELETE FROM publishers WHERE id=$1',[publisherId]);
  if(authorId)await query('DELETE FROM authors WHERE id=$1',[authorId]);
  if(userId)await query('DELETE FROM users WHERE id=$1',[userId]);
  await new Promise(resolve=>server.close(resolve));await pool.end();
 }
});
