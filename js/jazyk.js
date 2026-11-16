/* ČZU Events – jazyk stránky (čeština / angličtina).
   Jazyk nastaví js/role.js na prvku <html> ještě před vykreslením
   (atributy lang a data-jazyk), volba se ukládá do LocalStorage,
   takže platí na všech stránkách.

   Zdrojem textů je čeština přímo v HTML a ve skriptech. Tento skript
   po načtení přeloží texty stránky podle slovníku a ostatním skriptům
   dává funkci CZUJazyk.t() pro texty, které vznikají až v JavaScriptu.
   Klíčem slovníku je český text, proměnné části se píší jako {nazev}. */

'use strict';

const CZUJazyk = (function () {
  const KLIC_JAZYK = 'czu-events-05.jazyk';
  const KLIC_FOKUS = 'czu-events-05.fokus-jazyk';
  const JAZYKY = ['cs', 'en'];

  const jazyk = document.documentElement.getAttribute('data-jazyk') === 'en' ? 'en' : 'cs';

  /* Formát data a času pro Intl.DateTimeFormat. */
  const locale = jazyk === 'en' ? 'en-GB' : 'cs-CZ';

  const SLOVNIK = {
    'Termín akce': 'Event date',
    'Další možnosti filtrování': 'Other filter options',
    'Volná místa': 'Free places',
    'Akce se uloží pouze v tomto prohlížeči. Ostatní návštěvníci ji neuvidí.':
      'The event is saved only in this browser. Other visitors will not see it.',
    /* ---------- Hlavička, navigace a patička ---------- */
    'Přeskočit na obsah': 'Skip to content',
    'Studentský projekt na PEF ČZU. Nejde o oficiální web univerzity.':
      'Student project at the Faculty of Economics and Management (PEF), CZU Prague. This is not the official university website.',
    'Menu': 'Menu',
    'Hlavní navigace': 'Main navigation',
    'Moje akce': 'My events',
    'Akce': 'Events',
    'Pro pořadatele': 'For organisers',
    'Role': 'Role',
    'Host': 'Guest',
    'Student': 'Student',
    'Pořadatel': 'Organiser',
    'Jazyk': 'Language',
    'O projektu': 'About the project',
    'Školní projekt, skupina č. 5. Akce na webu jsou ukázková data.':
      'School project, group no. 5. The events on this website are sample data.',
    'Drobečková navigace': 'Breadcrumb',
    '‹ Zpět na akce': '‹ Back to events',

    /* ---------- Titulky a popisy stránek ---------- */
    'Akce ČZU – přednášky, workshopy a akce v Suchdole | ČZU Events':
      'CZU events – lectures, workshops and events in Suchdol | ČZU Events',
    'Všechny akce na ČZU na jednom místě: přednášky, workshopy, kariérní a sportovní akce. Najděte akci a přihlaste se.':
      'All events at CZU in one place: lectures, workshops, career and sports events. Find an event and sign up.',
    'Program akcí ČZU – filtrujte podle fakulty a termínu | ČZU Events':
      'CZU events programme – filter by faculty and date | ČZU Events',
    'Přehled a kalendář akcí na ČZU. Filtrujte podle kategorie, fakulty a termínu a zobrazte jen akce s volnými místy.':
      'List and calendar of events at CZU. Filter by category, faculty and date and show only events with free places.',
    'Detail akce | ČZU Events': 'Event detail | ČZU Events',
    'Detail akce na ČZU: termín, místo konání, obsazenost a přihlášení.':
      'Event detail at CZU: date, venue, occupancy and sign-up.',
    'Moje akce | ČZU Events': 'My events | ČZU Events',
    'Přehled akcí na ČZU, na které jste přihlášeni, s možností odhlášení.':
      'Overview of the CZU events you have signed up for, with the option to cancel.',
    'Pro pořadatele | ČZU Events': 'For organisers | ČZU Events',
    'Vytvoření a úprava akce na ČZU a přehled vlastních akcí s počtem přihlášených.':
      'Create and edit an event at CZU and see your own events with the number of participants.',
    'O projektu | ČZU Events': 'About the project | ČZU Events',
    'ČZU Events je školní projekt: portál, kde studenti najdou akce v areálu ČZU na jednom místě a přihlásí se na ně.':
      'ČZU Events is a school project: a portal where students find events on the CZU campus in one place and sign up for them.',
    'Akce nebyla nalezena | ČZU Events': 'Event not found | ČZU Events',

    /* ---------- Úvodní stránka ---------- */
    'Akce ČZU na jednom místě': 'CZU events in one place',
    'Přednášky, workshopy, kariérní, sportovní a spolkové akce v areálu ČZU v Praze-Suchdole. Najděte si akci podle zájmu, fakulty a termínu a přihlaste se.':
      'Lectures, workshops, career, sports and student club events on the CZU campus in Prague-Suchdol. Find an event by interest, faculty and date and sign up.',
    'Hledat akci': 'Search for an event',
    'Hledat akci, například workshop nebo PEF': 'Search for an event, e.g. workshop or PEF',
    'Hledat': 'Search',
    'Kalendář akcí': 'Event calendar',
    'Kategorie akcí': 'Event categories',
    'Nejbližší akce': 'Next event',
    'Další nadcházející akce': 'More upcoming events',
    'Momentálně nejsou žádné nadcházející akce.': 'There are currently no upcoming events.',
    'Nejbližší akci se nepodařilo načíst.': 'The next event could not be loaded.',
    'Zobrazit všechny akce': 'Show all events',

    /* ---------- Kategorie a fakulty ---------- */
    'Přednášky a semináře': 'Lectures and seminars',
    'Workshopy': 'Workshops',
    'Kariéra a veletrhy': 'Careers and fairs',
    'Sport': 'Sport',
    'Kultura a spolky': 'Culture and clubs',
    'Pro uchazeče': 'For applicants',
    'celouniverzitní': 'university-wide',

    /* ---------- Katalog ---------- */
    'Akce na ČZU': 'Events at CZU',
    'Hledat akci…': 'Search for an event…',
    'Rychlé filtry': 'Quick filters',
    'Dnes': 'Today',
    'Tento týden': 'This week',
    'Příští týden': 'Next week',
    'Tento měsíc': 'This month',
    'Jen volná místa': 'Free places only',
    'Moje fakulta': 'My faculty',
    'Vyberte svou fakultu': 'Choose your faculty',
    'Použít': 'Apply',
    'Výběr si zapamatujeme pro příště.': 'We will remember your choice for next time.',
    'Další filtry': 'More filters',
    'Kategorie': 'Category',
    'Všechny kategorie': 'All categories',
    'Fakulta': 'Faculty',
    'Všechny fakulty': 'All faculties',
    'Termín': 'Date',
    'Kdykoli': 'Any time',
    'Vlastní rozsah': 'Custom range',
    'Od': 'From',
    'Do': 'To',
    'Datum „Do“ musí být stejné nebo pozdější než datum „Od“.':
      'The “To” date must be the same as or later than the “From” date.',
    'Zrušit filtry': 'Clear filters',
    'Použité filtry': 'Applied filters',
    'Zobrazení akcí': 'Event view',
    'Seznam': 'List',
    'Kalendář': 'Calendar',
    'Načítám akce…': 'Loading events…',
    'Předchozí měsíc': 'Previous month',
    'Další měsíc': 'Next month',
    'Po': 'Mo',
    'Út': 'Tu',
    'St': 'We',
    'Čt': 'Th',
    'Pá': 'Fr',
    'So': 'Sa',
    'Ne': 'Su',
    'Pondělí': 'Monday',
    'Úterý': 'Tuesday',
    'Středa': 'Wednesday',
    'Čtvrtek': 'Thursday',
    'Pátek': 'Friday',
    'Sobota': 'Saturday',
    'Neděle': 'Sunday',
    'Den s akcí': 'Day with an event',
    'Program měsíce': 'Programme of the month',
    'Program vybraného dne': 'Programme of the selected day',
    'Zobrazit celý měsíc': 'Show the whole month',
    'Zadání neodpovídá žádná akce.': 'No event matches your search.',
    'Upravte rozsah termínu.': 'Adjust the date range.',
    'V tomto měsíci nejsou žádné akce odpovídající filtrům.': 'There are no events matching the filters this month.',
    'Hledání: {text}': 'Search: {text}',
    'Kategorie: {text}': 'Category: {text}',
    'Fakulta: {text}': 'Faculty: {text}',
    'Termín: {text}': 'Date: {text}',
    'Zrušit filtr {text}': 'Remove filter {text}',
    'Vyberte fakultu': 'Choose a faculty',

    /* ---------- Karta akce ---------- */
    'Zobrazit detail': 'View details',
    'Proběhlo': 'Finished',
    'Obsazeno': 'Full',
    'Obsazeno {obsazeno}/{kapacita}': 'Booked {obsazeno}/{kapacita}',
    'Volná místa: {volno} z {kapacita}': 'Free places: {volno} of {kapacita}',
    'Volná místa: {volno}': 'Free places: {volno}',
    'Akce se nepodařilo načíst. Zkuste stránku obnovit. ({chyba})':
      'Events could not be loaded. Please reload the page. ({chyba})',
    'Data akcí se nepodařilo načíst (HTTP {stav}).': 'Event data could not be loaded (HTTP {stav}).',

    /* ---------- Detail akce ---------- */
    'Detail akce': 'Event detail',
    'Kdy:': 'When:',
    'Kde:': 'Where:',
    'Pořádá:': 'Organised by:',
    'O akci': 'About the event',
    'Obsazenost': 'Occupancy',
    'Obsazenost: {obsazeno} z {kapacita} míst': 'Occupancy: {obsazeno} of {kapacita} places',
    'Přihlásit se': 'Sign up',
    'Odhlásit se': 'Cancel sign-up',
    'Akce už proběhla': 'Event has finished',
    'Akce už proběhla.': 'The event has already taken place.',
    'Na tuto akci jste přihlášeni.': 'You are signed up for this event.',
    'Kapacita akce je naplněna.': 'The event is full.',
    'Pro přihlášení přepněte roli na student nebo pořadatel.':
      'To sign up, switch your role to student or organiser.',
    'Přihlásit se může student nebo pořadatel. Přepněte roli v záhlaví.':
      'Only a student or an organiser can sign up. Switch your role in the header.',
    'Akce nebyla nalezena.': 'Event not found.',
    'Akce nebyla nalezena': 'Event not found',
    'Přihlášení se nepodařilo uložit. Prohlížeč nepovolil úložiště.':
      'The sign-up could not be saved. The browser does not allow storage.',
    'Odhlášení proběhlo.': 'Your sign-up has been cancelled.',
    'Přihlášení proběhlo. Akci najdete v Moje akce.': 'You are signed up. You will find the event in My events.',
    'Akci se nepodařilo dokončit.': 'The action could not be completed.',
    'Všechna místa jsou obsazená': 'All places are taken',
    'Zbývá 1 místo': '1 place left',
    'Zbývají {volno} místa': '{volno} places left',
    'Zbývá {volno} míst': '{volno} places left',
    'Přidat do kalendáře': 'Add to calendar',
    'Stáhne soubor ICS pro váš kalendář.': 'Downloads an ICS file for your calendar.',
    'Soubor kalendáře byl připraven ke stažení.': 'The calendar file is ready to download.',
    'Pořádá: {poradatel}': 'Organised by: {poradatel}',
    'Mapa místa konání': 'Venue map',
    'Mapu se nepodařilo načíst. Polohu otevřete odkazem pod mapou.':
      'The map could not be loaded. Open the location using the link below the map.',
    'Přibližná poloha kampusu ČZU. Místo konání: {misto}': 'Approximate location of the CZU campus. Venue: {misto}',
    'Přibližná poloha kampusu ČZU. ': 'Approximate location of the CZU campus. ',
    'Otevřít v OpenStreetMap': 'Open in OpenStreetMap',
    'přispěvatelé OpenStreetMap': 'OpenStreetMap contributors',
    '© přispěvatelé OpenStreetMap': '© OpenStreetMap contributors',
    'Zpět do katalogu akcí': 'Back to the event catalogue',
    'V adrese chybí označení akce.': 'The address does not say which event to show.',
    'Tato akce v katalogu není. Akce vytvořené pořadatelem jsou vidět jen v prohlížeči, ve kterém vznikly.':
      'This event is not in the catalogue. Events created by an organiser are only visible in the browser where they were created.',
    'Akci se nepodařilo načíst. Zkuste stránku obnovit. ({chyba})':
      'The event could not be loaded. Please reload the page. ({chyba})',
    'Aktuální obsazenost se nepodařilo načíst. Zkuste stránku obnovit.':
      'The current occupancy could not be loaded. Please reload the page.',
    'Ilustrace přednášky: řečník u plátna': 'Lecture illustration: a speaker at a projection screen',
    'Ilustrace workshopu: notebook a nářadí': 'Workshop illustration: a laptop and tools',
    'Ilustrace kariérního veletrhu: kufřík a graf': 'Career fair illustration: a briefcase and a chart',
    'Ilustrace sportovní akce: míč a pohár': 'Sports event illustration: a ball and a trophy',
    'Ilustrace kulturní akce: hrací kostka a hudební nota': 'Cultural event illustration: a dice and a musical note',
    'Ilustrace dne otevřených dveří: budova s otevřenými dveřmi': 'Open day illustration: a building with open doors',
    'Pořadatel (ukázková role)': 'Organiser (sample role)',

    /* ---------- Moje akce ---------- */
    'Tato stránka je určená pro role student a pořadatel. Přepněte roli v záhlaví stránky.':
      'This page is for the student and organiser roles. Switch your role in the page header.',
    'Přejít do katalogu akcí': 'Go to the event catalogue',
    'Zatím nejste přihlášeni na žádnou akci.': 'You have not signed up for any event yet.',
    'Najít akci v katalogu': 'Find an event in the catalogue',
    ' z akce {nazev}': ' from the event {nazev}',
    'Odhlášení z akce „{nazev}“ proběhlo.': 'Your sign-up for “{nazev}” has been cancelled.',
    'Odhlášení se nepodařilo uložit.': 'The cancellation could not be saved.',

    /* ---------- Pro pořadatele ---------- */
    'Tato stránka je určená pro roli pořadatel. Přepněte roli v záhlaví stránky.':
      'This page is for the organiser role. Switch your role in the page header.',
    'Nová akce': 'New event',
    'Úprava akce': 'Edit event',
    'Všechna pole jsou povinná.': 'All fields are required.',
    'Název akce': 'Event name',
    'Vyberte kategorii': 'Choose a category',
    'Datum': 'Date',
    'Čas začátku': 'Start time',
    'Místo konání': 'Venue',
    'Například „PEF, EI“.': 'For example “PEF, EI”.',
    'Kapacita': 'Capacity',
    'Popis akce': 'Event description',
    'Co se bude dít, pro koho akce je a co si vzít s sebou.':
      'What will happen, who the event is for and what to bring.',
    'Vytvořit akci': 'Create event',
    'Uložit změny': 'Save changes',
    'Zrušit úpravu': 'Cancel editing',
    'Vaše akce': 'Your events',
    'Zatím jste nevytvořili žádnou akci.': 'You have not created any events yet.',
    'Akce vytvořené pořadatelem a počet přihlášených': 'Events created by the organiser and the number of participants',
    'Název': 'Name',
    'Místo': 'Venue',
    'Přihlášeno': 'Signed up',
    'Úprava': 'Edit',
    'Upravit': 'Edit',
    ' akci {nazev}': ' event {nazev}',
    '{obsazeno} z {kapacita}': '{obsazeno} of {kapacita}',
    'Formulář obsahuje chyby:': 'The form contains errors:',
    'Vyplňte název akce (alespoň 3 znaky).': 'Enter the event name (at least 3 characters).',
    'Vyberte kategorii.': 'Choose a category.',
    'Vyberte fakultu.': 'Choose a faculty.',
    'Vyplňte datum akce.': 'Enter the event date.',
    'Datum akce nesmí být v minulosti.': 'The event date cannot be in the past.',
    'Vyplňte čas začátku.': 'Enter the start time.',
    'Vyplňte místo konání.': 'Enter the venue.',
    'Kapacita musí být celé číslo od 1 do 5000.': 'Capacity must be a whole number from 1 to 5000.',
    'Kapacita nesmí být nižší než počet přihlášených ({pocet}).':
      'Capacity cannot be lower than the number of participants ({pocet}).',
    'Popište akci alespoň jednou větou (10 znaků).': 'Describe the event in at least one sentence (10 characters).',
    'Akci se nepodařilo uložit. Prohlížeč nepovolil úložiště.':
      'The event could not be saved. The browser does not allow storage.',
    'Změny akce „{nazev}“ jsou uložené.': 'Changes to “{nazev}” have been saved.',
    'Akce „{nazev}“ je vytvořená a najdete ji v katalogu.': '“{nazev}” has been created and you will find it in the catalogue.',

    /* ---------- O projektu ---------- */
    'O projektu ČZU Events': 'About the ČZU Events project',
    'ČZU Events je responzivní webový portál, na kterém studenti najdou akce v areálu ČZU na jednom místě, přihlásí se na ně a pořadatelé je mohou snadno zveřejnit.':
      'ČZU Events is a responsive web portal where students find events on the CZU campus in one place and sign up for them, and organisers can easily publish them.',
    'Proč portál vznikl': 'Why the portal was created',
    'Informace o přednáškách, workshopech, kariérních, sportovních a spolkových akcích jsou rozptýlené mezi weby fakult, sociální sítě spolků, e-maily a nástěnky. Student, zvlášť v kombinovaném studiu, tak snadno přehlédne akci, která by ho zajímala.':
      'Information about lectures, workshops, career, sports and club events is scattered across faculty websites, club social media, e-mails and notice boards. A student, especially in part-time study, can easily miss an event they would be interested in.',
    'Co portál umí': 'What the portal can do',
    'Katalog akcí s filtry podle kategorie, fakulty, termínu a volných míst.':
      'An event catalogue with filters by category, faculty, date and free places.',
    'Detail akce s termínem, místem konání, mapou a obsazeností.':
      'Event details with the date, venue, map and occupancy.',
    'Přihlášení a odhlášení na akci s kontrolou kapacity, pro studenta i pořadatele.':
      'Signing up for an event and cancelling with a capacity check, for both students and organisers.',
    'Přehled Moje akce.': 'A My events overview.',
    'Formulář pořadatele pro vytvoření a úpravu akce.': 'An organiser form for creating and editing an event.',
    'Rozhraní a ukázkové akce v češtině i angličtině, zvolený jazyk platí na všech stránkách.':
      'Interface and sample events in Czech and English; the chosen language applies on all pages.',
    'Prototyp a ukázková data': 'Prototype and sample data',
    'Web je prototyp. Akce v katalogu jsou ukázková data a slouží jen k předvedení funkcí. Role host, student a pořadatel se přepínají v záhlaví, skutečné přihlašování uživatelů prototyp nemá. Přihlášení na akce a akce vytvořené pořadatelem se ukládají jen v prohlížeči, ve kterém vznikly.':
      'The website is a prototype. The events in the catalogue are sample data used only to demonstrate the features. The guest, student and organiser roles are switched in the header; the prototype has no real user login. Sign-ups and events created by an organiser are stored only in the browser where they were made.',
    'Použité technologie': 'Technologies used',
    'HTML5, vlastní CSS a JavaScript bez frameworku. Data akcí se načítají přes Fetch API ze souboru JSON, připravený je i skript v PHP se stejným výstupem. Mapu zobrazuje knihovna Leaflet nad mapovými podklady':
      'HTML5, custom CSS and JavaScript without a framework. Event data is loaded with the Fetch API from a JSON file; a PHP script with the same output is also prepared. The map is shown by the Leaflet library on map data from',
    'Kontakt': 'Contact',
    'Projekt vytvořila skupina č. 5 v předmětu Internetové technologie – client side (ETE89E) na Provozně ekonomické fakultě České zemědělské univerzity v Praze, zimní semestr 2026/2027.':
      'The project was created by group no. 5 in the course Internet Technologies – client side (ETE89E) at the Faculty of Economics and Management, Czech University of Life Sciences Prague, winter semester 2026/2027.'
  };

  /* Přeloží český text; proměnné {nazev} doplní z objektu hodnoty.
     Bez překladu (nebo v češtině) vrátí původní text. */
  function t(text, hodnoty) {
    let vysledek = text;
    if (jazyk === 'en' && Object.prototype.hasOwnProperty.call(SLOVNIK, text)) {
      vysledek = SLOVNIK[text];
    }
    if (hodnoty) {
      vysledek = vysledek.replace(/\{(\w+)\}/g, function (celek, nazev) {
        return Object.prototype.hasOwnProperty.call(hodnoty, nazev) ? String(hodnoty[nazev]) : celek;
      });
    }
    return vysledek;
  }

  /* Přeloží text uzlu a zachová mezery kolem něj. */
  function prelozText(puvodni) {
    const jadro = puvodni.replace(/\s+/g, ' ').trim();
    if (jadro === '' || !Object.prototype.hasOwnProperty.call(SLOVNIK, jadro)) {
      return null;
    }
    const zacatek = puvodni.match(/^\s*/)[0];
    const konec = puvodni.match(/\s*$/)[0];
    return zacatek + SLOVNIK[jadro] + konec;
  }

  const ATRIBUTY = ['title', 'aria-label', 'placeholder', 'alt', 'abbr'];

  /* Projde stránku a přeloží texty a popisné atributy.
     Prvky s atributem translate="no" (např. názvy jazyků) se nepřekládají. */
  function prelozStranku(koren) {
    const pruchod = document.createTreeWalker(koren, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (uzel) {
        if (uzel.nodeType === Node.ELEMENT_NODE) {
          if (uzel.getAttribute('translate') === 'no' || uzel.tagName === 'SCRIPT' ||
            uzel.tagName === 'STYLE' || uzel.tagName === 'NOSCRIPT') {
            return NodeFilter.FILTER_REJECT;
          }
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    let uzel = pruchod.currentNode;
    while (uzel) {
      if (uzel.nodeType === Node.TEXT_NODE) {
        const preklad = prelozText(uzel.nodeValue);
        if (preklad !== null) {
          uzel.nodeValue = preklad;
        }
      } else {
        ATRIBUTY.forEach(function (atribut) {
          const hodnota = uzel.getAttribute(atribut);
          if (hodnota && Object.prototype.hasOwnProperty.call(SLOVNIK, hodnota.trim())) {
            uzel.setAttribute(atribut, SLOVNIK[hodnota.trim()]);
          }
        });
      }
      uzel = pruchod.nextNode();
    }
  }

  function prelozHlavicku() {
    document.title = t(document.title.trim());
    const popis = document.querySelector('meta[name="description"]');
    if (popis) {
      popis.setAttribute('content', t(popis.getAttribute('content')));
    }
  }

  /* Stránka v angličtině je skrytá, dokud se nepřeloží (viz CSS),
     aby neproblikl český text. */
  function odkryj() {
    document.documentElement.classList.add('prelozeno');
  }

  /* Přepínač CZ / EN v záhlaví. Po změně se stránka načte znovu
     a fokus se při ovládání klávesnicí vrátí na zvolený jazyk. */
  function nastavPrepinac() {
    const tlacitka = document.querySelectorAll('[data-jazyk-volba]');
    tlacitka.forEach(function (tlacitko) {
      const volba = tlacitko.getAttribute('data-jazyk-volba');
      tlacitko.setAttribute('aria-pressed', String(volba === jazyk));
      tlacitko.addEventListener('click', function () {
        if (volba === jazyk || JAZYKY.indexOf(volba) === -1) {
          return;
        }
        try {
          window.localStorage.setItem(KLIC_JAZYK, volba);
          if (tlacitko.matches(':focus-visible')) {
            window.sessionStorage.setItem(KLIC_FOKUS, '1');
          }
        } catch (chyba) {
          /* Prohlížeč nepovolil úložiště, jazyk nejde zapamatovat. */
          return;
        }
        window.location.reload();
      });
    });

    let vratitFokus = false;
    try {
      vratitFokus = window.sessionStorage.getItem(KLIC_FOKUS) === '1';
      window.sessionStorage.removeItem(KLIC_FOKUS);
    } catch (chyba) {
      vratitFokus = false;
    }
    if (vratitFokus) {
      const zvolene = document.querySelector('[data-jazyk-volba="' + jazyk + '"]');
      if (zvolene) {
        zvolene.focus();
      }
    }
  }

  /* Skript se načítá s atributem defer, takže celé HTML už je k dispozici. */
  if (jazyk === 'en') {
    prelozHlavicku();
    prelozStranku(document.body);
  }
  /* Statický detail akce počká na anglická data akce (odkryje ho js/detail.js). */
  const cekaNaData = jazyk === 'en' && Boolean(document.body.dataset.akceId);
  if (!cekaNaData) {
    odkryj();
  }
  nastavPrepinac();

  return {
    jazyk: jazyk,
    locale: locale,
    t: t,
    odkryj: odkryj
  };
})();
