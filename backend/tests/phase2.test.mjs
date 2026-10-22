import fs from 'fs';
const B=process.env.API_URL||'http://localhost:4000'; let pass=0, fail=0;
const ok=(n,c,x='')=>{c?pass++:fail++; console.log((c?'PASS ':'FAIL ')+n+(c?'':'  -> '+x));};
const call=async(p,{method='GET',body,token,raw,ct}={})=>{const h={...(token&&{Authorization:'Bearer '+token})}; if(raw){h['Content-Type']=ct||'application/pdf'} else if(body)h['Content-Type']='application/json'; const r=await fetch(B+p,{method,headers:h,body:raw||(body&&JSON.stringify(body))});const buf=Buffer.from(await r.arrayBuffer());let j=null;try{j=JSON.parse(buf.toString())}catch{} return {s:r.status,j,buf,h:r.headers}};
const A=(await call('/api/admin/login',{method:'POST',body:{email:'admin@test.com',password:'longpassword123'}})).j.token;
const mk=async(b,pub=true)=>{const r=await call('/api/admin/jobs',{method:'POST',token:A,body:b}); if(pub)await call(`/api/admin/jobs/${r.j.job.id}/status`,{method:'POST',token:A,body:{status:'published'}}); return r.j.job.id;};
const jA=await mk({title:'MERN Intern',company:'Acme',description:'d',location:'Ahmedabad',employment_type:'internship',work_mode:'hybrid',skills:'React, Node.js, MySQL, Docker',application_url:'https://acme.example/apply'});
const jC=await mk({title:'Java Dev',company:'Beta',description:'d',work_mode:'onsite',skills:'Java, Spring',application_email:'hr@beta.example'});
const jD=await mk({title:'Draft job',company:'Z',description:'d',application_url:'https://z.example'},false);

// auth
let r=await call('/api/candidate/register',{method:'POST',body:{email:'a@x.com',full_name:'Abhi',password:'short'}}); ok('short password rejected',r.s===400);
r=await call('/api/candidate/register',{method:'POST',body:{email:'bad',full_name:'Abhi',password:'password123'}}); ok('bad email rejected',r.s===400);
r=await call('/api/candidate/register',{method:'POST',body:{email:'a@x.com',full_name:'Abhi',password:'password123'}}); const T=r.j.token; ok('register',r.s===201&&T);
r=await call('/api/candidate/register',{method:'POST',body:{email:'A@x.com',full_name:'Abhi',password:'password123'}}); ok('duplicate email 409 (case-insens)',r.s===409);
r=await call('/api/candidate/login',{method:'POST',body:{email:'a@x.com',password:'nope'}}); ok('wrong password 401',r.s===401);
r=await call('/api/candidate/login',{method:'POST',body:{email:'a@x.com',password:'password123'}}); ok('login',r.s===200);
r=await call('/api/candidate/me'); ok('no token 401',r.s===401);
r=await call('/api/candidate/me',{token:A}); ok('admin token rejected on candidate API',r.s===401);
r=await call('/api/admin/jobs',{token:T}); ok('candidate token rejected on admin API',r.s===401);
const r2=await call('/api/candidate/register',{method:'POST',body:{email:'b@x.com',full_name:'Other',password:'password123'}}); const T2=r2.j.token;

// profile
r=await call('/api/candidate/profile',{method:'PUT',token:T,body:{headline:'MERN dev',skills:'React, Node.js, MySQL',preferred_work_mode:'hybrid',preferred_employment_type:'bogus',education:[{degree:'B.Tech',institution:'Parul'},{}],experience:'notarray'}}); ok('profile saved & sanitised',r.s===200&&r.j.profile.skills.length===3&&r.j.profile.preferred_employment_type===null&&r.j.profile.education.length===1&&r.j.profile.experience.length===0,JSON.stringify(r.j));
r=await call('/api/candidate/profile',{token:T}); ok('completeness computed',r.j.completeness.percent>0&&r.j.completeness.percent<100&&r.j.completeness.missing.includes('Resume added'));
r=await call('/api/candidate/profile/extract',{method:'POST',token:T}); ok('extract needs resume first',r.s===400);

