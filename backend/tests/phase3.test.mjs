import fs from 'fs';
const B=process.env.API_URL||'http://localhost:4000'; let pass=0, fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++; console.log((c?'PASS ':'FAIL ')+n+(c?'':'  -> '+x));};
const call=async(p,{method='GET',body,token,raw}={})=>{const h={...(token&&{Authorization:'Bearer '+token})}; if(raw)h['Content-Type']='application/pdf'; else if(body)h['Content-Type']='application/json'; const r=await fetch(B+p,{method,headers:h,body:raw||(body&&JSON.stringify(body))});const buf=Buffer.from(await r.arrayBuffer());let j=null;try{j=JSON.parse(buf.toString())}catch{} return {s:r.status,j,buf}};
const A=(await call('/api/admin/login',{method:'POST',body:{email:'admin@test.com',password:'longpassword123'}})).j.token;
const reg=async(email,company,extra={})=>call('/api/recruiter/register',{method:'POST',body:{email,full_name:'Rec '+company,password:'password123',company_name:company,...extra}});
const cand=async(email)=>(await call('/api/candidate/register',{method:'POST',body:{email,full_name:'Cand '+email[0],password:'password123'}})).j.token;
const files=()=>fs.readdirSync((process.env.UPLOAD_DIR||'/tmp/test-uploads')).length;

// --- registration / auth ---
let r=await reg('r1@acme.com','Acme',{password:'short'}); ok('weak password rejected',r.s===400);
r=await reg('r1@acme.com','Acme',{company_website:'javascript:alert(1)'}); ok('javascript: website rejected',r.s===400);
r=await reg('r1@acme.com','Acme',{company_website:'https://acme.example'}); const R1=r.j.token; ok('register -> pending',r.s===201&&r.j.status==='pending');
r=await reg('R1@acme.com','Acme'); ok('duplicate email 409',r.s===409);
r=await call('/api/recruiter/login',{method:'POST',body:{email:'r1@acme.com',password:'bad'}}); ok('wrong password 401',r.s===401);
const R2=(await reg('r2@beta.com','Beta')).j.token;
r=await call('/api/recruiter/me'); ok('no token 401',r.s===401);
r=await call('/api/recruiter/me',{token:A}); ok('admin token rejected on recruiter API',r.s===401);
const C1=await cand('c@x.com'); r=await call('/api/recruiter/me',{token:C1}); ok('candidate token rejected on recruiter API',r.s===401);
r=await call('/api/admin/recruiters',{token:R1}); ok('recruiter token rejected on admin API',r.s===401);
r=await call('/api/candidate/me',{token:R1}); ok('recruiter token rejected on candidate API',r.s===401);

// --- pending recruiter is locked out ---
r=await call('/api/recruiter/me',{token:R1}); ok('pending recruiter can see own status',r.j.recruiter.status==='pending'&&!('password_hash' in r.j.recruiter));
for(const [n,p,m] of [['create job','/api/recruiter/jobs','POST'],['list jobs','/api/recruiter/jobs','GET'],['applications','/api/recruiter/applications','GET'],['dashboard','/api/recruiter/dashboard','GET'],['AI parse','/api/recruiter/jobs/parse','POST']]){ r=await call(p,{method:m,token:R1,body:m==='POST'?{title:'x',text:'y'.repeat(40)}:undefined}); ok(`pending recruiter blocked: ${n}`,r.s===403&&r.j.status==='pending',r.s); }

// --- admin approval ---
r=await call('/api/admin/recruiters?status=pending',{token:A}); ok('admin sees pending recruiters with vetting info',r.j.recruiters.length===2&&r.j.recruiters[0].company_name&&!('password_hash' in r.j.recruiters[0]));
const id1=r.j.recruiters.find(x=>x.email==='r1@acme.com').id, id2=r.j.recruiters.find(x=>x.email==='r2@beta.com').id;
r=await call(`/api/admin/recruiters/${id1}/status`,{method:'POST',token:A,body:{status:'rejected'}}); ok('reject needs a reason',r.s===400);
await call(`/api/admin/recruiters/${id1}/status`,{method:'POST',token:A,body:{status:'approved'}}); await call(`/api/admin/recruiters/${id2}/status`,{method:'POST',token:A,body:{status:'approved'}});
r=await call('/api/recruiter/me',{token:R1}); ok('approval takes effect on existing token',r.j.recruiter.status==='approved');

