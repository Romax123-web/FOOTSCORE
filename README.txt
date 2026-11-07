FOOTSCORE — SITO WEB RESPONSIVE

Questa cartella contiene il sito web FOOTSCORE, utilizzabile da computer, tablet e smartphone tramite browser. Non è una PWA e non è un'app: non include installazione, manifest o service worker.

ACCESSO
- Modalità ospite, senza registrazione.
- Interfaccia in italiano.
- Layout responsive per desktop e schermi mobili.

DATI
- Senza backend configurato, partite e classifiche di esempio sono DEMO.
- Il pacchetto include un adattatore dati e un proxy Cloudflare Worker, ma non include token, account o un servizio già pubblicato.
- football-data.org Free fornisce dati ritardati, non livescore istantanei.
- Leggere README_DATI_REALI.txt prima di configurare il server.

FILE PRINCIPALI
- index.html: pagine e interfaccia del sito.
- styles.css: stile responsive.
- app.js: schermate e contenuti dimostrativi.
- live.js: collegamento frontend al proxy.
- worker.js: proxy server-side; il token resta in un Worker secret.
- wrangler.toml: configurazione iniziale Wrangler.

PUBBLICAZIONE
Il sito può essere pubblicato su un hosting statico HTTPS (ad esempio GitHub Pages o Cloudflare Pages). Il Worker resta un servizio separato necessario per collegare in modo sicuro il provider dati.

NESSUN TEST DI PRODUZIONE È STATO ESEGUITO. Nessun token è configurato e nessun Worker è stato pubblicato.
