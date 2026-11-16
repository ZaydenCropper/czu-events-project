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

  const t = CZUJazyk.t;

  const denVTydnu = new Intl.DateTimeFormat(CZUJazyk.locale, {
    weekday: 'short',
    timeZone: 'Europe/Prague'
  });

  function textVolnychMist(akce) {
    const volno = Math.max(akce.kapacita - akce.obsazeno, 0);
    return volno === 0 ? t('Obsazeno') : t('Volná místa: {volno} z {kapacita}', { volno: volno, kapacita: akce.kapacita });
  }

  function ukazatelVolnychMist(akce) {
    const ukazatel = document.createElement('progress');
    ukazatel.max = akce.kapacita;
    const volno = Math.max(akce.kapacita - akce.obsazeno, 0);
    ukazatel.value = volno;
    ukazatel.setAttribute(
      'aria-label',
      t('Volná místa: {volno} z {kapacita}', { volno: volno, kapacita: akce.kapacita })
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
    kategorie.append(obrazek, prvek('span', 'stitek', t(akce.kategorie)));
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
      obsazenost.textContent = t('Proběhlo');
      karta.classList.add('karta-plno');
    } else if (volno === 0) {
      obsazenost.textContent = t('Obsazeno');
      karta.classList.add('karta-plno');
    } else {
      obsazenost.classList.add('karta-volno');
      obsazenost.textContent = t('Volná místa: {volno} z {kapacita}', { volno: volno, kapacita: akce.kapacita });
    }
    karta.appendChild(obsazenost);
    karta.appendChild(ukazatelVolnychMist(akce));

    const tlacitka = prvek('div', 'karta-akce');
    const odkaz = prvek('a', 'karta-detail', t('Zobrazit detail'));
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

  /* Přepínač role: tři přepínací volby s ikonou (host, student, pořadatel).
     Po změně se stránka načte znovu, aby se obsah i navigace vykreslily
     pro novou roli. Fokus se pak vrátí na zvolenou roli, aby uživatel
     klávesnice nezačínal znovu od začátku stránky. */
  const KLIC_FOKUS_ROLE = 'czu-events-05.fokus-role';

  function nastavPrepinacRole() {
    const volby = document.querySelectorAll('.role-vstup');
    if (volby.length === 0) {
      return;
    }
    const role = CZUData.nactiRoli();
    volby.forEach(function (volba) {
      volba.checked = volba.value === role;
      volba.addEventListener('change', function () {
        if (!volba.checked) {
          return;
        }
        CZUData.ulozRoli(volba.value);
        /* Fokus se vrací jen při ovládání klávesnicí, po kliknutí myší ne. */
        const zKlavesnice = volba.matches(':focus-visible');
        try {
          if (zKlavesnice) {
            window.sessionStorage.setItem(KLIC_FOKUS_ROLE, '1');
          }
        } catch (chyba) {
          /* Bez úložiště se jen nevrátí fokus, přepnutí role funguje. */
        }
        window.location.reload();
      });
    });

    let vratitFokus = false;
    try {
      vratitFokus = window.sessionStorage.getItem(KLIC_FOKUS_ROLE) === '1';
      window.sessionStorage.removeItem(KLIC_FOKUS_ROLE);
    } catch (chyba) {
      vratitFokus = false;
    }
    if (vratitFokus) {
      const zvolena = document.getElementById('role-' + role);
      if (zvolena) {
        /* Na mobilu je přepínač v menu, které je potřeba nejdřív otevřít. */
        const menu = document.getElementById('menu');
        const tlacitko = document.getElementById('menu-tlacitko');
        if (menu && tlacitko && window.getComputedStyle(menu).display === 'none') {
          menu.classList.add('otevrene');
          tlacitko.setAttribute('aria-expanded', 'true');
        }
        zvolena.focus();
      }
    }
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
    document.addEventListener('keydown', function (udalost) {
      if (udalost.key !== 'Escape' || !menu.classList.contains('otevrene') ||
          window.getComputedStyle(tlacitko).display === 'none') return;
      udalost.preventDefault();
      menu.classList.remove('otevrene');
      tlacitko.setAttribute('aria-expanded', 'false');
      tlacitko.focus();
    });
  }

  /* Enter otevře výběr fakulty. Pokud prohlížeč nemá showPicker,
     nabídneme nativní seznam a zachováme šipky, Enter, Escape i Tab. */
  function nastavVyberFakulty() {
    document.querySelectorAll('select#fakulta, select#moje-fakulta').forEach(function (vyber) {
      let rozbaleny = false;
      let puvodniVelikost = null;
      let puvodniHodnota = '';
      function zavri() {
        if (!rozbaleny) return;
        if (puvodniVelikost === null) vyber.removeAttribute('size');
        else vyber.setAttribute('size', puvodniVelikost);
        rozbaleny = false;
      }
      vyber.addEventListener('keydown', function (udalost) {
        if (udalost.key === 'Escape' && rozbaleny) {
          udalost.preventDefault();
          udalost.stopPropagation();
          vyber.value = puvodniHodnota;
          zavri();
          vyber.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
        if (udalost.key !== 'Enter' || udalost.isComposing || vyber.disabled) return;
        udalost.preventDefault();
        if (rozbaleny) {
          zavri();
          vyber.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
        if (typeof vyber.showPicker === 'function') {
          try { vyber.showPicker(); return; } catch (chyba) { /* Použije se nativní seznam. */ }
        }
        puvodniVelikost = vyber.getAttribute('size');
        puvodniHodnota = vyber.value;
        vyber.size = Math.max(2, Math.min(vyber.options.length, 8));
        rozbaleny = true;
      });
      vyber.addEventListener('blur', zavri);
      vyber.addEventListener('click', function (udalost) {
        if (rozbaleny && udalost.detail > 0) zavri();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    nastavPrepinacRole();
    nastavMenu();
    nastavVyberFakulty();
  });

  return {
    prvek: prvek,
    kartaAkce: kartaAkce,
    textVolnychMist: textVolnychMist,
    zprava: zprava
  };
})();