// --- recruiter jobs ---
r=await call('/api/recruiter/jobs',{method:'POST',token:R1,body:{title:'Backend Engineer',company:'Google',description:'Build APIs',location:'Pune',skills:'Node.js, MySQL'}}); const J=r.j.job; ok("company forced to recruiter's own (spoofing 'Google' ignored)",r.s===201&&J.company==='Acme'&&J.status==='draft'&&J.recruiter_id===id1,JSON.stringify(r.j));
r=await call('/api/jobs/'+J.id); ok('recruiter draft is private',r.s===404);
r=await call('/api/recruiter/jobs',{method:'POST',token:R1,body:{title:'No desc'}}); const Jn=r.j.job.id;
r=await call(`/api/recruiter/jobs/${Jn}/status`,{method:'POST',token:R1,body:{status:'published'}}); ok('cannot publish incomplete job',r.s===400);
r=await call(`/api/recruiter/jobs/${J.id}/status`,{method:'POST',token:R1,body:{status:'published'}}); ok('publish OK without external URL (applies via TechAbhi)',r.s===200&&r.j.job.status==='published');
r=await call('/api/jobs/'+J.id); ok('public job: accepts_applications, recruiter id NOT exposed',r.s===200&&r.j.job.accepts_applications===true&&!JSON.stringify(r.j).includes('recruiter_id'),JSON.stringify(r.j).slice(0,300));
r=await call('/api/jobs'); ok('recruiter job in public list',r.j.jobs.some(x=>x.id===J.id));
const adminJob=(await call('/api/admin/jobs',{method:'POST',token:A,body:{title:'Admin Job',company:'Direct',description:'d',application_url:'https://direct.example/apply'}})).j.job.id; await call(`/api/admin/jobs/${adminJob}/status`,{method:'POST',token:A,body:{status:'published'}});

// --- ownership isolation ---
r=await call('/api/recruiter/jobs/'+J.id,{token:R2}); ok("other recruiter cannot read my job (404)",r.s===404);
r=await call('/api/recruiter/jobs/'+J.id,{method:'PUT',token:R2,body:{title:'Hijacked'}}); ok('other recruiter cannot edit',r.s===404);
r=await call(`/api/recruiter/jobs/${J.id}/status`,{method:'POST',token:R2,body:{status:'closed'}}); ok('other recruiter cannot close',r.s===404);
r=await call('/api/recruiter/jobs/'+Jn,{method:'DELETE',token:R2}); ok('other recruiter cannot delete',r.s===404);
r=await call('/api/recruiter/jobs/'+adminJob,{token:R1}); ok("recruiter cannot touch admin's job",r.s===404);
r=await call('/api/recruiter/jobs',{token:R2}); ok("recruiter list shows only own jobs",r.j.jobs.length===0);
r=await call('/api/jobs/'+J.id); ok('job untouched after attacks',r.j.job.title==='Backend Engineer');
r=await call('/api/recruiter/jobs/parse',{method:'POST',token:R1,body:{text:'We are hiring a Backend Dev in Pune. Apply at https://acme.example/apply. Node.js required.'}}); ok('recruiter AI parse works with the same anti-hallucination guards',r.s===200&&r.j.job.company===null&&r.j.warnings.length>=1,JSON.stringify(r.j));
r=await call('/api/recruiter/jobs/'+Jn,{method:'DELETE',token:R1}); ok('recruiter can delete own empty draft',r.s===200);

