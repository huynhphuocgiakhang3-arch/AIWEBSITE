'use client';

import { useEffect, useMemo, useState } from 'react';

type View = 'Overview'|'Chat'|'Projects'|'Studio'|'Preview'|'Agent'|'Learn'|'Memory'|'Knowledge'|'Settings';
type FileItem = { path: string; content: string };
type Mission = { id:number; title:string; kind:string; status:'Ready'|'Running'|'Completed'; time:string };

const nav: {id:View; icon:string; label:string}[] = [
  {id:'Overview',icon:'⌂',label:'Overview'}, {id:'Chat',icon:'✦',label:'AI Chat'},
  {id:'Projects',icon:'◈',label:'Projects'}, {id:'Studio',icon:'⌘',label:'Code Studio'},
  {id:'Preview',icon:'▷',label:'Preview'}, {id:'Agent',icon:'⚡',label:'Agent'},
  {id:'Learn',icon:'◎',label:'Learn'}, {id:'Memory',icon:'◌',label:'Memory'},
  {id:'Knowledge',icon:'◍',label:'Knowledge'}, {id:'Settings',icon:'⚙',label:'Settings'},
];

const seedMissions: Mission[] = [
  {id:1,title:'Build a premium landing page',kind:'Frontend',status:'Ready',time:'12m ago'},
  {id:2,title:'Repair checkout hydration bug',kind:'Debug',status:'Completed',time:'38m ago'},
  {id:3,title:'Research Next.js caching patterns',kind:'Research',status:'Completed',time:'1h ago'},
];

function slugify(input:string){ return input.toLowerCase().replace(/[^a-z0-9\s-_]/g,'').trim().replace(/\s+/g,'-').slice(0,42)||'hpgk-project'; }

function buildLocalProject(prompt:string): FileItem[] {
  const p = prompt.toLowerCase();
  const title = prompt.trim().replace(/\s+/g,' ').slice(0,52) || 'Premium digital product';
  const isShop = /shop|store|ecommerce|e-commerce|bán hàng|cửa hàng/.test(p);
  const isPortfolio = /portfolio|personal|cá nhân|designer|developer/.test(p);
  const accent = isShop ? '#7c5cff' : isPortfolio ? '#00d6b9' : '#6f8cff';
  const pageTitle = isShop ? 'Nova Commerce' : isPortfolio ? 'KAI — Digital Creator' : 'Astra Studio';
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${pageTitle}</title><style>${previewCss(accent)}</style></head><body><div class="noise"></div><nav><b><span class="logo">✦</span>${pageTitle}</b><div class="links"><a>Work</a><a>About</a><a>Contact</a><button>Launch</button></div></nav><main><div class="eyebrow">AUTONOMOUSLY BUILT · HPGK</div><h1>${escapeHtml(title)}</h1><p>Design, strategy and technology brought together in one focused digital experience.</p><div class="actions"><button>Start exploring</button><button class="secondary">View system</button></div><div class="orb"></div><div class="stats"><div><b>10×</b><span>faster iteration</span></div><div><b>24/7</b><span>autonomous workflow</span></div><div><b>100%</b><span>responsive by design</span></div></div></main></body></html>`;
  return [
    {path:'README.md',content:`# ${pageTitle}\n\nGenerated locally by HPGK Agent — no external AI API required.\n\nMission: ${title}\n`},
    {path:'package.json',content:JSON.stringify({name:slugify(title),private:true,version:'1.0.0',scripts:{dev:'next dev',build:'next build',start:'next start'},dependencies:{next:'latest',react:'latest','react-dom':'latest'}},null,2)},
    {path:'app/page.tsx',content:`export default function Home(){return <main><h1>${escapeHtml(title)}</h1><p>Built by HPGK local engineering engine.</p></main>}`},
    {path:'app/layout.tsx',content:`export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}`},
    {path:'app/globals.css',content:'*{box-sizing:border-box}html,body{margin:0;background:#05070d;color:#fff;font-family:Inter,system-ui,sans-serif}body{min-height:100vh}'},
    {path:'public/preview.html',content:html},
  ];
}
function escapeHtml(s:string){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));}
function previewCss(accent:string){return `*{box-sizing:border-box}body{margin:0;background:#05070d;color:#f6f7fb;font-family:Inter,system-ui,sans-serif;overflow:hidden}.noise{position:fixed;inset:0;opacity:.06;background-image:radial-gradient(#fff 1px,transparent 1px);background-size:5px 5px;pointer-events:none}nav{height:72px;padding:0 7vw;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ffffff12;background:#05070dcc;backdrop-filter:blur(20px)}nav b{display:flex;gap:10px;align-items:center}.logo{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:linear-gradient(135deg,${accent},#a56bff);box-shadow:0 0 30px ${accent}55}.links{display:flex;gap:26px;align-items:center;color:#9299aa;font-size:12px}.links button, .actions button{border:1px solid ${accent}77;background:${accent}22;color:#fff;border-radius:10px;padding:10px 16px}main{position:relative;max-width:980px;margin:auto;padding:110px 7vw}.eyebrow{font-size:10px;letter-spacing:.2em;color:${accent};font-weight:700}h1{font-size:clamp(48px,7vw,92px);line-height:.95;letter-spacing:-.06em;max-width:850px;margin:22px 0}p{max-width:570px;color:#9299aa;font-size:17px;line-height:1.6}.actions{display:flex;gap:12px;margin-top:30px}.actions .secondary{background:#ffffff08;border-color:#ffffff1a}.orb{position:absolute;width:440px;height:440px;border-radius:50%;right:-100px;top:50px;background:radial-gradient(circle at 40% 35%,${accent}88,transparent 35%),conic-gradient(from 180deg,transparent,${accent}66,transparent 45%);filter:blur(1px);opacity:.45;box-shadow:0 0 120px ${accent}33}.stats{display:flex;gap:10px;margin-top:80px}.stats div{padding:14px 20px;border:1px solid #ffffff12;background:#ffffff06;border-radius:12px}.stats b,.stats span{display:block}.stats span{font-size:9px;color:#737b8d;margin-top:4px}`;}

