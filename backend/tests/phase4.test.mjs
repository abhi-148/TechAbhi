import fs from 'fs';
const B=process.env.API_URL||'http://localhost:4000'; let pass=0, fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++; console.log((c?'PASS ':'FAIL ')+n+(c?'':'  -> '+x));};
const call=async(p,{method='GET',body,token}={})=>{const h={...(token&&{Authorization:'Bearer '+token})}; if(body)h['Content-Type']='application/json'; const r=await fetch(B+p,{method,headers:h,body:body&&JSON.stringify(body)});const buf=Buffer.from(await r.arrayBuffer());let j=null;try{j=JSON.parse(buf.toString())}catch{} return {s:r.status,j,buf}};
const A=(await call('/api/admin/login',{method:'POST',body:{email:'admin@test.com',password:'longpassword123'}})).j.token;
const cand=async(email)=>(await call('/api/candidate/register',{method:'POST',body:{email,full_name:'Cand '+email[0],password:'password123'}})).j.token;
const AS='/api/candidate/assistance', AD='/api/admin/assistance';
const T=await cand('h1@x.com'), T2=await cand('h2@x.com');
await call('/api/candidate/profile',{method:'PUT',token:T,body:{headline:'MERN dev',summary:'Fresher',skills:'React, Node.js',education:[{degree:'B.Tech',institution:'Parul'}]}});
await call('/api/candidate/resume/text',{method:'POST',token:T,body:{text:'Abhi Kumar resume. Skills React Node.js MySQL. Secret-Resume-Marker-123 built a job portal.'}});

// --- request ---
let r=await call(AS); ok('anonymous cannot use assistance',r.s===401);
r=await call(AS,{token:A}); ok('admin token not valid on candidate side',r.s===401);
r=await call(AS,{method:'POST',token:T2,body:{target_roles:'Dev',consent_review:true}}); ok('empty profile and no resume -> 400',r.s===400);
r=await call(AS,{method:'POST',token:T,body:{target_roles:'Dev'}}); ok('no consent -> 400',r.s===400);
r=await call(AS,{method:'POST',token:T,body:{target_roles:'Dev',consent_review:'true'}}); ok('consent must be literal true',r.s===400);
r=await call(AS,{method:'POST',token:T,body:{consent_review:true}}); ok('roles required',r.s===400);
r=await call(AS,{method:'POST',token:T,body:{target_roles:'Junior MERN developer',preferred_locations:'Ahmedabad',challenges:'No callbacks',consent_review:true}}); ok('request created',r.s===201&&r.j.request.status==='submitted'&&r.j.can_request===false&&r.j.request.updates.length===1,JSON.stringify(r.j));
ok('system message has no guarantee',/does not guarantee/.test(r.j.request.updates[0].message));
r=await call(AS,{method:'POST',token:T,body:{target_roles:'Another',consent_review:true}}); ok('only ONE open request (409)',r.s===409);
r=await call(AS,{token:T2}); ok('other candidate sees nothing',r.j.request===null);
const reqId=(await call(AS,{token:T})).j.request.id;

// --- admin access ---
r=await call(AD,{token:T}); ok('candidate token rejected on admin assistance',r.s===401);
const R=(await call('/api/recruiter/register',{method:'POST',body:{email:'rr@x.com',full_name:'R',password:'password123',company_name:'RecCo'}})).j.token;
r=await call(AD,{token:R}); ok('recruiter token rejected on admin assistance',r.s===401);
r=await call(AD+'?status=submitted',{token:A}); ok('admin sees request in list (no personal detail)',r.j.requests.length===1&&!JSON.stringify(r.j).includes('@x.com'));
r=await call(`${AD}/${reqId}`,{token:A}); ok('admin detail has consented profile + resume',r.j.profile.skills.includes('React')&&r.j.resume.text.includes('Secret-Resume-Marker-123')&&r.j.candidate.email==='h1@x.com');
r=await call(AS,{token:T}); ok('candidate sees team opened request (real event)',!!r.j.request.first_viewed_at);
r=await call(`${AD}/${reqId}/status`,{method:'PUT',token:A,body:{status:'in_review'}}); r=await call(AS,{token:T}); ok('status change posts update to candidate',r.j.request.status==='in_review'&&r.j.request.updates[0].message.includes('reviewing'));
r=await call(`${AD}/${reqId}/status`,{method:'PUT',token:A,body:{status:'in_progress'}}); r=await call(AS,{token:T}); ok('in_progress message says not a promise',/not a promise/.test(r.j.request.updates[0].message));
r=await call(`${AD}/${reqId}/status`,{method:'PUT',token:A,body:{status:'hired'}}); ok('invalid status rejected',r.s===400);