// resume
r=await call('/api/candidate/resume/upload',{method:'POST',token:T,raw:Buffer.from('not a pdf '.repeat(30))}); ok('non-PDF rejected',r.s===400);
r=await call('/api/candidate/resume/upload',{method:'POST',token:T,raw:Buffer.from('%PDF-1.4 garbage '.repeat(20))}); ok('corrupt PDF -> 422',r.s===422,r.s);
r=await call('/api/candidate/resume/upload?name=my%20cv.pdf',{method:'POST',raw:fs.readFileSync(new URL('./fixtures/resume.pdf', import.meta.url))}); ok('upload needs login',r.s===401);
r=await call('/api/candidate/resume/upload?name=my%20cv.pdf',{method:'POST',token:T,raw:fs.readFileSync(new URL('./fixtures/resume.pdf', import.meta.url))}); ok('PDF upload + text extracted',r.s===201,JSON.stringify(r.j));
r=await call('/api/candidate/resume',{token:T}); ok('resume text readable by owner',r.j.has&&r.j.text.includes('React')&&r.j.has_file&&r.j.file_name==='my cv.pdf',JSON.stringify(r.j).slice(0,200));
const stored=fs.readdirSync((process.env.UPLOAD_DIR||'/tmp/test-uploads')); ok('file stored with random name, not served statically',stored.length===1&&/^[a-f0-9]{32}\.pdf$/.test(stored[0]));
r=await call('/api/candidate/resume/download',{token:T}); ok('owner can download PDF',r.s===200&&r.buf.subarray(0,5).toString()==='%PDF-');
r=await call('/api/candidate/resume/download',{token:T2}); ok("other candidate cannot get my resume",r.s===404);
r=await call('/api/candidate/resume/download'); ok('anonymous cannot download',r.s===401);
r=await call('/uploads/resumes/'+stored[0]); ok('no public path to resume file',r.s!==200||!r.buf.toString().startsWith('%PDF'));

// analysis (deterministic skill match + mock AI)
r=await call('/api/candidate/resume/analyze',{method:'POST',token:T,body:{job_id:jA}}); ok('analyze: matching skills',['React','Node.js','MySQL'].every(s=>r.j.matching_skills.includes(s)),JSON.stringify(r.j));
ok('analyze: Docker reported missing',r.j.missing_skills.length===1&&r.j.missing_skills[0]==='Docker');
ok('analyze: AI suggestions + disclaimer present',r.j.ai?.interview_tips.length===1&&r.j.disclaimer.includes('not a hiring decision'));
r=await call('/api/candidate/resume/analyze',{method:'POST',token:T,body:{job_id:jC}}); ok('"Java" NOT matched by "JavaScript" in resume',r.j.matching_skills.length===0&&r.j.missing_skills.includes('Java'),JSON.stringify(r.j));
r=await call('/api/candidate/resume/analyze',{method:'POST',token:T,body:{job_id:jD}}); ok('cannot analyse against draft job',r.s===404);
r=await call('/api/candidate/resume/analyze',{method:'POST',token:T,body:{}}); ok('general analysis without job',r.s===200&&r.j.job===null&&r.j.ai);

// AI profile extraction guards (mock invents Kubernetes, Fake University, Ghost Corp, Imaginary Rocket)
r=await call('/api/candidate/profile/extract',{method:'POST',token:T}); const p=r.j.profile;
ok('AI profile: invented skill removed, real kept',p.skills.includes('React')&&!p.skills.includes('Kubernetes'),JSON.stringify(p.skills));
ok('AI profile: invented education/company/project removed',p.education.length===1&&p.education[0].institution==='Parul University'&&p.experience.length===0&&p.projects.length===1&&p.projects[0].name==='Job portal',JSON.stringify(p));
ok('AI profile: warnings shown, nothing saved yet',r.j.warnings.length>=4);
r=await call('/api/candidate/profile',{token:T}); ok('extract did not auto-save',r.j.profile.headline==='MERN dev'&&r.j.profile.education[0].institution==='Parul');

// Phase 1 AI parser guard via mock
r=await call('/api/admin/jobs/parse',{method:'POST',token:A,body:{text:'We are hiring a Backend Dev in Pune. Apply at https://acme.example/apply. Node.js required. Salary not disclosed.'}});
ok('admin AI parse: hallucinated company & salary removed, real URL kept',r.j.job.company===null&&r.j.job.salary===null&&r.j.job.application_url==='https://acme.example/apply'&&r.j.warnings.length===2,JSON.stringify(r.j));