export default function Home(){
  const [active,setActive]=useState<View>('Overview');
  const [prompt,setPrompt]=useState('');
  const [missions,setMissions]=useState<Mission[]>(seedMissions);
  const [running,setRunning]=useState(false);
  const [progress,setProgress]=useState(68);
  const [logs,setLogs]=useState<string[]>(['Booted local orchestration core','Loaded project intelligence','Workspace ready']);
  const [files,setFiles]=useState<FileItem[]>([]);
  const [selectedFile,setSelectedFile]=useState('');
  const [projectName,setProjectName]=useState('');
  const [mobileOpen,setMobileOpen]=useState(false);
  const [toast,setToast]=useState('');
  const [learned,setLearned]=useState<string[]>(['Responsive layout patterns','Next.js project structure','Accessible UI primitives','Premium motion heuristics']);

  useEffect(()=>{
    const saved=localStorage.getItem('hpgk-local-project');
    if(saved){try{const parsed=JSON.parse(saved) as {name:string;files:FileItem[]};setProjectName(parsed.name);setFiles(parsed.files);setSelectedFile(parsed.files[0]?.path??'');}catch{}}
  },[]);

  const selected = useMemo(()=>files.find(f=>f.path===selectedFile)?.content??'', [files,selectedFile]);

  function notify(msg:string){setToast(msg);window.setTimeout(()=>setToast(''),2600);}
  function createProject(){
    const missionPrompt=prompt.trim()||'Build a premium AI product website';
    const next=buildLocalProject(missionPrompt);
    const name=slugify(missionPrompt);
    setFiles(next);setProjectName(name);setSelectedFile(next[0]?.path??'');setActive('Studio');
    localStorage.setItem('hpgk-local-project',JSON.stringify({name,files:next}));
    setLogs(l=>['Project scaffold generated locally',`Planned ${next.length} files`,`Created ${next.length} files without API`,...l].slice(0,8));
    setLearned(l=>[...new Set([`Successful build pattern: ${name}`,...l])].slice(0,6));
    notify('Project created locally — no API key required.');
  }
  function runMission(){
    if(running)return;
    setRunning(true);setActive('Agent');setProgress(12);
    const steps=['Understanding request','Designing architecture','Generating files','Static diagnostics','Self-review','Final verification'];
    let i=0;
    const timer=window.setInterval(()=>{i++;setProgress(Math.min(100,12+i*17));setLogs(l=>[`${steps[Math.min(i,steps.length-1)]} ✓`,...l].slice(0,8));if(i>=6){window.clearInterval(timer);setRunning(false);setProgress(100);setMissions(m=>[{id:Date.now(),title:prompt.trim()||'Build a premium AI product website',kind:'Autonomous build',status:'Completed',time:'just now'},...m]);notify('Mission completed.');}},420);
  }
  function submitPrompt(){if(!prompt.trim())return;runMission();}

  const content = active==='Overview' ? <Overview prompt={prompt} setPrompt={setPrompt} createProject={createProject} runMission={submitPrompt} missions={missions} setActive={setActive}/> :
    active==='Chat' ? <Chat prompt={prompt} setPrompt={setPrompt} onBuild={createProject} onRun={submitPrompt}/> :
    active==='Projects' ? <Projects projectName={projectName} files={files} onBuild={createProject} prompt={prompt} setPrompt={setPrompt}/> :
    active==='Studio' ? <Studio files={files} selectedFile={selectedFile} setSelectedFile={setSelectedFile} selected={selected} onBuild={createProject}/> :
    active==='Preview' ? <Preview files={files}/> :
    active==='Agent' ? <Agent running={running} progress={progress} logs={logs} runMission={submitPrompt}/> :
    active==='Learn' ? <Learn learned={learned} onLearn={()=>{setLearned(l=>[`Research mission completed · ${new Date().toLocaleTimeString()}`,...l].slice(0,8));notify('Local learning record saved.')}}/> :
    active==='Memory' ? <Memory missions={missions} learned={learned}/> :
    active==='Knowledge' ? <Knowledge/> : <Settings/>;

  return <main className="app">
    <div className="ambient a1"/><div className="ambient a2"/>
    <header className="topbar">
      <button className="mobileMenu" onClick={()=>setMobileOpen(v=>!v)}>☰</button>
      <div className="brand"><div className="brandmark">✦</div><b>HPGK</b><span className="version">LOCAL ENGINE</span></div>
      <div className="topsearch">⌕ <span>Search missions, files, knowledge...</span><kbd>⌘ K</kbd></div>
      <div className="topactions"><span className="online"><i/> Local brain online</span><button className="ghost">⌁</button><div className="avatar">GK</div></div>
    </header>
    <div className="layout">
      <aside className={'sidebar '+(mobileOpen?'open':'')}>
        <button className="newproject" onClick={()=>{setActive('Projects');setMobileOpen(false)}}><span>＋</span> New project <kbd>⌘ N</kbd></button>
        <div className="navgroup">WORKSPACE</div>
        {nav.slice(0,6).map(n=><button key={n.id} className={'nav '+(active===n.id?'active':'')} onClick={()=>{setActive(n.id);setMobileOpen(false)}}><span className="icon">{n.icon}</span>{n.label}{n.id==='Agent'&&<span className="liveDot"/>}</button>)}
        <div className="navgroup">INTELLIGENCE</div>
        {nav.slice(6).map(n=><button key={n.id} className={'nav '+(active===n.id?'active':'')} onClick={()=>{setActive(n.id);setMobileOpen(false)}}><span className="icon">{n.icon}</span>{n.label}</button>)}
        <div className="sidebarBottom"><div className="modelCard"><div className="modelOrb">◈</div><div><b>Local Brain</b><small>No API · browser/server safe</small></div><span>●</span></div><button className="nav" onClick={()=>setActive('Settings')}><span className="icon">⚙</span> Settings</button></div>
      </aside>
      <section className="mainpanel">{content}</section>
      <aside className="rightpanel"><AgentMini running={running} progress={progress} logs={logs}/></aside>
    </div>
    <nav className="mobileNav">{nav.slice(0,5).map(n=><button key={n.id} className={active===n.id?'active':''} onClick={()=>setActive(n.id)}><span>{n.icon}</span>{n.label}</button>)}</nav>
    {toast&&<div className="toastGlobal">{toast}</div>}
  </main>
}

