// Fake Gemini server for tests. Deliberately returns INVENTED skills/companies/schools to prove the guards remove them.
import http from 'http';
http.createServer((q, s) => { let b=''; q.on('data',c=>b+=c); q.on('end',()=>{
  const sys=JSON.parse(b).systemInstruction.parts[0].text; let o;
  if (sys.includes('candidate profile')) o={headline:'MERN Developer',summary:'Final-year student.',skills:['React','Node.js','Kubernetes'],education:[{degree:'B.Tech CSE',institution:'Parul University',year:'2026'},{degree:'MBA',institution:'Fake University',year:'2030'}],experience:[{title:'Intern',company:'Ghost Corp'}],projects:[{name:'Job portal',details:'Built with Express'},{name:'Imaginary Rocket',details:'x'}]};
  else if (sys.includes('career coach')) o={improvement_suggestions:['Add metrics to projects'],project_ideas:['Dockerize the job portal'],interview_tips:['Revise REST basics'],unverifiable:['Claimed 2 years experience']};
  else o={title:'Backend Dev',company:'Hallucinated Inc',salary:'₹99 LPA',location:'Pune',skills:['Node.js'],application_url:'https://acme.example/apply',description:'Build APIs'};
  s.setHeader('Content-Type','application/json'); s.end(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify(o)}]}}]}));
});}).listen(Number(process.env.MOCK_PORT||4100));
