-- =====================================================================
--  SEZIONE FAQ IN HOME
--
--  La riga 'home' di site_pages guadagna la chiave "faq": kicker, titolo,
--  sottotitolo e un array "items" di { question, answer } gestito da
--  /admin/contenuti/home. Nessuna modifica di schema: come per "about"
--  (vedi 20260823000000_theme_and_home_about.sql) la forma del jsonb è
--  definita lato applicazione (burrumballa-web/src/lib/cms/types.ts).
--
--  Il seed serve solo a partire con delle domande vere invece che con la
--  sezione vuota: la home nasconde la sezione quando "items" è vuoto, e i
--  default applicativi (cms/defaults.ts) coprono comunque il caso in cui
--  la chiave manchi. Per questo l'update è idempotente e non tocca una
--  riga che ha già le sue FAQ.
-- =====================================================================

update public.site_pages
set content = content || '{
  "faq": {
    "kicker": "domande & risposte",
    "title": "Le cose che ci chiedete sempre",
    "subtitle": "Quello che ci chiedono tutti prima di mettere piede in sala. Se non trovi la tua risposta, scrivici su Instagram: rispondiamo noi, non un bot.",
    "items": [
      {
        "question": "Devo saper ballare per iniziare?",
        "answer": "No. I corsi partono dalle fondamenta: nel livello base si comincia da zero, con calma e senza sentirsi fuori posto. Se hai già ballato ti mettiamo nel livello giusto dopo la prima lezione."
      },
      {
        "question": "Come funziona la lezione di prova?",
        "answer": "La prima lezione è gratuita. Scrivici su Instagram o passa al Circolo dicendoci quale corso ti interessa: ti confermiamo giorno e orario e ti aspettiamo in sala."
      },
      {
        "question": "Cosa devo portare la prima volta?",
        "answer": "Abbigliamento comodo, un paio di scarpe da tenere solo per la sala e una bottiglia d''acqua. Nient''altro: il resto lo trovi qui."
      },
      {
        "question": "Serve la tessera ARCI?",
        "answer": "Sì, è obbligatoria: le lezioni sono dentro il Circolo La Fattoria. Si fa in sede in cinque minuti e vale per tutta la stagione, anche per gli eventi."
      },
      {
        "question": "Da che età si può ballare con voi?",
        "answer": "Dai corsi kids agli adulti. Le classi sono divise per età e livello, quindi c''è spazio sia per i più piccoli che per chi decide di cominciare a trent''anni."
      },
      {
        "question": "Posso iscrivermi a stagione già iniziata?",
        "answer": "Sì. Le iscrizioni restano aperte tutto l''anno: se nel corso che ti interessa c''è ancora posto puoi entrare in qualsiasi momento."
      }
    ]
  }
}'::jsonb
where id = 'home'
  and not (content ? 'faq');
