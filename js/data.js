/* ČZU Events – datová vrstva.
   Všechny ostatní skripty čtou a ukládají data jen přes objekt CZUData.
   Ukázkové akce se načítají přes Fetch API (AJAX), stav prohlížeče
   (role, přihlášení, akce pořadatele) je v LocalStorage. */

'use strict';

const CZUData = (function () {
  /* Příprava na PHP: stačí změnit tuto jednu konstantu na 'api/akce.php'.
     Skript api/akce.php čte stejný soubor data/akce.json a vrací stejná data. */
  const ZDROJ_DAT = 'data/akce.json';

  /* Na serveru KitLab sdílí všechny skupiny jednu doménu,
     proto mají naše klíče v LocalStorage vlastní předponu. */
  const PREDPONA = 'czu-events-05.';
  const KLIC_ROLE = PREDPONA + 'role';
  const KLIC_PRIHLASENI = PREDPONA + 'prihlaseni';
  const KLIC_AKCE = PREDPONA + 'akce-poradatele';

  const ROLE = ['host', 'student', 'poradatel'];

  const KATEGORIE = [
    'Přednášky a semináře',
    'Workshopy',
    'Kariéra a veletrhy',
    'Sport',
    'Kultura a spolky',
    'Pro uchazeče'
  ];

  const FAKULTY = ['PEF', 'FAPPZ', 'FŽP', 'FLD', 'FTZ', 'TF', 'celouniverzitní'];

  const OBRAZKY = {
    'Přednášky a semináře': { obrazek: 'img/prednasky.svg', alt: 'Ilustrace přednášky: řečník u plátna' },
    'Workshopy': { obrazek: 'img/workshopy.svg', alt: 'Ilustrace workshopu: notebook a nářadí' },
    'Kariéra a veletrhy': { obrazek: 'img/kariera.svg', alt: 'Ilustrace kariérního veletrhu: kufřík a graf' },
    'Sport': { obrazek: 'img/sport.svg', alt: 'Ilustrace sportovní akce: míč a pohár' },
    'Kultura a spolky': { obrazek: 'img/kultura.svg', alt: 'Ilustrace kulturní akce: hrací kostka a hudební nota' },
    'Pro uchazeče': { obrazek: 'img/uchazeci.svg', alt: 'Ilustrace dne otevřených dveří: budova s otevřenými dveřmi' }
  };

  /* Přibližná poloha areálu ČZU v Praze-Suchdole. */
  const VYCHOZI_POLOHA = { lat: 50.1300, lng: 14.3740 };

  const CASOVE_PASMO = 'Europe/Prague';

  let mezipamet = null;

  /* ---------- Pomocné funkce ---------- */

  /* Cesta ke kořeni webu: "" v kořeni, "../" ve složce akce/.
     Fetch počítá relativní adresu od adresy stránky, ne od skriptu. */
  function koren() {
    return document.body.dataset.koren || '';
  }

  function ctiUloziste(klic, vychozi) {
    try {
      const text = window.localStorage.getItem(klic);
      if (text === null) {
        return vychozi;
      }
      return JSON.parse(text);
    } catch (chyba) {
      return vychozi;
    }
  }

  function zapisUloziste(klic, hodnota) {
    try {
      window.localStorage.setItem(klic, JSON.stringify(hodnota));
      return true;
    } catch (chyba) {
      return false;
    }
  }

  function castiData(datum) {
    const formatovac = new Intl.DateTimeFormat('en-GB', {
      timeZone: CASOVE_PASMO,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    const casti = {};
    formatovac.formatToParts(datum).forEach(function (cast) {
      casti[cast.type] = cast.value;
    });
    return casti;
  }

  /* Den akce v Praze jako text RRRR-MM-DD, vhodný k porovnávání. */
  function denAkce(zacatek) {
    const casti = castiData(new Date(zacatek));
    return casti.year + '-' + casti.month + '-' + casti.day;
  }

  function dnes() {
    return denAkce(new Date().toISOString());
  }

  function probehla(akce) {
    return denAkce(akce.zacatek) < dnes();
  }

  function formatDatum(zacatek) {
    const casti = castiData(new Date(zacatek));
    return Number(casti.day) + '. ' + Number(casti.month) + '. ' + casti.year;
  }

  function formatCas(zacatek) {
    const casti = castiData(new Date(zacatek));
    return Number(casti.hour) + ':' + casti.minute;
  }

  /* Rozloží začátek na hodnoty pro pole formuláře. */
  function rozlozZacatek(zacatek) {
    const casti = castiData(new Date(zacatek));
    return {
      datum: casti.year + '-' + casti.month + '-' + casti.day,
      cas: casti.hour + ':' + casti.minute
    };
  }

  /* Složí začátek ve tvaru ISO 8601 s časovým posunem Prahy,
     např. 2026-11-20T14:00:00+01:00. */
  function slozZacatek(datum, cas) {
    const d = datum.split('-').map(Number);
    const c = cas.split(':').map(Number);
    const jakoUtc = Date.UTC(d[0], d[1] - 1, d[2], c[0], c[1]);
    const casti = castiData(new Date(jakoUtc));
    const vPraze = Date.UTC(
      Number(casti.year),
      Number(casti.month) - 1,
      Number(casti.day),
      Number(casti.hour),
      Number(casti.minute)
    );
    const posun = Math.round((vPraze - jakoUtc) / 60000);
    const znamenko = posun < 0 ? '-' : '+';
    const hodiny = String(Math.floor(Math.abs(posun) / 60)).padStart(2, '0');
    const minuty = String(Math.abs(posun) % 60).padStart(2, '0');
    return datum + 'T' + cas + ':00' + znamenko + hodiny + ':' + minuty;
  }

  /* ---------- Role ---------- */

  function nactiRoli() {
    let role = 'host';
    try {
      role = window.localStorage.getItem(KLIC_ROLE) || 'host';
    } catch (chyba) {
      role = 'host';
    }
    return ROLE.indexOf(role) === -1 ? 'host' : role;
  }

  function ulozRoli(role) {
    const nova = ROLE.indexOf(role) === -1 ? 'host' : role;
    try {
      window.localStorage.setItem(KLIC_ROLE, nova);
    } catch (chyba) {
      return false;
    }
    document.documentElement.setAttribute('data-role', nova);
    return true;
  }

  /* ---------- Akce ---------- */

  async function nactiUkazkoveAkce() {
    if (mezipamet !== null) {
      return mezipamet;
    }
    const odpoved = await fetch(koren() + ZDROJ_DAT, {
      headers: { Accept: 'application/json' }
    });
    if (!odpoved.ok) {
      throw new Error('Data akcí se nepodařilo načíst (HTTP ' + odpoved.status + ').');
    }
    mezipamet = await odpoved.json();
    return mezipamet;
  }

  /* Vrátí všechny akce: ukázkové z JSON i vytvořené pořadatelem.
     Pole "obsazeno" už obsahuje přihlášení uložené v tomto prohlížeči. */
  async function nactiAkce() {
    const ukazkove = await nactiUkazkoveAkce();
    const vlastni = ctiUloziste(KLIC_AKCE, []);
    const prihlaseni = ctiUloziste(KLIC_PRIHLASENI, []);

    const vsechny = ukazkove
      .map(function (akce) {
        return Object.assign({}, akce, { vlastni: false });
      })
      .concat(
        vlastni.map(function (akce) {
          return Object.assign({}, akce, { vlastni: true });
        })
      );

    return vsechny
      .map(function (akce) {
        const navic = prihlaseni.indexOf(akce.id) === -1 ? 0 : 1;
        return Object.assign({}, akce, { obsazeno: akce.obsazeno + navic });
      })
      .sort(function (a, b) {
        return new Date(a.zacatek) - new Date(b.zacatek);
      });
  }

  async function najdiAkci(id) {
    const akce = await nactiAkce();
    const nalezena = akce.find(function (polozka) {
      return polozka.id === id;
    });
    return nalezena || null;
  }

  function odkazNaDetail(akce) {
    if (akce.stranka) {
      return koren() + akce.stranka;
    }
    return koren() + 'detail.html?id=' + encodeURIComponent(akce.id);
  }

  /* ---------- Přihlášení studenta ---------- */

  function jePrihlasen(id) {
    return ctiUloziste(KLIC_PRIHLASENI, []).indexOf(id) !== -1;
  }

  /* Vrací { ok: true } nebo { ok: false, duvod: '...' }.
     Důvody: role, nenalezeno, probehla, plno, uloziste. */
  async function prihlasit(id) {
    if (nactiRoli() !== 'student') {
      return { ok: false, duvod: 'role' };
    }
    if (jePrihlasen(id)) {
      return { ok: true };
    }
    const akce = await najdiAkci(id);
    if (akce === null) {
      return { ok: false, duvod: 'nenalezeno' };
    }
    if (probehla(akce)) {
      return { ok: false, duvod: 'probehla' };
    }
    if (akce.obsazeno >= akce.kapacita) {
      return { ok: false, duvod: 'plno' };
    }
    const prihlaseni = ctiUloziste(KLIC_PRIHLASENI, []);
    prihlaseni.push(id);
    if (!zapisUloziste(KLIC_PRIHLASENI, prihlaseni)) {
      return { ok: false, duvod: 'uloziste' };
    }
    return { ok: true };
  }

  function odhlasit(id) {
    const prihlaseni = ctiUloziste(KLIC_PRIHLASENI, []).filter(function (polozka) {
      return polozka !== id;
    });
    if (!zapisUloziste(KLIC_PRIHLASENI, prihlaseni)) {
      return { ok: false, duvod: 'uloziste' };
    }
    return { ok: true };
  }

  async function nactiMojeAkce() {
    const akce = await nactiAkce();
    return akce.filter(function (polozka) {
      return jePrihlasen(polozka.id);
    });
  }

  /* ---------- Akce pořadatele ---------- */

  function nactiAkcePoradatele() {
    return ctiUloziste(KLIC_AKCE, []);
  }

  /* Uloží novou akci (bez id) nebo upraví existující (s id).
     Vrací uložený záznam, při chybě úložiště null. */
  function ulozAkci(akce) {
    const vlastni = nactiAkcePoradatele();
    const obrazek = OBRAZKY[akce.kategorie] || OBRAZKY['Přednášky a semináře'];
    const zaznam = {
      id: akce.id || 'p-' + Date.now(),
      nazev: akce.nazev,
      kategorie: akce.kategorie,
      fakulta: akce.fakulta,
      zacatek: akce.zacatek,
      misto: akce.misto,
      lat: VYCHOZI_POLOHA.lat,
      lng: VYCHOZI_POLOHA.lng,
      kapacita: akce.kapacita,
      obsazeno: 0,
      popis: akce.popis,
      poradatel: 'Pořadatel (ukázková role)',
      obrazek: obrazek.obrazek,
      alt: obrazek.alt
    };

    const index = vlastni.findIndex(function (polozka) {
      return polozka.id === zaznam.id;
    });
    if (index === -1) {
      vlastni.push(zaznam);
    } else {
      vlastni[index] = zaznam;
    }

    if (!zapisUloziste(KLIC_AKCE, vlastni)) {
      return null;
    }
    return zaznam;
  }

  return {
    KATEGORIE: KATEGORIE,
    FAKULTY: FAKULTY,
    koren: koren,
    dnes: dnes,
    denAkce: denAkce,
    probehla: probehla,
    formatDatum: formatDatum,
    formatCas: formatCas,
    rozlozZacatek: rozlozZacatek,
    slozZacatek: slozZacatek,
    nactiRoli: nactiRoli,
    ulozRoli: ulozRoli,
    nactiAkce: nactiAkce,
    najdiAkci: najdiAkci,
    odkazNaDetail: odkazNaDetail,
    jePrihlasen: jePrihlasen,
    prihlasit: prihlasit,
    odhlasit: odhlasit,
    nactiMojeAkce: nactiMojeAkce,
    nactiAkcePoradatele: nactiAkcePoradatele,
    ulozAkci: ulozAkci
  };
})();