// --- candidate applies through TechAbhi ---
const C2=await cand('d@x.com'), C3=await cand('e@x.com');
r=await call('/api/candidate/applications/submit',{method:'POST',token:C1,body:{job_id:J.id}}); ok('no consent -> 400',r.s===400);
r=await call('/api/candidate/applications/submit',{method:'POST',token:C1,body:{job_id:J.id,consent:'yes'}}); ok('consent must be literal true',r.s===400);
r=await call('/api/candidate/applications/submit',{method:'POST',token:C1,body:{job_id:adminJob,consent:true}}); ok('admin/external job does not accept internal applications',r.s===400);
r=await call('/api/candidate/applications/submit',{method:'POST',token:C1,body:{job_id:J.id,consent:true}}); ok('empty profile + no resume -> 400',r.s===400);
r=await call('/api/candidate/applications/submit',{method:'POST',body:{job_id:J.id,consent:true}}); ok('anonymous cannot apply',r.s===401);
await call('/api/candidate/profile',{method:'PUT',token:C1,body:{headline:'MERN dev',skills:'React, Node.js',education:[{degree:'B.Tech',institution:'Parul University'}]}});
await call('/api/candidate/resume/upload?name=cv.pdf',{method:'POST',token:C1,raw:fs.readFileSync(new URL('./fixtures/resume.pdf', import.meta.url))});
const before=files();
r=await call('/api/candidate/applications/submit',{method:'POST',token:C1,body:{job_id:J.id,consent:true,share_resume:true,cover_note:'Hello team'}}); ok('apply with consent + resume',r.s===201);
ok('resume copied to its own file for the application',files()===before+1);
r=await call('/api/candidate/applications/submit',{method:'POST',token:C1,body:{job_id:J.id,consent:true}}); ok('duplicate application 409',r.s===409);
r=await call('/api/candidate/profile',{method:'PUT',token:C2,body:{headline:'Fresher',skills:'Java'}});
r=await call('/api/candidate/applications/submit',{method:'POST',token:C2,body:{job_id:J.id,consent:true,share_resume:false}}); ok('second candidate applies WITHOUT sharing resume',r.s===201);
r=await call('/api/candidate/submissions/'+J.id,{token:C1}); ok('candidate sees submission status',r.j.submission.status==='new'&&!r.j.submission.viewed_at);

// --- recruiter reviews ---
r=await call('/api/recruiter/applications',{token:R1}); ok('recruiter sees 2 applications (names only in list)',r.j.applications.length===2&&!JSON.stringify(r.j).includes('@x.com')&&!JSON.stringify(r.j).includes('React'));
const subC1=r.j.applications.find(x=>x.has_resume).id, subC2=r.j.applications.find(x=>!x.has_resume).id;
r=await call('/api/recruiter/applications',{token:R2}); ok("other recruiter sees none",r.j.applications.length===0);
r=await call('/api/recruiter/applications/'+subC1,{token:R2}); ok("other recruiter cannot open candidate details (404)",r.s===404);
r=await call(`/api/recruiter/applications/${subC1}/resume`,{token:R2}); ok("other recruiter cannot download resume",r.s===404);
r=await call(`/api/recruiter/applications/${subC1}`,{method:'PUT',token:R2,body:{status:'rejected'}}); ok("other recruiter cannot change status",r.s===404);
r=await call('/api/recruiter/applications/'+subC1,{token:R1}); const a=r.j.application; ok('owner sees consented details',a.candidate_email==='c@x.com'&&a.profile.skills.includes('React')&&a.cover_note==='Hello team'&&a.resume_text.includes('React')&&a.has_resume_file,JSON.stringify(a).slice(0,300));
r=await call('/api/candidate/submissions/'+J.id,{token:C1}); ok('viewed_at set only after recruiter really opened it',!!r.j.submission.viewed_at);
r=await call(`/api/recruiter/applications/${subC1}/resume`,{token:R1}); ok('owner downloads resume PDF',r.s===200&&r.buf.subarray(0,5).toString()==='%PDF-');
r=await call('/api/recruiter/applications/'+subC2,{token:R1}); ok('no-resume application exposes no resume',r.j.application.resume_text===null&&!r.j.application.has_resume_file);
r=await call(`/api/recruiter/applications/${subC2}/resume`,{token:R1}); ok('no resume download for unshared resume',r.s===404);
r=await call(`/api/recruiter/applications/${subC1}`,{method:'PUT',token:R1,body:{status:'hired-lol'}}); ok('invalid status rejected',r.s===400);
r=await call(`/api/recruiter/applications/${subC1}`,{method:'PUT',token:R1,body:{status:'shortlisted',recruiter_note:'strong'}}); ok('recruiter updates status + private note',r.s===200);
r=await call('/api/candidate/applications',{token:C1}); const row=r.j.applications.find(x=>x.id===J.id); ok('candidate sees employer status, NOT the private note',row.sub_status==='shortlisted'&&!JSON.stringify(r.j).includes('strong'));
r=await call('/api/candidate/applications/'+J.id,{method:'PUT',token:C1,body:{status:'withdrawn'}}); ok('self-tracker cannot fake a withdrawal of an active submission',r.s===400);
r=await call('/api/candidate/applications/'+J.id,{method:'PUT',token:C1,body:{status:'offer'}}); r=await call('/api/candidate/submissions/'+J.id,{token:C1}); ok("candidate cannot change the employer's status",r.j.submission.status==='shortlisted');

