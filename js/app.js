/* ČZU Events – společné chování všech stránek:
   přepínač role, mobilní menu a karta akce. */

'use strict';

const CZUApp = (function () {
  /* Vytvoří prvek s třídou a textem. Text se vkládá přes textContent,
     takže text zadaný pořadatelem se nikdy nevykoná jako HTML. */
  function prvek(znacka, trida, text) {
    const novy = document.createElement(znacka);
    if (trida) {
      novy.className = trida;
    }
    if (text !== undefined && text !== null) {
      novy.textContent = text;
    }
    return novy;
  }

  const denVTydnu = new Intl.DateTimeFormat('cs-CZ', {
    weekday: 'short',
    timeZone: 'Europe/Prague'
  });

  function textObsazenosti(akce) {
    return 'Obsazeno ' + akce.obsazeno + '/' + akce.kapacita;
  }

  function ukazatelVolnychMist(akce) {
    const ukazatel = document.createElement('progress');
    ukazatel.max = akce.kapacita;
    const volno = Math.max(akce.kapacita - akce.obsazeno, 0);
    ukazatel.value = volno;
    ukazatel.setAttribute(
      'aria-label',
      'Volná místa: ' + volno + ' z ' + akce.kapacita
    );
    return ukazatel;
  }

  /* Karta akce jako položka seznamu <li>.
     uroven: úroveň nadpisu (2 nebo 3), akceNavic: nepovinné tlačítko pod kartou. */
  function kartaAkce(akce, uroven, akceNavic) {
    const polozka = document.createElement('li');
    const karta = prvek('article', 'karta');

    const obrazek = document.createElement('img');
    obrazek.className = 'karta-obrazek';
    obrazek.src = CZUData.koren() + akce.obrazek;
    obrazek.alt = '';
    obrazek.width = 40;
    obrazek.height = 28;
    obrazek.loading = 'lazy';

    /* Pořadí v kartě: malá značka kategorie, název jako hlavní prvek,
       datum a čas na vlastním řádku, místo a volná místa. */
    const kategorie = prvek('p', 'karta-kategorie');
    kategorie.append(obrazek, prvek('span', 'stitek', akce.kategorie));
    karta.appendChild(kategorie);

    karta.appendChild(prvek('h' + uroven, 'karta-nazev', akce.nazev));

    const termin = prvek('p', 'karta-termin');
    const cas = prvek(
      'time',
      '',
      denVTydnu.format(new Date(akce.zacatek)) + ' ' +
        CZUData.formatDatum(akce.zacatek) + ' · ' + CZUData.formatCas(akce.zacatek)
    );
    cas.dateTime = akce.zacatek;
    termin.appendChild(cas);
    karta.appendChild(termin);

    karta.appendChild(prvek('p', 'karta-misto', akce.misto));

    const volno = Math.max(akce.kapacita - akce.obsazeno, 0);
    const obsazenost = prvek('p', 'karta-obsazenost');
    if (CZUData.probehla(akce)) {
      obsazenost.textContent = 'Proběhlo';
      karta.classList.add('karta-plno');
    } else if (volno === 0) {
      obsazenost.textContent = 'Obsazeno';
      karta.classList.add('karta-plno');
    } else {
      obsazenost.classList.add('karta-volno');
      obsazenost.textContent = 'Volná místa: ' + volno + ' z ' + akce.kapacita;
    }
    karta.appendChild(obsazenost);
    karta.appendChild(ukazatelVolnychMist(akce));

    const tlacitka = prvek('div', 'karta-akce');
    const odkaz = prvek('a', 'karta-detail', 'Zobrazit detail');
    odkaz.href = CZUData.odkazNaDetail(akce);
    odkaz.appendChild(prvek('span', 'skryte-vizualne', ': ' + akce.nazev));
    const sipka = prvek('span', '', '→');
    sipka.setAttribute('aria-hidden', 'true');
    odkaz.appendChild(sipka);
    tlacitka.appendChild(odkaz);
    if (akceNavic) {
      tlacitka.appendChild(akceNavic);
    }
    karta.appendChild(tlacitka);

    polozka.appendChild(karta);
    return polozka;
  }

  /* Zobrazí zprávu v prvku s role="status" nebo role="alert". */
  function zprava(cil, text, typ) {
    cil.textContent = text;
    cil.className = 'zprava' + (typ ? ' zprava-' + typ : '');
    cil.hidden = text === '';
  }

  function nastavPrepinacRole() {
    const vyber = document.getElementById('role');
    if (!vyber) {
      return;
    }
    vyber.value = CZUData.nactiRoli();
    vyber.addEventListener('change', function () {
      CZUData.ulozRoli(vyber.value);
      /* Po změně role se stránka načte znovu, aby se obsah
         i navigace vykreslily pro novou roli. */
      window.location.reload();
    });
  }

  function nastavMenu() {
    const tlacitko = document.getElementById('menu-tlacitko');
    const menu = document.getElementById('menu');
    if (!tlacitko || !menu) {
      return;
    }
    tlacitko.addEventListener('click', function () {
      const otevrene = menu.classList.toggle('otevrene');
      tlacitko.setAttribute('aria-expanded', otevrene ? 'true' : 'false');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    nastavPrepinacRole();
    nastavMenu();
  });

  return {
    prvek: prvek,
    kartaAkce: kartaAkce,
    textObsazenosti: textObsazenosti,
    zprava: zprava
  };
})();
