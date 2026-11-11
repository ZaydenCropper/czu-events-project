/* ČZU Events – detail akce.
   Používá ho šablona detail.html?id=... i statické stránky ve složce akce/.
   Statická stránka má obsah přímo v HTML (kvůli vyhledávačům) a skript
   jen doplní aktuální obsazenost, tlačítko a mapu. */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  const DLAZDICE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATRIBUCE =
    '&copy; <a href="https://www.openstreetmap.org/copyright">přispěvatelé OpenStreetMap</a>';

  const telo = document.body;
  const jeSablona = telo.dataset.sablona === 'ano';
  const idAkce = telo.dataset.akceId || new URLSearchParams(window.location.search).get('id');

  const clanek = document.getElementById('detail');
  const nenalezeno = document.getElementById('nenalezeno');
  const obsazenostText = document.getElementById('akce-obsazenost-text');
  const obsazenostUkazatel = document.getElementById('akce-obsazenost-ukazatel');
  const zbyva = document.getElementById('akce-zbyva');
  const tlacitko = document.getElementById('akce-tlacitko');
  const poznamka = document.getElementById('akce-poznamka');
  const stav = document.getElementById('akce-stav');
  const mapa = document.getElementById('akce-mapa');

  function textZbyva(akce) {
    const volno = Math.max(akce.kapacita - akce.obsazeno, 0);
    if (volno === 0) {
      return 'Všechna místa jsou obsazená';
    }
    if (volno === 1) {
      return 'Zbývá 1 místo';
    }
    if (volno >= 2 && volno <= 4) {
      return 'Zbývají ' + volno + ' místa';
    }
    return 'Zbývá ' + volno + ' míst';
  }

  /* Doplní obsah šablony detail.html z dat akce. */
  function vyplnSablonu(akce) {
    const datum = CZUData.formatDatum(akce.zacatek);
    const cas = CZUData.formatCas(akce.zacatek);

    document.title = akce.nazev + ' – ' + akce.fakulta + ' ČZU, ' + datum;
    const popisStranky = document.querySelector('meta[name="description"]');
    if (popisStranky) {
      popisStranky.setAttribute('content', akce.popis.slice(0, 155));
    }

    document.getElementById('akce-nazev').textContent = akce.nazev;
    document.getElementById('akce-drobecky-kategorie').textContent = akce.kategorie;
    document.getElementById('akce-drobecky-nazev').textContent = akce.nazev;
    document.getElementById('akce-kdy').textContent = datum + ' · ' + cas;
    document.getElementById('akce-kde').textContent = akce.misto;
    document.getElementById('akce-poradatel').textContent = akce.poradatel;
    document.getElementById('akce-popis').textContent = akce.popis;

    const obrazek = document.getElementById('akce-obrazek');
    obrazek.src = CZUData.koren() + akce.obrazek;
    obrazek.alt = akce.alt;
  }

  /* iCalendar používá UTC, CRLF a skládání dlouhých řádků po 75 bajtech. */
  function pripravOsobniKalendar(akce) {
    const text = function (hodnota) {
      return String(hodnota).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n')
        .replace(/;/g, '\\;').replace(/,/g, '\\,');
    };
    const datum = function (hodnota) {
      return new Date(hodnota).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    };
    const radky = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CZU Events//Kalendář akcí//CS',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + encodeURIComponent(akce.id) + '@czu-events',
      'DTSTAMP:' + datum(new Date()),
      'DTSTART:' + datum(akce.zacatek),
      'SUMMARY:' + text(akce.nazev),
      'LOCATION:' + text(akce.misto),
      'DESCRIPTION:' + text(akce.popis + '\nPořádá: ' + akce.poradatel),
      'URL:' + new URL(CZUData.odkazNaDetail(akce), window.location.href).href,
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    const kodovani = new TextEncoder();
    const obsah = radky.map(function (radek) {
      let vysledek = '';
      let delka = 0;
      for (const znak of radek) {
        const bajty = kodovani.encode(znak).length;
        if (delka + bajty > 75) {
          vysledek += '\r\n ';
          delka = 1;
        }
        vysledek += znak;
        delka += bajty;
      }
      return vysledek;
    }).join('\r\n') + '\r\n';
    const soubor = new Blob([obsah], { type: 'text/calendar;charset=utf-8' });
    const odkaz = CZUApp.prvek('a', 'tlacitko', 'Přidat do kalendáře');
    odkaz.href = URL.createObjectURL(soubor);
    odkaz.download = akce.id.replace(/[^a-z0-9-]/gi, '-') + '.ics';
    const radek = CZUApp.prvek('p', 'detail-kalendar');
    radek.appendChild(odkaz);
    document.querySelector('.detail-udaje').insertAdjacentElement('afterend', radek);
  }

  function vykresliObsazenost(akce) {
    obsazenostText.textContent = CZUApp.textObsazenosti(akce);
    obsazenostUkazatel.max = akce.kapacita;
    obsazenostUkazatel.value = Math.min(akce.obsazeno, akce.kapacita);
    obsazenostUkazatel.setAttribute(
      'aria-label',
      'Obsazenost: ' + akce.obsazeno + ' z ' + akce.kapacita + ' míst'
    );
    zbyva.textContent = textZbyva(akce);
  }

  /* Nastaví tlačítko a vysvětlující text podle role a stavu akce. */
  function vykresliTlacitko(akce) {
    const role = CZUData.nactiRoli();
    const prihlasen = CZUData.jePrihlasen(akce.id);
    const plno = akce.obsazeno >= akce.kapacita;

    tlacitko.hidden = false;
    tlacitko.disabled = false;
    tlacitko.dataset.akce = 'prihlasit';
    tlacitko.textContent = 'Přihlásit se';
    poznamka.textContent = '';

    if (CZUData.probehla(akce)) {
      tlacitko.disabled = true;
      tlacitko.textContent = 'Akce už proběhla';
    } else if (role === 'student' && prihlasen) {
      tlacitko.dataset.akce = 'odhlasit';
      tlacitko.textContent = 'Odhlásit se';
      poznamka.textContent = 'Na tuto akci jste přihlášeni.';
    } else if (plno) {
      tlacitko.disabled = true;
      tlacitko.textContent = 'Obsazeno';
      poznamka.textContent = 'Kapacita akce je naplněna.';
    } else if (role === 'host') {
      tlacitko.disabled = true;
      poznamka.textContent = 'Pro přihlášení přepněte roli na student.';
    } else if (role === 'poradatel') {
      tlacitko.disabled = true;
      poznamka.textContent = 'Pořadatel se na akce nepřihlašuje. Přepněte roli na student.';
    }

    poznamka.hidden = poznamka.textContent === '';
  }

  function vykresliStav(akce) {
    vykresliObsazenost(akce);
    vykresliTlacitko(akce);
  }

  const DUVODY = {
    role: 'Přihlásit se může jen student. Přepněte roli v záhlaví.',
    nenalezeno: 'Akce nebyla nalezena.',
    probehla: 'Akce už proběhla.',
    plno: 'Kapacita akce je naplněna.',
    uloziste: 'Přihlášení se nepodařilo uložit. Prohlížeč nepovolil úložiště.'
  };

  async function priKliknuti() {
    const odhlasuje = tlacitko.dataset.akce === 'odhlasit';
    tlacitko.disabled = true;

    const vysledek = odhlasuje ? CZUData.odhlasit(idAkce) : await CZUData.prihlasit(idAkce);
    const akce = await CZUData.najdiAkci(idAkce);

    if (akce === null) {
      CZUApp.zprava(stav, DUVODY.nenalezeno, 'chyba');
      return;
    }
    vykresliStav(akce);

    if (vysledek.ok) {
      CZUApp.zprava(
        stav,
        odhlasuje ? 'Odhlášení proběhlo.' : 'Přihlášení proběhlo. Akci najdete v Moje akce.',
        'ok'
      );
    } else {
      CZUApp.zprava(stav, DUVODY[vysledek.duvod] || 'Akci se nepodařilo dokončit.', 'chyba');
    }
  }

  /* ---------- Mapa (API třetí strany: Leaflet + OpenStreetMap) ---------- */

  function nahradaMapy() {
    mapa.classList.add('mapa-nahrada');
    mapa.textContent = 'Mapu se nepodařilo načíst. Polohu otevřete odkazem pod mapou.';
  }

  function vykresliMapu(akce) {
    if (typeof window.L === 'undefined') {
      nahradaMapy();
      return;
    }
    mapa.textContent = '';
    const poloha = [akce.lat, akce.lng];
    const leafletMapa = window.L.map(mapa, { scrollWheelZoom: false }).setView(poloha, 16);
    const dlazdice = window.L.tileLayer(DLAZDICE, { maxZoom: 19, attribution: ATRIBUCE });
    let dlazdiceNactena = false;
    dlazdice.on('tileload', function () {
      dlazdiceNactena = true;
    });
    dlazdice.once('load', function () {
      if (!dlazdiceNactena) {
        leafletMapa.remove();
        nahradaMapy();
      }
    });
    dlazdice.addTo(leafletMapa);

    const text = akce.presnaPoloha === true
      ? akce.misto
      : 'Přibližná poloha kampusu ČZU. Místo konání: ' + akce.misto;
    const popisek = CZUApp.prvek('span', '', text);
    window.L.circleMarker(poloha, {
      radius: 10,
      color: '#1f4fa3',
      weight: 3,
      fillColor: '#1f4fa3',
      fillOpacity: 0.85
    })
      .addTo(leafletMapa)
      .bindPopup(popisek);
  }

  /* Knihovna Leaflet se načítá až na detailu, ostatní stránky ji nestahují. */
  function nactiMapu(akce) {
    const odkaz = CZUApp.prvek('a', '', 'Otevřít v OpenStreetMap');
    const poloha = new URL('https://www.openstreetmap.org/');
    poloha.search = new URLSearchParams({ mlat: akce.lat, mlon: akce.lng }).toString();
    poloha.hash = 'map=17/' + akce.lat + '/' + akce.lng;
    odkaz.href = poloha.href;
    const popisMapy = CZUApp.prvek(
      'p', 'mapa-popis', akce.presnaPoloha === true ? '' : 'Přibližná poloha kampusu ČZU. '
    );
    popisMapy.appendChild(odkaz);
    mapa.insertAdjacentElement('afterend', popisMapy);

    const styl = document.createElement('link');
    styl.rel = 'stylesheet';
    styl.href = LEAFLET_CSS;
    document.head.appendChild(styl);

    const skript = document.createElement('script');
    skript.src = LEAFLET_JS;
    skript.onload = function () {
      vykresliMapu(akce);
    };
    skript.onerror = nahradaMapy;
    document.head.appendChild(skript);
  }

  /* ---------- Start ---------- */

  /* Stránka má stále jediný nadpis H1: jen se změní jeho text
     a místo obsahu akce se ukáže vysvětlení s odkazem do katalogu. */
  function ukazNenalezeno(text) {
    document.title = 'Akce nebyla nalezena | ČZU Events';
    document.getElementById('akce-nazev').textContent = 'Akce nebyla nalezena';
    document.getElementById('nenalezeno-text').textContent = text;
    document.getElementById('detail-obsah').hidden = true;
    nenalezeno.hidden = false;
    clanek.hidden = false;
    document.body.classList.remove('ma-listu');
  }

  if (!idAkce) {
    ukazNenalezeno('V adrese chybí označení akce.');
    return;
  }

  CZUData.najdiAkci(idAkce)
    .then(function (akce) {
      if (akce === null) {
        ukazNenalezeno(
          'Tato akce v katalogu není. Akce vytvořené pořadatelem jsou vidět jen v prohlížeči, ve kterém vznikly.'
        );
        return;
      }
      if (jeSablona) {
        vyplnSablonu(akce);
      }
      clanek.hidden = false;
      vykresliStav(akce);
      pripravOsobniKalendar(akce);
      tlacitko.addEventListener('click', priKliknuti);
      nactiMapu(akce);
    })
    .catch(function (duvod) {
      if (jeSablona) {
        ukazNenalezeno('Akci se nepodařilo načíst. Zkuste stránku obnovit. (' + duvod.message + ')');
      } else {
        /* Statická stránka zůstane čitelná i bez dat, jen bez přihlášení. */
        CZUApp.zprava(stav, 'Aktuální obsazenost se nepodařilo načíst. Zkuste stránku obnovit.', 'chyba');
        tlacitko.disabled = true;
      }
    });
});
