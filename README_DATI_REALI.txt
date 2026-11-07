FOOTSCORE — COLLEGAMENTO DATI CALCISTICI (PACCHETTO DI SVILUPPO)
Aggiornamento documentazione: 7 novembre 2026

STATO REALE DEL PACCHETTO
- La sito web contiene un adattatore frontend (live.js) per partite e classifiche.
- È incluso un proxy Cloudflare Worker (worker.js) che mantiene il token sul server.
- È incluso wrangler.toml per avviare la configurazione del Worker.
- Il token non è incluso nel pacchetto.
- Il Worker non è stato pubblicato né testato su un account reale.
- Nessuna fonte LIVE è attualmente collegata: finché non viene configurato e verificato il server, l'app resta in modalità dimostrativa.

FONTE PRIMARIA: football-data.org
Pagina ufficiale prezzi: https://www.football-data.org/pricing
Copertura ufficiale: https://www.football-data.org/coverage
Documentazione API: https://www.football-data.org/documentation/api

Piano Free (verificato il 7 novembre 2026):
- 0 euro al mese.
- 12 competizioni: Champions League, Primeira Liga, Premier League, Eredivisie, Bundesliga, Ligue 1, Serie A, La Liga, Championship, Serie A Brasile, Mondiali ed Europei.
- Partite, calendari e classifiche di base.
- Punteggi e calendari ritardati: NON è un piano livescore istantaneo.
- 10 richieste API al minuto.
- Il piano “Free w/ Livescores” è indicato a 12 euro/mese: non è gratuito.
- Le statistiche avanzate (possesso, tiri, corner ecc.) non vanno date per disponibili nel piano Free.

ALTERNATIVA GRATUITA DA VALUTARE: API-FOOTBALL
Pagina prezzi: https://www.api-football.com/pricing
Documentazione: https://www.api-football.com/documentation-v3
- Il piano gratuito pubblicato indica 100 richieste al giorno.
- Include un endpoint Livescore e vari endpoint statistici, ma la disponibilità dei dati varia per competizione e stagione.
- La documentazione indica che l'endpoint viene aggiornato ogni 15 secondi, ma questo NON significa che il piano gratuito consenta interrogazioni continue: 100 richieste/giorno sono insufficienti per un monitoraggio globale continuo.
- Non è stato integrato in questo pacchetto; richiederebbe un adattatore server separato.

SERVIZIO SERVER SCELTO: CLOUDFLARE WORKERS
Limiti ufficiali: https://developers.cloudflare.com/workers/platform/limits/
Secrets: https://developers.cloudflare.com/workers/configuration/secrets/
- Il piano Workers Free indica 100.000 richieste al giorno.
- Il token provider va memorizzato come secret del Worker, mai nell'app, nel repository o nel browser.
- CORS è limitato all'origine HTTPS esatta della sito web tramite FOOTSCORE_ORIGIN. CORS non sostituisce un sistema anti-abuso: un endpoint pubblico può comunque essere chiamato da client non-browser.
- La cache del proxy dura 10 minuti per ridurre le chiamate duplicate al provider.

PASSAGGIO TECNICO SUCCESSIVO (DA ESEGUIRE CON ACCOUNT DEL PROPRIETARIO)
1. Con un genitore/tutore, verificare i requisiti di età e i termini dei servizi, quindi creare gli account necessari.
2. Registrare il progetto presso football-data.org e ottenere il token gratuito.
3. Installare Node.js e Wrangler su un computer di sviluppo; dalla cartella che contiene wrangler.toml eseguire:
   npm install -g wrangler
   wrangler login
4. Pubblicare prima la cartella footscore su un hosting HTTPS e annotare l'origine del sito (solo schema + dominio, senza percorso). Ad esempio, se la sito web è https://nomeutente.github.io/footscore/, l'origine da usare è https://nomeutente.github.io.
5. Dalla cartella che contiene wrangler.toml, configurare il token come secret (il comando chiederà il valore senza inserirlo nei file):
   wrangler secret put FOOTBALL_DATA_TOKEN
6. Configurare l'origine HTTPS esatta della sito web come secret:
   wrangler secret put FOOTSCORE_ORIGIN
   Inserire solo l'origine, senza percorso e senza slash finale.
7. Pubblicare il Worker:
   wrangler deploy
8. Copiare l'URL HTTPS generato dal Worker. Aprire la sito web > Impostazioni, inserire l'URL del Worker, salvare e premere “Verifica connessione”.
9. Verificare /api/health e il caricamento delle partite. Solo dopo test riusciti si potrà indicare “DATI COLLEGATI”.

NOTA IMPORTANTE SULL'ORIGINE
FOOTSCORE_ORIGIN deve corrispondere esattamente all'origine HTTPS che ospita la sito web, ad esempio https://nomeutente.github.io. Se si usa un dominio personalizzato, impostare quel dominio. Il worker rifiuta richieste con origine diversa e non accetta una configurazione vuota.

COMPORTAMENTO DELL'APP
- Le partite vengono richieste per una competizione alla volta.
- Finestra calendario: 45 giorni precedenti e 14 successivi (59 giorni complessivi).
- Aggiornamento ogni 10 minuti mentre la sito web è aperta e quando torna visibile.
- Le classifiche si caricano quando vengono selezionate o aggiornate manualmente.
- Le statistiche sono descrittive e calcolate dai risultati conclusi disponibili; non sono pronostici.
- Il timestamp in alto indica l'ora dell'ultima richiesta, non certifica che il dato del provider sia in tempo reale.
- Quando l'app è chiusa non viene eseguito polling dal dispositivo.

SICUREZZA E LIMITI
- Non incollare mai il token API nelle Impostazioni della sito web.
- Non commettere token in Git o inserirli in app.js, live.js, index.html o manifest.
- L'URL pubblico del Worker non è un segreto. Il proxy usa allowlist delle competizioni, intervallo date limitato, CORS per l'origine prevista e cache; prima di un utilizzo pubblico esteso serviranno anche protezioni anti-abuso lato Cloudflare.
- Un piano gratuito non garantisce copertura di tutti i campionati, statistiche avanzate o aggiornamenti istantanei.

DISTINZIONE DATI
- DEMO: esempi locali presenti in app.js prima del collegamento.
- DATI COLLEGATI · RITARDATI: risposte ricevute dal piano gratuito football-data.org.
- LIVE: etichetta da NON usare con il piano gratuito football-data.org.
