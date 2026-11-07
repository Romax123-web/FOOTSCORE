const competitions=[
 {name:"Serie A",region:"Italia",icon:"🇮🇹",code:"SA"},
 {name:"Premier League",region:"Inghilterra",icon:"🏴",code:"PL"},
 {name:"La Liga",region:"Spagna",icon:"🇪🇸",code:"LL"},
 {name:"Bundesliga",region:"Germania",icon:"🇩🇪",code:"BL"},
 {name:"Ligue 1",region:"Francia",icon:"🇫🇷",code:"L1"},
 {name:"Champions League",region:"Europa",icon:"🏆",code:"UCL"},
 {name:"Europa League",region:"Europa",icon:"🌍",code:"UEL"},
 {name:"Conference League",region:"Europa",icon:"🌐",code:"UECL"},
 {name:"Mondiali",region:"Internazionale",icon:"🌎",code:"WC"},
 {name:"Europei",region:"Internazionale",icon:"🏆",code:"EURO"},
 {name:"Copa América",region:"Sud America",icon:"🌎",code:"CA"},
 {name:"Coppa d'Africa",region:"Africa",icon:"🌍",code:"AFCON"}
];
const matches=[
 {home:"Inter",away:"Juventus",league:"Serie A",date:"2026-11-08",time:"18:00",status:"In programma",homeForm:"V-V-N-V-P",awayForm:"V-N-V-V-N",hg:1.9,ag:1.4},
 {home:"Milan",away:"Napoli",league:"Serie A",date:"2026-11-08",time:"20:45",status:"In programma",homeForm:"V-V-P-N-V",awayForm:"V-V-V-N-P",hg:1.7,ag:1.8},
 {home:"Arsenal",away:"Chelsea",league:"Premier League",date:"2026-11-08",time:"17:30",status:"In programma",homeForm:"V-V-V-N-V",awayForm:"N-V-P-V-V",hg:2.1,ag:1.5},
 {home:"Real Madrid",away:"Barcelona",league:"La Liga",date:"2026-11-09",time:"21:00",status:"In programma",homeForm:"V-V-V-V-N",awayForm:"V-V-N-V-V",hg:2.2,ag:2.0},
 {home:"Bayern Monaco",away:"Borussia Dortmund",league:"Bundesliga",date:"2026-11-09",time:"18:30",status:"In programma",homeForm:"V-V-V-N-V",awayForm:"V-P-V-V-N",hg:2.5,ag:1.7},
 {home:"PSG",away:"Marsiglia",league:"Ligue 1",date:"2026-11-09",time:"20:45",status:"In programma",homeForm:"V-V-V-V-V",awayForm:"V-N-V-P-V",hg:2.3,ag:1.4}
];
const standings=[["Inter",10,8,1,1,15,25],["Napoli",10,7,2,1,12,23],["Milan",10,7,1,2,10,22],["Juventus",10,6,3,1,9,21],["Roma",10,6,1,3,7,19],["Atalanta",10,5,2,3,6,17],["Lazio",10,5,1,4,3,16],["Fiorentina",10,4,3,3,2,15]];

const $=id=>document.getElementById(id);
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2600)}
// Modalità ospite: nessuna registrazione richiesta e nessun dato personale salvato.
function matchHTML(m){return `<div class="match-row"><div class="team">${m.home}<small>${m.league}</small></div><div class="score">vs</div><div class="team right">${m.away}<small>${m.status}</small></div><div class="match-meta"><b>${new Date(m.date+"T12:00:00").toLocaleDateString("it-IT",{day:"2-digit",month:"short"})} · ${m.time}</b><span>Orario locale</span></div></div>`}
function renderMatches(){ $("featuredMatches").innerHTML=matches.slice(0,4).map(matchHTML).join("");$("allMatches").innerHTML=filterMatches().map(matchHTML).join("")||'<p class="muted">Nessuna partita trovata.</p>'}
function filterMatches(){const q=$("matchSearch").value.toLowerCase(),l=$("leagueFilter").value,d=$("dateFilter").value,today=new Date().toISOString().slice(0,10);return matches.filter(m=>(m.home+" "+m.away).toLowerCase().includes(q)&&(l==="all"||m.league===l)&&(d==="all"||(d==="today"&&m.date===today)||(d==="upcoming"&&m.date>today)))}
function renderCompetitions(){const html=competitions.map(c=>`<div class="competition-card"><div class="competition-icon">${c.icon}</div><div><strong>${c.name}</strong><small>${c.region}</small></div></div>`).join("");$("competitionChips").innerHTML=competitions.slice(0,8).map(c=>`<div class="competition-card"><div class="competition-icon">${c.icon}</div><div><strong>${c.name}</strong><small>${c.region}</small></div></div>`).join("");$("allCompetitions").innerHTML=html}
function renderStandings(){$("standingsBody").innerHTML=standings.map((r,i)=>`<tr><td>${i+1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]>0?"+":""}${r[5]}</td><td><b>${r[6]}</b></td></tr>`).join("")}
function renderAnalysis(){const sel=$("analysisMatch"),m=matches[sel.selectedIndex]||matches[0];const a=m.hg,b=m.ag,total=a+b,p1=Math.round(a/total*100),p2=100-p1;$("analysisResult").innerHTML=`<div class="analysis-teams"><span>${m.home}</span><span>${m.away}</span></div><div class="muted small">Indice offensivo dimostrativo</div><div class="barline"><span style="width:${p1}%"></span><span style="width:${p2}%"></span></div><div class="prob-row"><span>${m.home}: ${p1}/100</span><span>${m.away}: ${p2}/100</span></div><div class="prob-row"><span>Forma ${m.home}</span><b>${m.homeForm}</b></div><div class="prob-row"><span>Forma ${m.away}</span><b>${m.awayForm}</b></div><div class="notice">Valori inventati per mostrare il funzionamento dell'interfaccia. Non sono statistiche reali né probabilità di vittoria.</div>`}
function go(page){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$("page-"+page).classList.add("active");document.querySelectorAll(".nav-link[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===page));const names={dashboard:"Panoramica",matches:"Partite",competitions:"Competizioni",analysis:"Analisi AI",standings:"Classifiche",settings:"Impostazioni"};$("pageTitle").textContent=names[page];$("sidebar").classList.remove("open");window.scrollTo(0,0)}
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.go)));
$("matchSearch").addEventListener("input",renderMatches);$("leagueFilter").addEventListener("change",renderMatches);$("dateFilter").addEventListener("change",renderMatches);
$("analysisMatch").innerHTML=matches.map(m=>`<option>${m.home} — ${m.away}</option>`).join("");$("analysisMatch").addEventListener("change",renderAnalysis);
$("apiInfoBtn").addEventListener("click",()=>$("apiInfo").classList.toggle("hidden"));

$("menuBtn").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("sidebar").id="sidebar";
competitions.forEach(c=>{const o=document.createElement("option");o.value=c.name;o.textContent=c.name;if(matches.some(m=>m.league===c.name))$("leagueFilter").appendChild(o)});
renderMatches();renderCompetitions();renderStandings();renderAnalysis();
$("dateLabel").textContent=new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"}).toUpperCase();
