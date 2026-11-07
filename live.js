/* FOOTSCORE live-data adapter. No provider key is stored in the browser. */
(() => {
  const $ = (id) => document.getElementById(id);
  const COMPETITIONS = [
    ['SA','Serie A','Italia'],['PL','Premier League','Inghilterra'],['PD','La Liga','Spagna'],
    ['BL1','Bundesliga','Germania'],['FL1','Ligue 1','Francia'],['CL','Champions League','Europa'],
    ['DED','Eredivisie','Paesi Bassi'],['PPL','Primeira Liga','Portogallo'],
    ['ELC','Championship','Inghilterra'],['BSA','Serie A Brasile','Brasile'],['WC','Mondiali','Internazionale'],['EC','Europei','Europa']
  ];
  let matches = [];
  let activeCompetition = 'SA';
  let lastUpdated = null;
  let refreshTimer = null;
  const storedBase = localStorage.getItem('footscore_api_base') || '';
  if ($('apiBaseUrl')) $('apiBaseUrl').value = storedBase;

  function baseUrl() { return ($('apiBaseUrl')?.value || storedBase).trim().replace(/\/$/, ''); }
  function status(msg) { if ($('apiConnectionStatus')) $('apiConnectionStatus').textContent = msg; }
  function isoDate(d) { return d.toISOString().slice(0,10); }
  function formatDate(s) { return new Date(s).toLocaleDateString('it-IT',{day:'2-digit',month:'short'}); }
  function compName(code) { return COMPETITIONS.find(c=>c[0]===code)?.[1] || code; }
  function normalize(m, code) {
    const utc = m.utcDate || new Date().toISOString();
    const date = new Date(utc);
    const st = m.status || 'SCHEDULED';
    const statusMap = {IN_PLAY:'IN CORSO · FONTE RITARDATA',LIVE:'IN CORSO · FONTE RITARDATA',PAUSED:'INTERVALLO · FONTE RITARDATA',FINISHED:'TERMINATA',POSTPONED:'RINVIATA',SUSPENDED:'SOSPESA',CANCELLED:'ANNULLATA',SCHEDULED:'IN PROGRAMMA',TIMED:'IN PROGRAMMA'};
    const score = m.score?.fullTime || {};
    const hasScore = score.home != null && score.away != null;
    return {home:m.homeTeam?.shortName || m.homeTeam?.name || 'Casa', away:m.awayTeam?.shortName || m.awayTeam?.name || 'Trasferta', league:compName(code), code, date:isoDate(date), time:date.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Rome'}), status:statusMap[st] || st, rawStatus:st, score:hasScore?`${score.home} - ${score.away}`:'vs', homeGoals:score.home, awayGoals:score.away, played:st==='FINISHED'};
  }
  async function api(path) {
    const base = baseUrl();
    if (!base) throw new Error('Inserisci prima l’indirizzo del servizio FOOTSCORE nelle Impostazioni.');
    const response = await fetch(base + path, {headers:{'Accept':'application/json'}});
    const data = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(data.error || `Errore del servizio (${response.status})`);
    return data;
  }
  function matchCard(m) {
    const score = m.played || m.rawStatus==='IN_PLAY' || m.rawStatus==='PAUSED' ? m.score : 'vs';
    return `<div class="match-row"><div class="team">${m.home}<small>${m.league}</small></div><div class="score">${score}</div><div class="team right">${m.away}<small>${m.status}</small></div><div class="match-meta"><b>${formatDate(m.date)} · ${m.time}</b><span>Ora italiana</span></div></div>`;
  }
  function renderMatches() {
    const q = ($('matchSearch')?.value || '').toLowerCase();
    const league = $('leagueFilter')?.value || 'all';
    const dateFilter = $('dateFilter')?.value || 'all';
    const today = isoDate(new Date());
    const filtered = matches.filter(m => (m.home+' '+m.away).toLowerCase().includes(q) && (league==='all'||m.code===league) && (dateFilter==='all'||(dateFilter==='today'&&m.date===today)||(dateFilter==='upcoming'&&m.date>=today)));
    $('allMatches').innerHTML = filtered.map(matchCard).join('') || '<p class="muted">Nessuna partita trovata per i filtri selezionati.</p>';
    $('featuredMatches').innerHTML = matches.slice(0,4).map(matchCard).join('') || '<p class="muted">Nessuna partita disponibile per questa competizione.</p>';
    if ($('matchesIntro')) $('matchesIntro').textContent = `${matches.length} partite caricate · ${compName(activeCompetition)} · fonte football-data.org · piano gratuito: risultati ritardati, non LIVE.`;
  }
  function fillCompetitionSelects() {
    const options = COMPETITIONS.map(c=>`<option value="${c[0]}">${c[1]}</option>`).join('');
    const matchSelect = $('leagueFilter');
    if (matchSelect) matchSelect.innerHTML = COMPETITIONS.map(c=>`<option value="${c[0]}">${c[1]}</option>`).join('');
    const standingsSelect = $('standingsCompetition');
    if (standingsSelect) standingsSelect.innerHTML = options;
    if (matchSelect) matchSelect.value = activeCompetition;
    const analysisSelect = $('analysisMatch');
    if (analysisSelect) analysisSelect.innerHTML = '<option value="">Carica le partite per vedere l’analisi</option>';
  }
  function updateAnalysis() {
    const select = $('analysisMatch');
    const m = matches[Number(select?.value)];
    if (!m) { $('analysisResult').innerHTML = '<p class="muted">Carica una competizione con partite concluse per calcolare la forma recente delle squadre.</p>'; return; }
    const recentFor = (team) => matches.filter(x=>x.played&&(x.home===team||x.away===team)).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5);
    const stats = (team) => {
      const games = recentFor(team); let w=0,d=0,l=0,gf=0,ga=0;
      games.forEach(x=>{const home=x.home===team, f=home?x.homeGoals:x.awayGoals, a=home?x.awayGoals:x.homeGoals; if(f==null||a==null)return; gf+=f;ga+=a;if(f>a)w++;else if(f===a)d++;else l++;});
      return {games:games.length,w,d,l,gf,ga,form:games.map(x=>{const home=x.home===team;const f=home?x.homeGoals:x.awayGoals;const a=home?x.awayGoals:x.homeGoals;return f>a?'V':f===a?'N':'P'}).join(' · ')||'Dati insufficienti'};
    };
    const a=stats(m.home), b=stats(m.away);
    $('analysisResult').innerHTML = `<div class="analysis-teams"><span>${m.home}</span><span>${m.away}</span></div><div class="prob-row"><span>Ultime ${a.games} gare · ${m.home}</span><b>${a.form}</b></div><div class="prob-row"><span>Vittorie / pareggi / sconfitte</span><b>${a.w} / ${a.d} / ${a.l}</b></div><div class="prob-row"><span>Gol fatti / subiti</span><b>${a.gf} / ${a.ga}</b></div><hr><div class="prob-row"><span>Ultime ${b.games} gare · ${m.away}</span><b>${b.form}</b></div><div class="prob-row"><span>Vittorie / pareggi / sconfitte</span><b>${b.w} / ${b.d} / ${b.l}</b></div><div class="prob-row"><span>Gol fatti / subiti</span><b>${b.gf} / ${b.ga}</b></div><p class="notice">Statistiche descrittive calcolate dai risultati restituiti dalla fonte. Non sono probabilità, pronostici o garanzie. Il piano gratuito può fornire punteggi ritardati e dati incompleti.</p>`;
  }
  async function loadMatches() {
    try {
      status('Caricamento partite…');
      const from = new Date(); from.setDate(from.getDate()-45);
      const to = new Date(); to.setDate(to.getDate()+14);
      const data = await api(`/api/matches?competition=${encodeURIComponent(activeCompetition)}&dateFrom=${isoDate(from)}&dateTo=${isoDate(to)}`);
      matches = (data.matches || []).map(m=>normalize(m,activeCompetition)).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
      lastUpdated = new Date();
      renderMatches();
      const badge=$('dataBadge'); if(badge) badge.innerHTML='<i></i> DATI COLLEGATI · RITARDATI';
      status(`Connessione riuscita. ${matches.length} partite caricate. Dati ritardati: il piano gratuito non fornisce livescore istantanei.`);
      if ($('analysisMatch')) {
        $('analysisMatch').innerHTML = matches.map((m,i)=>`<option value="${i}">${m.home} — ${m.away} (${formatDate(m.date)})</option>`).join('') || '<option value="">Nessuna partita</option>';
        
      }
      updateAnalysis();
      const small=$('dateLabel'); if(small) { small.title='Ora dell’ultima richiesta alla fonte. I punteggi del piano gratuito possono essere ritardati.'; small.textContent='ULTIMO CONTROLLO · '+lastUpdated.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'}); }
    } catch (e) { status(e.message); }
  }
  async function loadStandings() {
    const code=$('standingsCompetition')?.value || 'SA';
    try {
      status(`Caricamento classifica ${compName(code)}…`);
      const data=await api(`/api/standings?competition=${encodeURIComponent(code)}`);
      const table=(data.standings||[]).find(x=>x.type==='TOTAL')?.table || data.standings?.[0]?.table || [];
      $('standingsBody').innerHTML=table.map(r=>`<tr><td>${r.position}</td><td>${r.team?.shortName||r.team?.name||'—'}</td><td>${r.playedGames??'—'}</td><td>${r.won??'—'}</td><td>${r.draw??'—'}</td><td>${r.lost??'—'}</td><td>${r.goalDifference>0?'+':''}${r.goalDifference??'—'}</td><td><b>${r.points??'—'}</b></td></tr>`).join('') || '<tr><td colspan="8">Classifica non disponibile per questa competizione.</td></tr>';
      $('standingsTitle').textContent=compName(code);
      $('standingsBadge').textContent='FONTE COLLEGATA';
      $('standingsIntro').textContent='Classifica restituita dalla fonte dati. Il piano gratuito può avere ritardi.';
      status(`Classifica ${compName(code)} aggiornata.`);
    } catch(e) { status(e.message); $('standingsBadge').textContent='NON DISPONIBILE'; }
  }
  async function testConnection() {
    try { const d=await api('/api/health'); status(d.provider==='football-data.org'?'Servizio raggiungibile. Ora puoi caricare le partite.':'Servizio raggiungibile.'); await loadMatches(); }
    catch(e) { status(e.message); }
  }
  function startAutoRefresh() {
    clearInterval(refreshTimer);
    refreshTimer=setInterval(()=>{ if(document.visibilityState==='visible') loadMatches(); },10*60*1000);
    document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') loadMatches(); });
  }
  fillCompetitionSelects();
  $('matchSearch')?.addEventListener('input',renderMatches);
  $('leagueFilter')?.addEventListener('change',()=>{activeCompetition=$('leagueFilter').value;loadMatches();});
  $('dateFilter')?.addEventListener('change',renderMatches);
  $('standingsCompetition')?.addEventListener('change',loadStandings);
  $('refreshStandings')?.addEventListener('click',loadStandings);
  $('saveApiUrl')?.addEventListener('click',()=>{const v=baseUrl();if(!/^https:\/\//i.test(v)){status('Inserisci un indirizzo HTTPS valido del servizio Worker.');return;}localStorage.setItem('footscore_api_base',v);status('Indirizzo salvato su questo dispositivo.');});
  $('testApi')?.addEventListener('click',testConnection);
  $('analysisMatch')?.addEventListener('change',updateAnalysis);
  // Initial UI stays clearly marked as demo until a real data source is connected.
  if (storedBase) testConnection();
  startAutoRefresh();
})();