// saved jobs
r=await call('/api/candidate/saved',{method:'POST',token:T,body:{job_id:jD}}); ok('cannot save draft job',r.s===404);
r=await call('/api/candidate/saved',{method:'POST',token:T,body:{job_id:jA}}); ok('save job',r.s===201);
r=await call('/api/candidate/saved',{method:'POST',token:T,body:{job_id:jA}}); r=await call('/api/candidate/saved',{token:T}); ok('no duplicate saved records',r.j.jobs.length===1&&r.j.jobs[0].available);
r=await call('/api/candidate/saved',{token:T2}); ok("saved lists are per-user",r.j.jobs.length===0);
await call(`/api/admin/jobs/${jA}/status`,{method:'POST',token:A,body:{status:'closed'}});
r=await call('/api/candidate/saved',{token:T}); ok('closed job shown as unavailable',r.j.jobs[0].available===false&&r.j.jobs[0].status_note);
await call(`/api/admin/jobs/${jA}/status`,{method:'POST',token:A,body:{status:'published'}});
r=await call('/api/candidate/saved/'+jA,{method:'DELETE',token:T}); r=await call('/api/candidate/saved/ids',{token:T}); ok('remove saved job',r.j.ids.length===0);

// application tracking
r=await call('/api/candidate/applications/opened',{method:'POST',token:T,body:{job_id:jA}}); r=await call('/api/candidate/applications',{token:T}); ok('link opened recorded as link_opened (not "applied")',r.j.applications[0].app_status==='link_opened');
await call('/api/candidate/applications/'+jA,{method:'PUT',token:T,body:{status:'applied'}});
await call('/api/candidate/applications/opened',{method:'POST',token:T,body:{job_id:jA}}); r=await call('/api/candidate/applications',{token:T}); ok('re-opening link never downgrades status',r.j.applications.length===1&&r.j.applications[0].app_status==='applied');
r=await call('/api/candidate/applications/'+jA,{method:'PUT',token:T,body:{status:'hired-by-techabhi'}}); ok('invalid status rejected',r.s===400);
r=await call('/api/candidate/applications/'+jD,{method:'PUT',token:T,body:{status:'applied'}}); ok('cannot track a draft job',r.s===404);
r=await call('/api/candidate/applications',{token:T2}); ok("applications are per-user",r.j.applications.length===0);

// recommendations
r=await call('/api/candidate/recommendations',{token:T}); const top=r.j.jobs[0];
ok('recommendations ranked by skill match with reasons',!r.j.fallback&&top.id===jA&&top.matched_skills.length===3&&top.reasons.includes('Matches your preferred work mode'),JSON.stringify(r.j.jobs.map(j=>[j.id,j.score])));
ok('non-matching job not recommended',!r.j.jobs.some(j=>j.id===jC));
r=await call('/api/candidate/recommendations',{token:T2}); ok('no-skills user gets labelled fallback',r.j.fallback===true);
r=await call('/api/candidate/dashboard',{token:T}); ok('dashboard counts',r.j.tracked===1&&r.j.completeness.percent>0);
r=await call('/api/admin/stats',{token:A}); ok('admin stats include candidates & tracked apps',r.j.candidates===2&&r.j.tracked_applications===1);

// resume delete & account deletion
r=await call('/api/candidate/resume',{method:'DELETE',token:T}); ok('resume delete removes file',r.s===200&&fs.readdirSync((process.env.UPLOAD_DIR||'/tmp/test-uploads')).length===0);
await call('/api/candidate/resume/upload',{method:'POST',token:T,raw:fs.readFileSync(new URL('./fixtures/resume.pdf', import.meta.url))});
r=await call('/api/candidate/account',{method:'DELETE',token:T,body:{password:'wrong'}}); ok('account delete needs password',r.s===403);
r=await call('/api/candidate/account',{method:'DELETE',token:T,body:{password:'password123'}}); ok('account deleted',r.s===200);
r=await call('/api/candidate/login',{method:'POST',body:{email:'a@x.com',password:'password123'}}); ok('deleted account cannot log in',r.s===401);
ok('deleted account resume file removed',fs.readdirSync((process.env.UPLOAD_DIR||'/tmp/test-uploads')).length===0);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
