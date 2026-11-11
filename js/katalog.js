/* ČZU Events – katalog akcí (akce.html):
   načtení akcí, filtry, hledání a přepínání seznamu a kalendáře. */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const seznam = document.getElementById('seznam');
  const pocet = document.getElementById('pocet');
  const prazdno = document.getElementById('prazdno');
  const chyba = document.getElementById('chyba');
  const hledat = document.getElementById('hledat');
  const kategorie = document.getElementById('kategorie');
  const fakulta = document.getElementById('fakulta');
  const termin = document.getElementById('termin');
  const rozsah = document.getElementById('rozsah');
  const od = document.getElementById('od');
  const doData = document.getElementById('do');
  const chybaRozsahu = document.getElementById('rozsah-chyba');
  const volna = document.getElementById('volna');
  const zrusit = document.getElementById('zrusit');
  const filtry = document.getElementById('filtry');
  const filtryTlacitko = document.getElementById('filtry-tlacitko');

  const prepinacZobrazeni = document.getElementById('zobrazeni-akci');
  const zobrazSeznam = document.getElementById('zobraz-seznam');
  const zobrazKalendar = document.getElementById('zobraz-kalendar');
  const kalendar = document.getElementById('kalendar');
  const nadpisMesice = document.getElementById('kalendar-mesic');
  const dnyKalendare = document.getElementById('kalendar-dny');
  const program = document.getElementById('kalendar-program');
  const formatMesice = new Intl.DateTimeFormat('cs-CZ', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const formatDne = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'full', timeZone: 'UTC' });
  const rychleFiltry = document.getElementById('rychle-filtry');
  const rychleVolna = document.getElementById('rychle-volna');
  const mojeFakulta = document.getElementById('moje-fakulta');
  const mojeFakultaVolba = document.getElementById('moje-fakulta-volba');
  const aktivniFiltry = document.getElementById('aktivni-filtry');
  const programNadpis = document.getElementById('program-nadpis');
  const programVse = document.getElementById('program-vse');
  let vybranyDen = '';
  let vsechnyAkce = [];
  let kalendarAktivni = false;
  let mesicKalendare = '';

  /* Porovnávání textu bez ohledu na velikost písmen a diakritiku. */
  function zjednodus(text) {
    return String(text)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  function posunDen(den, oKolik) {
    const casti = den.split('-').map(Number);
    const datum = new Date(Date.UTC(casti[0], casti[1] - 1, casti[2] + oKolik));
    return datum.toISOString().slice(0, 10);
  }

  /* Pondělí až neděle týdne, do kterého patří dnešek. */
  function tentoTyden() {
    const dnes = CZUData.dnes();
    const casti = dnes.split('-').map(Number);
    const denVTydnu = new Date(Date.UTC(casti[0], casti[1] - 1, casti[2])).getUTCDay();
    const odPondeli = (denVTydnu + 6) % 7;
    const pondeli = posunDen(dnes, -odPondeli);
    return { od: pondeli, do: posunDen(pondeli, 6) };
  }

  function odpovidaTerminu(akce) {
    const den = CZUData.denAkce(akce.zacatek);
    const dnes = CZUData.dnes();

    if (termin.value === 'dnes') {
      return den === dnes;
    }
    if (termin.value === 'tyden') {
      const tyden = tentoTyden();
      return den >= tyden.od && den <= tyden.do;
    }
    if (termin.value === 'pristi-tyden') {
      const tyden = tentoTyden();
      return den >= posunDen(tyden.od, 7) && den <= posunDen(tyden.do, 7);
    }
    if (termin.value === 'mesic') {
      return den.slice(0, 7) === dnes.slice(0, 7);
    }
    if (termin.value === 'rozsah') {
      if (od.value && den < od.value) {
        return false;
      }
      if (doData.value && den > doData.value) {
        return false;
      }
      return true;
    }
    return true;
  }

  function vyfiltruj() {
    const dotaz = zjednodus(hledat.value.trim());

    return vsechnyAkce.filter(function (akce) {
      if (kategorie.value && akce.kategorie !== kategorie.value) {
        return false;
      }
      if (fakulta.value && akce.fakulta !== fakulta.value) {
        return false;
      }
      if (!odpovidaTerminu(akce)) {
        return false;
      }
      if (volna.checked && (akce.obsazeno >= akce.kapacita || CZUData.probehla(akce))) {
        return false;
      }
      if (dotaz) {
        const text = zjednodus(
          [akce.nazev, akce.popis, akce.misto, akce.kategorie, akce.fakulta].join(' ')
        );
        if (text.indexOf(dotaz) === -1) {
          return false;
        }
      }
      return true;
    });
  }

  function textPoctu(n) {
    if (n === 1) {
      return 'Nalezena 1 akce.';
    }
    if (n >= 2 && n <= 4) {
      return 'Nalezeny ' + n + ' akce.';
    }
    return 'Nalezeno ' + n + ' akcí.';
  }

  function textVolnychMist(akce) {
    if (CZUData.probehla(akce)) return 'Proběhlo';
    const zbyva = Math.max(akce.kapacita - akce.obsazeno, 0);
    return zbyva === 0 ? 'Obsazeno' : 'Volná místa: ' + zbyva;
  }

  function vykresliRychleFiltry() {
    document.querySelectorAll('[data-rychly-termin]').forEach(function (tlacitko) {
      tlacitko.setAttribute('aria-pressed', String(termin.value === tlacitko.dataset.rychlyTermin));
    });
    rychleVolna.setAttribute('aria-pressed', String(volna.checked));
    aktivniFiltry.textContent = '';
    const podminky = [
      { ovladac: hledat, text: 'Hledání: ' + hledat.value.trim() },
      { ovladac: kategorie, text: 'Kategorie: ' + kategorie.value },
      { ovladac: fakulta, text: 'Fakulta: ' + fakulta.value },
      { ovladac: termin, text: 'Termín: ' + termin.options[termin.selectedIndex].text +
        (termin.value === 'rozsah' ? ' ' + (od.value || '…') + ' – ' + (doData.value || '…') : '') },
      { ovladac: volna, text: 'Jen volná místa' }
    ];
    podminky.forEach(function (podminka) {
      const ovladac = podminka.ovladac;
      if (!(ovladac === volna ? volna.checked : ovladac.value.trim())) return;
      const tlacitko = CZUApp.prvek('button', 'tlacitko filtr-stitek', podminka.text + ' ×');
      tlacitko.type = 'button';
      tlacitko.setAttribute('aria-label', 'Zrušit filtr ' + podminka.text);
      tlacitko.addEventListener('click', function () {
        if (ovladac === volna) volna.checked = false;
        else ovladac.value = '';
        vykresliPoFiltru();
        hledat.focus();
      });
      aktivniFiltry.appendChild(tlacitko);
    });
    aktivniFiltry.hidden = aktivniFiltry.childElementCount === 0;
  }

  function vykresliKalendar(akce) {
    const dnes = CZUData.dnes();
    if (!mesicKalendare) {
      const mesicDnes = dnes.slice(0, 7);
      const nejblizsi = akce.find(function (polozka) {
        return CZUData.denAkce(polozka.zacatek) >= dnes;
      }) || akce[akce.length - 1];
      const maAkciTentoMesic = akce.some(function (polozka) {
        return CZUData.denAkce(polozka.zacatek).startsWith(mesicDnes);
      });
      mesicKalendare = nejblizsi && !maAkciTentoMesic
        ? CZUData.denAkce(nejblizsi.zacatek).slice(0, 7)
        : mesicDnes;
    }

    const zacatek = mesicKalendare + '-01';
    const prvniDen = new Date(zacatek + 'T00:00:00Z');
    const [rok, mesic] = mesicKalendare.split('-').map(Number);
    const pocetDnu = new Date(Date.UTC(rok, mesic, 0)).getUTCDate();
    const odsazeni = (prvniDen.getUTCDay() + 6) % 7;
    const podleDne = new Map();

    akce.forEach(function (polozka) {
      const den = CZUData.denAkce(polozka.zacatek);
      if (!den.startsWith(mesicKalendare)) return;
      if (!podleDne.has(den)) podleDne.set(den, []);
      podleDne.get(den).push(polozka);
    });

    if (!podleDne.has(vybranyDen)) vybranyDen = '';
    programNadpis.textContent = vybranyDen ? 'Program vybraného dne' : 'Program měsíce';
    programVse.hidden = !vybranyDen;
    nadpisMesice.textContent = formatMesice.format(prvniDen);
    dnyKalendare.textContent = '';
    for (let tyden = 0; tyden < odsazeni + pocetDnu; tyden += 7) {
      const radek = dnyKalendare.insertRow();
      for (let sloupec = 0; sloupec < 7; sloupec++) {
        const bunka = radek.insertCell();
        const cislo = tyden + sloupec - odsazeni + 1;
        if (cislo < 1 || cislo > pocetDnu) continue;

        const den = posunDen(zacatek, cislo - 1);
        const akceDne = podleDne.get(den);
        const prvekDne = CZUApp.prvek(akceDne ? 'a' : 'span', 'kalendar-den', cislo);
        if (akceDne) {
          prvekDne.href = '#program-' + den;
          const popisDne = formatDne.format(new Date(den + 'T00:00:00Z'));
          prvekDne.setAttribute('aria-label', popisDne + '. ' + textPoctu(akceDne.length));
          prvekDne.addEventListener('click', function (udalost) {
            if (udalost.ctrlKey || udalost.metaKey || udalost.altKey || udalost.shiftKey) return;
            udalost.preventDefault();
            vybranyDen = den;
            vykresli();
            document.getElementById('program-' + den).focus();
          });
        }
        if (den === dnes) prvekDne.setAttribute('aria-current', 'date');
        if (den === vybranyDen) prvekDne.classList.add('kalendar-den-vybrany');
        bunka.appendChild(prvekDne);
        if (akceDne) {
          const nahledy = CZUApp.prvek('ul', 'kalendar-nahledy');
          akceDne.forEach(function (polozka) {
            const nahled = CZUApp.prvek('li');
            const odkaz = CZUApp.prvek('a', 'kalendar-nahled', polozka.nazev);
            odkaz.href = CZUData.odkazNaDetail(polozka);
            const cas = CZUApp.prvek('time', '', CZUData.formatCas(polozka.zacatek));
            cas.dateTime = polozka.zacatek;
            nahled.append(cas, odkaz, CZUApp.prvek('span', '', textVolnychMist(polozka)));
            nahledy.appendChild(nahled);
          });
          bunka.appendChild(nahledy);
        }
      }
    }

    program.textContent = '';
    if (podleDne.size === 0) {
      program.appendChild(CZUApp.prvek('p', 'prazdny-stav', 'V tomto měsíci nejsou žádné akce odpovídající filtrům.'));
    }
    podleDne.forEach(function (polozky, den) {
      if (vybranyDen && den !== vybranyDen) return;
      const nadpis = CZUApp.prvek('h3', 'kalendar-datum', formatDne.format(new Date(den + 'T00:00:00Z')));
      nadpis.id = 'program-' + den;
      nadpis.tabIndex = -1;
      const denniProgram = CZUApp.prvek('ul', 'kalendar-program');
      polozky.forEach(function (polozka) {
        const radek = CZUApp.prvek('li');
        const cas = CZUApp.prvek('time', 'kalendar-cas', CZUData.formatCas(polozka.zacatek));
        cas.dateTime = polozka.zacatek;
        const odkaz = CZUApp.prvek('a', '', polozka.nazev);
        odkaz.href = CZUData.odkazNaDetail(polozka);
        const udaje = CZUApp.prvek('div', 'kalendar-udaje');
        udaje.append(odkaz, CZUApp.prvek('span', 'kalendar-volno', textVolnychMist(polozka)));
        radek.append(cas, udaje);
        denniProgram.appendChild(radek);
      });
      program.append(nadpis, denniProgram);
    });
    return podleDne;
  }

  function posunMesic(oKolik) {
    const [rok, mesic] = mesicKalendare.split('-').map(Number);
    const dalsi = new Date(Date.UTC(rok, mesic - 1 + oKolik, 1)).toISOString().slice(0, 7);
    if (!/^[1-9]\d{3}-/.test(dalsi)) return;
    mesicKalendare = dalsi;
    vybranyDen = '';
    vykresli();
  }

  /* Uloží nastavení filtrů do adresy, aby šel výsledek sdílet odkazem. */
  function zapisAdresu() {
    const parametry = new URLSearchParams();
    if (hledat.value.trim()) {
      parametry.set('q', hledat.value.trim());
    }
    if (kategorie.value) {
      parametry.set('kategorie', kategorie.value);
    }
    if (fakulta.value) {
      parametry.set('fakulta', fakulta.value);
    }
    if (termin.value) {
      parametry.set('termin', termin.value);
    }
    if (termin.value === 'rozsah' && od.value) {
      parametry.set('od', od.value);
    }
    if (termin.value === 'rozsah' && doData.value) {
      parametry.set('do', doData.value);
    }
    if (volna.checked) {
      parametry.set('volna', '1');
    }
    if (kalendarAktivni) {
      parametry.set('zobrazeni', 'kalendar');
      if (mesicKalendare) parametry.set('mesic', mesicKalendare);
    }
    const dotaz = parametry.toString();
    window.history.replaceState(null, '', dotaz ? '?' + dotaz : window.location.pathname);
  }

  function nastavZAdresy() {
    const parametry = new URLSearchParams(window.location.search);
    const maMoznost = function (vyber, hodnota) {
      return Array.prototype.some.call(vyber.options, function (moznost) {
        return moznost.value === hodnota;
      });
    };

    hledat.value = parametry.get('q') || '';
    if (maMoznost(kategorie, parametry.get('kategorie') || '')) {
      kategorie.value = parametry.get('kategorie') || '';
    }
    if (maMoznost(fakulta, parametry.get('fakulta') || '')) {
      fakulta.value = parametry.get('fakulta') || '';
    }
    if (maMoznost(termin, parametry.get('termin') || '')) {
      termin.value = parametry.get('termin') || '';
    }
    od.value = parametry.get('od') || '';
    doData.value = parametry.get('do') || '';
    volna.checked = parametry.get('volna') === '1';
    kalendarAktivni = parametry.get('zobrazeni') === 'kalendar';
    const mesic = parametry.get('mesic') || '';
    if (kalendarAktivni && /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(mesic)) {
      mesicKalendare = mesic;
    }
  }

  function vykresli(presunMesic) {
    rozsah.hidden = termin.value !== 'rozsah';
    const neplatnyRozsah = termin.value === 'rozsah' &&
      Boolean(od.value && doData.value && od.value > doData.value);
    chybaRozsahu.hidden = !neplatnyRozsah;
    od.setAttribute('aria-invalid', String(neplatnyRozsah));
    doData.setAttribute('aria-invalid', String(neplatnyRozsah));
    doData.setCustomValidity(neplatnyRozsah ? chybaRozsahu.textContent : '');
    if (neplatnyRozsah) {
      filtry.classList.add('otevrene');
      filtryTlacitko.setAttribute('aria-expanded', 'true');
    }

    const akce = vyfiltruj();
    seznam.hidden = kalendarAktivni || neplatnyRozsah;
    kalendar.hidden = !kalendarAktivni || neplatnyRozsah;
    zobrazSeznam.setAttribute('aria-pressed', String(!kalendarAktivni));
    zobrazKalendar.setAttribute('aria-pressed', String(kalendarAktivni));

    seznam.textContent = '';
    if (neplatnyRozsah) {
      pocet.textContent = 'Upravte rozsah termínu.';
    } else if (kalendarAktivni) {
      if (presunMesic && !akce.some(function (polozka) {
        return CZUData.denAkce(polozka.zacatek).startsWith(mesicKalendare);
      })) {
        mesicKalendare = '';
      }
      const podleDne = vykresliKalendar(akce);
      const pocetVMesici = Array.from(podleDne.values()).reduce(function (soucet, polozky) {
        return soucet + polozky.length;
      }, 0);
      pocet.textContent = textPoctu(pocetVMesici);
    } else {
      akce.forEach(function (polozka) {
        seznam.appendChild(CZUApp.kartaAkce(polozka, 2));
      });
      pocet.textContent = textPoctu(akce.length);
    }
    prazdno.hidden = neplatnyRozsah || kalendarAktivni || akce.length !== 0;
    /* Tlačítko „Zrušit filtry“ je vidět jen tehdy, když je co rušit. */
    zrusit.hidden = !jeNastavenFiltr();
    vykresliRychleFiltry();
    zapisAdresu();
  }

  function jeNastavenFiltr() {
    return (
      hledat.value.trim() !== '' ||
      kategorie.value !== '' ||
      fakulta.value !== '' ||
      termin.value !== '' ||
      volna.checked
    );
  }

  function vykresliPoFiltru() {
    vybranyDen = '';
    vykresli(true);
  }

  function zrusFiltry() {
    hledat.value = '';
    kategorie.value = '';
    fakulta.value = '';
    termin.value = '';
    od.value = '';
    doData.value = '';
    volna.checked = false;
    vykresliPoFiltru();
  }

  [kategorie, fakulta, termin, od, doData, volna].forEach(function (ovladac) {
    ovladac.addEventListener('change', vykresliPoFiltru);
  });
  hledat.addEventListener('input', vykresliPoFiltru);
  zobrazSeznam.addEventListener('click', function () {
    kalendarAktivni = false;
    vykresli();
  });
  zobrazKalendar.addEventListener('click', function () {
    kalendarAktivni = true;
    vykresliPoFiltru();
  });
  document.getElementById('predchozi-mesic').addEventListener('click', function () {
    posunMesic(-1);
  });
  document.getElementById('dalsi-mesic').addEventListener('click', function () {
    posunMesic(1);
  });
  zrusit.addEventListener('click', zrusFiltry);
  document.getElementById('prazdno-zrusit').addEventListener('click', zrusFiltry);

  filtryTlacitko.addEventListener('click', function () {
    const otevrene = filtry.classList.toggle('otevrene');
    filtryTlacitko.setAttribute('aria-expanded', otevrene ? 'true' : 'false');
  });

  programVse.addEventListener('click', function () {
    vybranyDen = '';
    vykresli();
    programVse.hidden = true;
    document.getElementById('dalsi-mesic').focus();
  });
  document.querySelectorAll('[data-rychly-termin]').forEach(function (tlacitko) {
    tlacitko.addEventListener('click', function () {
      const hodnota = tlacitko.dataset.rychlyTermin;
      termin.value = termin.value === hodnota ? '' : hodnota;
      vykresliPoFiltru();
    });
  });
  rychleVolna.addEventListener('click', function () {
    volna.checked = !volna.checked;
    vykresliPoFiltru();
  });

  Array.from(fakulta.options).forEach(function (moznost) {
    const kopie = moznost.cloneNode(true);
    if (!kopie.value) kopie.textContent = 'Vyberte fakultu';
    mojeFakulta.appendChild(kopie);
  });
  try {
    mojeFakulta.value = localStorage.getItem('czu-events-05.moje-fakulta') || '';
  } catch (chybaUloziste) {
    mojeFakulta.value = '';
  }
  document.getElementById('pouzit-fakultu').addEventListener('click', function () {
    if (!mojeFakulta.value) {
      mojeFakulta.focus();
      return;
    }
    fakulta.value = mojeFakulta.value;
    try {
      localStorage.setItem('czu-events-05.moje-fakulta', mojeFakulta.value);
    } catch (chybaUloziste) {
      /* Filtr funguje i bez zapamatování fakulty. */
    }
    mojeFakultaVolba.open = false;
    vykresliPoFiltru();
    mojeFakultaVolba.querySelector('summary').focus();
  });

  nastavZAdresy();

  CZUData.nactiAkce()
    .then(function (akce) {
      vsechnyAkce = akce;
      prepinacZobrazeni.hidden = false;
      rychleFiltry.hidden = false;
      vykresli();
    })
    .catch(function (duvod) {
      pocet.textContent = '';
      CZUApp.zprava(chyba, 'Akce se nepodařilo načíst. Zkuste stránku obnovit. (' + duvod.message + ')', 'chyba');
    });
});