function Header({eyebrow,title,sub}:{eyebrow:string;title:string;sub:string}){return <div className="workspaceHead"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{sub}</p></div><div className="headBadge"><i/> No API required</div></div>}
function Overview({prompt,setPrompt,createProject,runMission,missions,setActive}:{prompt:string;setPrompt:(s:string)=>void;createProject:()=>void;runMission:()=>void;missions:Mission[];setActive:(v:View)=>void}){return <>
  <Header eyebrow="AUTONOMOUS ENGINEERING" title="Build something remarkable." sub="A premium local-first workspace for thinking, coding, testing and shipping."/>
  <div className="heroGrid">
    <button className="heroCard primary" onClick={createProject}><div className="cardIcon">✦</div><strong>Create a project</strong><span>Turn an idea into a working codebase locally.</span><em>→</em></button>
    <button className="heroCard" onClick={()=>setActive('Learn')}><div className="cardIcon">◎</div><strong>Teach HPGK</strong><span>Store reusable engineering lessons without a model API.</span><em>→</em></button>
    <button className="heroCard" onClick={()=>setActive('Studio')}><div className="cardIcon">⌘</div><strong>Open Code Studio</strong><span>Inspect files, diagnostics and the live project preview.</span><em>→</em></button>
  </div>
  <div className="composerWrap"><div className="composerTop"><span className="spark">✦</span><input value={prompt} onChange={e=>setPrompt(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')runMission()}} placeholder="Describe what you want to build..."/><button className="send" onClick={runMission}>↑</button></div><div className="composerBottom"><div><button>＋ Attach</button><button>⌁ Tools</button><button>◈ Local Agent</button></div><span>↵ Enter to run</span></div></div>
  <div className="sectionHead"><div><span className="eyebrow">RECENT MISSIONS</span><h2>Continue building</h2></div><button onClick={()=>setActive('Agent')}>Open control center →</button></div>
  <div className="missionList">{missions.slice(0,5).map(t=><div className="mission" key={t.id}><div className="missionIcon">{t.kind==='Research'?'◎':t.kind==='Debug'?'⌘':'✦'}</div><div className="missionText"><b>{t.title}</b><span>{t.kind} · {t.time}</span></div><div className="missionStatus">{t.status}</div><span className="arrow">→</span></div>)}</div>
</>}
function Chat({prompt,setPrompt,onBuild,onRun}:{prompt:string;setPrompt:(s:string)=>void;onBuild:()=>void;onRun:()=>void}){return <><Header eyebrow="LOCAL AI WORKSPACE" title="Think with the engine." sub="No external model API is called. HPGK can plan deterministic engineering workflows locally."/><div className="chatShell"><div className="chatHero"><div className="bigOrb">✦</div><div><span className="eyebrow">LOCAL ORCHESTRATOR</span><h2>What are we building today?</h2><p>Describe a website, component, refactor or learning mission. The local engine turns it into an executable workflow.</p></div></div><div className="promptLarge"><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. Build a premium SaaS dashboard with analytics, billing and responsive mobile UI..."/><div><span>Local execution · No API key</span><button onClick={onRun}>Run mission ↗</button><button className="secondaryBtn" onClick={onBuild}>Build project</button></div></div></div></>}
function Projects({projectName,files,onBuild,prompt,setPrompt}:{projectName:string;files:FileItem[];onBuild:()=>void;prompt:string;setPrompt:(s:string)=>void}){return <><Header eyebrow="PROJECTS" title="Your build space." sub="Projects are generated in-browser and retained locally on this device."/><div className="projectCreator"><div><span className="eyebrow">NEW PROJECT</span><h2>Start from an idea</h2><p>Use the local engineering engine to scaffold a polished Next.js starter with a preview.</p></div><textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe the product..."/><button onClick={onBuild}>Generate project ✦</button></div><div className="projectCard"><div className="projectThumb"><div className="thumbOrb">✦</div></div><div className="projectMeta"><span className="eyebrow">LOCAL WORKSPACE</span><h2>{projectName||'No project yet'}</h2><p>{files.length?`${files.length} files · ready for Studio and Preview`:'Create your first project above.'}</p><div className="chips"><span>Next.js</span><span>React</span><span>No API</span></div></div></div></>}
function Studio({files,selectedFile,setSelectedFile,selected,onBuild}:{files:FileItem[];selectedFile:string;setSelectedFile:(s:string)=>void;selected:string;onBuild:()=>void}){return <><Header eyebrow="CODE STUDIO" title="See the system think." sub="A focused editor surface for the project generated by the local engine."/><div className="studio"><div className="filePane"><div className="paneTitle">EXPLORER <span>{files.length}</span></div>{files.length?files.map(f=><button key={f.path} className={selectedFile===f.path?'file active':''} onClick={()=>setSelectedFile(f.path)}>◫ {f.path}</button>):<div className="empty">No files yet.<button onClick={onBuild}>Create project</button></div>}</div><div className="codePane"><div className="paneTitle"><span>{selectedFile||'No file selected'}</span><span>READONLY PREVIEW</span></div><pre>{selected||'Generate a project to inspect its source.'}</pre></div></div></>}
function Preview({files}:{files:FileItem[]}){const html=files.find(f=>f.path==='public/preview.html')?.content;return <><Header eyebrow="LIVE PREVIEW" title="Ship the visual." sub="Preview the generated experience in an isolated local frame."/><div className="previewFrame">{html?<iframe title="HPGK preview" srcDoc={html}/>:<div className="previewEmpty"><div className="bigOrb">✦</div><h2>No preview yet</h2><p>Create a project first.</p></div>}</div></>}
function Agent({running,progress,logs,runMission}:{running:boolean;progress:number;logs:string[];runMission:()=>void}){return <><Header eyebrow="AGENT CONTROL CENTER" title="Autonomy, visible." sub="Observe the execution loop instead of watching a black box."/><div className="agentDashboard"><div className="agentMain"><div className="agentBigTitle"><div className="agentAvatar big">✦</div><div><h2>HPGK Local Agent</h2><p>{running?'Executing autonomous build mission':'Standing by for your next mission.'}</p></div><span className="statusPill">{running?'RUNNING':'READY'}</span></div><div className="progressBig"><div><span>MISSION PROGRESS</span><b>{progress}%</b></div><div className="progress"><i style={{width:`${progress}%`}}/></div></div><div className="stepsBig">{['Understand','Plan','Generate','Diagnose','Review','Verify'].map((x,i)=><div className={progress>=([17,34,51,68,85,100][i]??100)?'done':progress>=([1,18,35,52,69,86][i]??86)?'current':''} key={x}><span>{progress>=([17,34,51,68,85,100][i]??100)?'✓':'○'}</span><b>{x}</b></div>)}</div><button className="runWide" onClick={runMission}>{running?'Mission running…':'Run autonomous mission'} <span>↗</span></button></div><div className="logPanel"><div className="paneTitle">LIVE TELEMETRY</div>{logs.map((l,i)=><div className="log" key={`${l}-${i}`}><span>●</span>{l}<small>{i*3+1}s</small></div>)}</div></div></>}
function AgentMini({running,progress,logs}:{running:boolean;progress:number;logs:string[]}){return <><div className="panelHead"><span>AGENT ACTIVITY</span><button>•••</button></div><div className="agentCard"><div className="agentTitle"><div className="agentAvatar">✦</div><div><b>HPGK Local Agent</b><small>Plan · Execute · Verify · Learn</small></div><i className="pulse"/></div><div className="progressRow"><span>{running?'Running mission':'Ready for mission'}</span><b>{progress}%</b></div><div className="progress"><i style={{width:`${progress}%`}}/></div><div className="steps">{['Understand request','Design architecture','Generate project','Static diagnostics','Self-review','Final verify'].map((s,i)=><div className={'step '+(progress>=(i+1)*17?'done':progress>=i*17+1?'current':'')} key={s}><span>{progress>=(i+1)*17?'✓':progress>=i*17+1?'•':'○'}</span>{s}<small>{progress>=(i+1)*17?'done':progress>=i*17+1?'running':'queued'}</small></div>)}</div></div><div className="miniTitle">LIVE TELEMETRY</div><div className="metrics"><div><b>{filesMetric(logs)}</b><span>events</span></div><div><b>{running?'00:08':'00:00'}</b><span>runtime</span></div><div><b>{progress}%</b><span>confidence</span></div></div><div className="miniTitle">RECENT EVENTS</div><div className="events">{logs.slice(0,4).map((x,i)=><div key={`${x}-${i}`}><span className={i===0?'green':''}>●</span>{x}<time>{i+1}s</time></div>)}</div></>}
function filesMetric(logs:string[]){return String(Math.max(3,logs.length*2)).padStart(2,'0')}
function Learn({learned,onLearn}:{learned:string[];onLearn:()=>void}){return <><Header eyebrow="CONTINUOUS LEARNING" title="Teach the system." sub="Local learning stores patterns and lessons; it does not pretend to retrain a foundation model."/><div className="learningGrid"><div className="learnHero"><div className="bigOrb">◎</div><span className="eyebrow">LOCAL KNOWLEDGE LOOP</span><h2>Discover → evaluate → remember</h2><p>Run a learning mission to add durable engineering notes to this browser profile.</p><button onClick={onLearn}>Run learning mission ↗</button></div><div className="lessonList">{learned.map((x,i)=><div className="lesson" key={`${x}-${i}`}><span>✓</span><div><b>{x}</b><small>{i===0?'Just now':'Stored lesson'}</small></div></div>)}</div></div></>}
function Memory({missions,learned}:{missions:Mission[];learned:string[]}){return <><Header eyebrow="MEMORY" title="Keep the context." sub="A compact local memory of missions and successful engineering patterns."/><div className="memoryGrid"><div className="memoryCard"><span className="eyebrow">MISSIONS</span><strong>{missions.length}</strong><p>Recent autonomous tasks retained locally.</p></div><div className="memoryCard"><span className="eyebrow">LESSONS</span><strong>{learned.length}</strong><p>Patterns available to the local workflow.</p></div><div className="memoryCard wide"><span className="eyebrow">LATEST</span>{missions.slice(0,4).map(m=><div className="memoryRow" key={m.id}><span>{m.status==='Completed'?'✓':'•'}</span><b>{m.title}</b><small>{m.kind}</small></div>)}</div></div></>}
function Knowledge(){return <><Header eyebrow="KNOWLEDGE" title="Your engineering library." sub="Browse the built-in knowledge packs shipped with HPGK; no API connection is required."/><div className="knowledgeGrid">{['Frontend systems','Animation & motion','Accessibility','Security','Performance','DevOps','AI engineering','Testing','SEO'].map((x,i)=><div className="knowledgeCard" key={x}><div className="knowledgeIcon">{['◈','✦','◎','◇','↗','⌁','◌','✓','⌕'][i]}</div><div><b>{x}</b><p>{12+i*7} verified notes · local</p></div><span>→</span></div>)}</div></>}
function Settings(){return <><Header eyebrow="SETTINGS" title="Built for zero friction." sub="The default HPGK experience is local-first: no external model key, no account setup, no vendor lock-in."/><div className="settingsGrid"><div className="settingCard"><span className="eyebrow">RUNTIME</span><h2>Local Engine</h2><p>Core project generation, memory and mission simulation run without external AI APIs.</p><div className="settingRow"><span>External model API</span><b>OFF</b></div><div className="settingRow"><span>Local persistence</span><b>ON</b></div><div className="settingRow"><span>Telemetry</span><b>LOCAL</b></div></div><div className="settingCard"><span className="eyebrow">DESIGN SYSTEM</span><h2>HPGK Aurora</h2><p>Deep-space surfaces, luminous blue-violet accents, crisp typography and restrained motion.</p><div className="swatches"><i/><i/><i/><i/></div></div></div></>}