// --- outreach: consent gate ---
r=await call(`${AD}/${reqId}/outreach`,{method:'POST',token:A,body:{company_name:'',message:'x'}}); ok('company required',r.s===400);
r=await call(`${AD}/${reqId}/outreach`,{method:'POST',token:A,body:{company_name:'Acme',shared_fields:['email']}}); ok('explanation message required',r.s===400);
r=await call(`${AD}/${reqId}/outreach`,{method:'POST',token:A,body:{company_name:'Acme',message:'m',shared_fields:['password_hash']}}); ok('cannot propose sharing arbitrary fields',r.s===400);
r=await call(`${AD}/${reqId}/outreach`,{method:'POST',token:A,body:{company_name:'Acme Corp',hr_contact:'hr.jane@acme.example',message:'Hiring juniors, will send your email only.',shared_fields:['email'],admin_note:'PRIVATE-NOTE-XYZ'}}); const o1=r.j.id; ok('proposal created',r.s===201);
r=await call(`${AD}/${reqId}/outreach`,{method:'POST',token:A,body:{company_name:'Beta Ltd',hr_contact:'hr@beta.example',message:'Full profile and resume.',shared_fields:['profile','resume']}}); const o2=r.j.id;
r=await call(AS,{token:T}); const co=r.j.request.outreach.find(x=>x.id===o1);
ok('candidate sees proposal + what is shared',co.status==='proposed'&&co.shared_fields[0]==='email'&&co.message.includes('email only'));
ok('candidate NEVER sees HR contact or admin note',!JSON.stringify(r.j).includes('hr.jane')&&!JSON.stringify(r.j).includes('PRIVATE-NOTE-XYZ')&&!JSON.stringify(r.j).includes('hr@beta'));
r=await call(`${AD}/outreach/${o1}`,{method:'PUT',token:A,body:{status:'shared'}}); ok('CANNOT mark shared before candidate approves',r.s===409&&/not approved/.test(r.j.error),JSON.stringify(r.j));
r=await call(`${AD}/outreach/${o1}/packet`,{token:A}); ok('CANNOT get packet before approval',r.s===409);
r=await call(`${AS}/outreach/${o1}/decision`,{method:'POST',token:T2,body:{decision:'approve'}}); ok("other candidate cannot decide on someone's proposal",r.s===404);
r=await call(`${AS}/outreach/${o1}/decision`,{method:'POST',token:T,body:{decision:'approve'}}); ok('candidate approves',r.s===200&&r.j.request.outreach.find(x=>x.id===o1).status==='candidate_approved');
r=await call(`${AS}/outreach/${o2}/decision`,{method:'POST',token:T,body:{decision:'decline'}}); r=await call(`${AD}/outreach/${o2}/packet`,{token:A}); ok('declined company: no packet possible',r.s===409);
r=await call(`${AD}/outreach/${o2}`,{method:'PUT',token:A,body:{status:'shared'}}); ok('declined company: cannot be marked shared',r.s===409);
r=await call(`${AD}/outreach/${o1}/packet`,{token:A}); ok('packet = name + email ONLY (no profile, no resume)',r.s===200&&r.j.text.includes('Cand h')&&r.j.text.includes('h1@x.com')&&!r.j.text.includes('MERN dev')&&!r.j.text.includes('Secret-Resume-Marker-123')&&!r.j.text.includes('React'),r.j.text);
r=await call(`${AD}/outreach/${o1}`,{method:'PUT',token:A,body:{status:'interview_scheduled',interview_at:'2026-12-01T10:00',interview_info:'x'}}); ok('cannot skip to interview before sharing',r.s===409);
r=await call(`${AD}/outreach/${o1}`,{method:'PUT',token:A,body:{status:'shared'}}); ok('mark shared after approval',r.s===200);
r=await call(AS,{token:T}); ok('candidate sees "recorded shared" + update',r.j.request.outreach.find(x=>x.id===o1).shared_at&&/recorded that your details were shared/.test(r.j.request.updates[0].message));
r=await call(`${AS}/outreach/${o1}/decision`,{method:'POST',token:T,body:{decision:'revoke'}}); ok('cannot revoke after it was shared (clear message)',r.s===409&&/already shared/.test(r.j.error));

// --- response / interview recording ---
r=await call(`${AD}/outreach/${o1}`,{method:'PUT',token:A,body:{status:'response_received'}}); ok('record response',r.s===200);
r=await call(`${AD}/outreach/${o1}`,{method:'PUT',token:A,body:{status:'interview_scheduled'}}); ok('interview needs date + confirmed details',r.s===400);
r=await call(`${AD}/outreach/${o1}`,{method:'PUT',token:A,body:{status:'interview_scheduled',interview_at:'2026-12-01T10:00',interview_info:'Video call; link from company HR'}}); ok('record interview',r.s===200);
r=await call(AS,{token:T}); const oo=r.j.request.outreach.find(x=>x.id===o1); ok('candidate sees interview info',oo.status==='interview_scheduled'&&oo.interview_info.includes('Video call'));