// --- dashboard + delete protections ---
r=await call('/api/recruiter/dashboard',{token:R1}); ok('dashboard real counts',r.j.jobs.published===1&&r.j.applications.new===1&&r.j.applications.shortlisted===1&&r.j.recent.length===2,JSON.stringify(r.j));
await call(`/api/recruiter/jobs/${J.id}/status`,{method:'POST',token:R1,body:{status:'closed'}});
r=await call('/api/recruiter/jobs/'+J.id,{method:'DELETE',token:R1}); ok('recruiter cannot delete job with applications',r.s===409);
r=await call('/api/admin/jobs/'+J.id,{method:'DELETE',token:A}); ok('admin delete of job with applications -> clean 409 (not 500)',r.s===409);
await call(`/api/recruiter/jobs/${J.id}/status`,{method:'POST',token:R1,body:{status:'published'}});

// --- withdraw wipes data ---
const f0=files();
r=await call(`/api/candidate/applications/${J.id}/withdraw`,{method:'POST',token:C1}); ok('candidate withdraws',r.s===200);
ok('withdraw deletes the shared resume copy',files()===f0-1);
r=await call('/api/recruiter/applications/'+subC1,{token:R1}); ok('recruiter now sees no personal data',r.j.application.status==='withdrawn'&&r.j.application.candidate_email===null&&r.j.application.profile===null&&r.j.application.resume_text===null&&r.j.application.cover_note===null,JSON.stringify(r.j));
r=await call(`/api/recruiter/applications/${subC1}`,{method:'PUT',token:R1,body:{status:'hired'}}); ok('cannot change a withdrawn application',r.s===409);

// --- admin suspends ---
r=await call(`/api/admin/recruiters/${id1}/status`,{method:'POST',token:A,body:{status:'suspended',reason:'Fake listings'}}); ok('suspend closes live jobs',r.s===200&&r.j.jobs_closed===1);
r=await call('/api/jobs/'+J.id); ok('suspended recruiter job disappears (410)',r.s===410);
r=await call('/api/recruiter/jobs',{token:R1}); ok('suspended recruiter locked out immediately',r.s===403&&r.j.status==='suspended');
r=await call('/api/recruiter/me',{token:R1}); ok('suspended recruiter sees the reason',r.j.recruiter.status_reason==='Fake listings');
r=await call('/api/admin/stats',{token:A}); ok('admin stats include pending recruiters',typeof r.j.pending_recruiters==='number');

// --- candidate account deletion removes application files ---
r=await call('/api/candidate/applications/submit',{method:'POST',token:C2,body:{job_id:adminJob,consent:true}});
await call('/api/candidate/resume/upload',{method:'POST',token:C3,raw:fs.readFileSync(new URL('./fixtures/resume.pdf', import.meta.url))});
await call(`/api/recruiter/jobs/${J.id}/status`,{method:'POST',token:R2,body:{status:'published'}}); // other's job: must stay 404
const J2=(await call('/api/recruiter/jobs',{method:'POST',token:R2,body:{title:'Beta Role',description:'d'}})).j.job.id; await call(`/api/recruiter/jobs/${J2}/status`,{method:'POST',token:R2,body:{status:'published'}});
await call('/api/candidate/applications/submit',{method:'POST',token:C3,body:{job_id:J2,consent:true,share_resume:true}});
const f1=files(); r=await call('/api/candidate/account',{method:'DELETE',token:C3,body:{password:'password123'}});
ok('account deletion removes resume AND its application copy',r.s===200&&files()===f1-2,`${f1} -> ${files()}`);
r=await call('/api/recruiter/applications',{token:R2}); ok('deleted candidate no longer visible to recruiter',r.j.applications.length===0);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