// --- revoke before sharing ---
r=await call(`${AD}/${reqId}/outreach`,{method:'POST',token:A,body:{company_name:'Gamma',message:'try',shared_fields:['profile']}}); const o3=r.j.id;
await call(`${AS}/outreach/${o3}/decision`,{method:'POST',token:T,body:{decision:'approve'}});
r=await call(`${AS}/outreach/${o3}/decision`,{method:'POST',token:T,body:{decision:'revoke'}}); ok('candidate can revoke before sharing',r.s===200);
r=await call(`${AD}/outreach/${o3}`,{method:'PUT',token:A,body:{status:'shared'}}); ok('revoked approval blocks sharing',r.s===409);

// --- close ---
r=await call(`${AD}/${reqId}/outreach`,{method:'POST',token:A,body:{company_name:'Delta',message:'pending',shared_fields:['email']}}); const o4=r.j.id;
await call(`${AS}/outreach/${o4}/decision`,{method:'POST',token:T,body:{decision:'approve'}});
r=await call(`${AD}/${reqId}/status`,{method:'PUT',token:A,body:{status:'closed'}}); ok('closing needs a reason',r.s===400);
r=await call(`${AD}/${reqId}/status`,{method:'PUT',token:A,body:{status:'closed',reason:'Placed via other channel'}}); ok('admin closes with reason',r.s===200);
r=await call(`${AD}/${reqId}`,{token:A}); ok('after close: admin can no longer read personal data',r.j.profile===null&&r.j.resume===null&&r.j.candidate.email===undefined&&r.j.request.challenges===null,JSON.stringify(r.j).slice(0,200));
r=await call(`${AD}/outreach/${o4}/packet`,{token:A}); ok('after close: no packet',r.s===409);
r=await call(`${AD}/${reqId}/resume`,{token:A}); ok('after close: no resume access',r.s===409);
r=await call(AS,{token:T}); ok('candidate sees reason; unshared approved outreach cancelled',r.j.request.closed_reason==='Placed via other channel'&&r.j.request.outreach.find(x=>x.id===o4).status==='closed'&&r.j.request.outreach.find(x=>x.id===o1).status==='interview_scheduled'&&r.j.can_request===true);
r=await call(`${AD}/${reqId}/updates`,{method:'POST',token:A,body:{message:'hi'}}); ok('cannot post updates on closed request',r.s===409);

// --- new request + withdraw wipes ---
r=await call(AS,{method:'POST',token:T,body:{target_roles:'Backend roles',challenges:'SENSITIVE-CHALLENGE-TEXT',consent_review:true}}); ok('can open a new request after closure',r.s===201);
const req2=r.j.request.id;
r=await call(`${AD}/${req2}/outreach`,{method:'POST',token:A,body:{company_name:'Eps',message:'m',shared_fields:['email']}}); const o5=r.j.id; await call(`${AS}/outreach/${o5}/decision`,{method:'POST',token:T,body:{decision:'approve'}});
r=await call(`${AS}/withdraw`,{method:'POST',token:T}); ok('candidate withdraws',r.s===200);
r=await call(`${AD}/${req2}`,{token:A}); ok('withdraw wipes request text and blocks admin access',r.j.request.challenges===null&&r.j.profile===null&&!JSON.stringify(r.j).includes('SENSITIVE-CHALLENGE-TEXT'));
r=await call(`${AD}/outreach/${o5}/packet`,{token:A}); ok('withdrawn: pending approval can no longer be used',r.s===409);
r=await call(`${AS}/withdraw`,{method:'POST',token:T}); ok('withdraw twice -> 404',r.s===404);

// --- stats, deletion ---
await call(AS,{method:'POST',token:T,body:{target_roles:'Again',consent_review:true}});
r=await call('/api/admin/stats',{token:A}); ok('admin stats count new requests',r.j.new_assistance_requests>=1);
import { execSync } from 'child_process';
const q=(sql)=>Number(execSync(`${process.env.MYSQL_CLI||'mysql -uroot'} ${process.env.DB_NAME||'techabhi'} -N -e "${sql}"`).toString().trim());
ok('access log: exactly 1 view + 1 packet (blocked attempts are not logged as access)',q("SELECT COUNT(*) FROM assistance_access_log WHERE action='view'")===1&&q("SELECT COUNT(*) FROM assistance_access_log WHERE action='packet'")===1&&q("SELECT COUNT(*) FROM assistance_access_log WHERE action='resume'")===0);
ok('requests/outreach/updates exist before deletion',q('SELECT COUNT(*) FROM assistance_requests')>=3&&q('SELECT COUNT(*) FROM assistance_outreach')>=5&&q('SELECT COUNT(*) FROM assistance_updates')>10);
r=await call('/api/candidate/account',{method:'DELETE',token:T,body:{password:'password123'}}); ok('account deletion',r.s===200);
ok('deletion cascades: no requests, outreach, updates or logs remain',q('SELECT COUNT(*) FROM assistance_requests')===0&&q('SELECT COUNT(*) FROM assistance_outreach')===0&&q('SELECT COUNT(*) FROM assistance_updates')===0&&q('SELECT COUNT(*) FROM assistance_access_log')===0);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
