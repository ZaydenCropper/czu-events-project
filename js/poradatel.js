/* ČZU Events – Pro pořadatele: vytvoření a úprava akce, tabulka vlastních akcí. */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const jenPoradatel = document.getElementById('jen-poradatel');
  const obsah = document.getElementById('poradatel-obsah');
  const formular = document.getElementById('formular');
  const nadpisFormulare = document.getElementById('formular-nadpis');
  const odeslat = document.getElementById('odeslat');
  const zrusitUpravu = document.getElementById('zrusit-upravu');
  const stav = document.getElementById('stav');
  const chyby = document.getElementById('chyby');
  const telo = document.getElementById('tabulka-telo');
  const tabulka = document.getElementById('tabulka-obal');
  const prazdno = document.getElementById('prazdno');
  const t = CZUJazyk.t;

  const pole = {
    id: document.getElementById('akce-id'),
    nazev: document.getElementById('nazev'),
    kategorie: document.getElementById('kategorie'),
    fakulta: document.getElementById('fakulta'),
    datum: document.getElementById('datum'),
    cas: document.getElementById('cas'),
    misto: document.getElementById('misto'),
    kapacita: document.getElementById('kapacita'),
    popis: document.getElementById('popis')
  };

  if (CZUData.nactiRoli() !== 'poradatel') {
    jenPoradatel.hidden = false;
    obsah.hidden = true;
    return;
  }

  function vyprazdniFormular() {
    formular.reset();
    pole.id.value = '';
    nadpisFormulare.textContent = t('Nová akce');
    odeslat.textContent = t('Vytvořit akci');
    zrusitUpravu.hidden = true;
    chyby.hidden = true;
    chyby.textContent = '';
  }

  function nactiDoFormulare(akce) {
    const zacatek = CZUData.rozlozZacatek(akce.zacatek);
    pole.id.value = akce.id;
    pole.nazev.value = akce.nazev;
    pole.kategorie.value = akce.kategorie;
    pole.fakulta.value = akce.fakulta;
    pole.datum.value = zacatek.datum;
    pole.cas.value = zacatek.cas;
    pole.misto.value = akce.misto;
    pole.kapacita.value = akce.kapacita;
    pole.popis.value = akce.popis;
    nadpisFormulare.textContent = t('Úprava akce');
    odeslat.textContent = t('Uložit změny');
    zrusitUpravu.hidden = false;
    CZUApp.zprava(stav, '', '');
    nadpisFormulare.scrollIntoView({ block: 'start' });
    pole.nazev.focus();
  }

  /* Vrátí seznam chyb; prázdný seznam znamená, že je formulář v pořádku. */
  function zkontroluj(prihlasenoTed) {
    const nalezene = [];
    const kapacita = Number(pole.kapacita.value);

    if (pole.nazev.value.trim().length < 3) {
      nalezene.push({ pole: pole.nazev, text: t('Vyplňte název akce (alespoň 3 znaky).') });
    }
    if (!pole.kategorie.value) {
      nalezene.push({ pole: pole.kategorie, text: t('Vyberte kategorii.') });
    }
    if (!pole.fakulta.value) {
      nalezene.push({ pole: pole.fakulta, text: t('Vyberte fakultu.') });
    }
    if (!pole.datum.value) {
      nalezene.push({ pole: pole.datum, text: t('Vyplňte datum akce.') });
    } else if (pole.datum.value < CZUData.dnes()) {
      nalezene.push({ pole: pole.datum, text: t('Datum akce nesmí být v minulosti.') });
    }
    if (!pole.cas.value) {
      nalezene.push({ pole: pole.cas, text: t('Vyplňte čas začátku.') });
    }
    if (pole.misto.value.trim().length < 2) {
      nalezene.push({ pole: pole.misto, text: t('Vyplňte místo konání.') });
    }
    if (!Number.isInteger(kapacita) || kapacita < 1 || kapacita > 5000) {
      nalezene.push({ pole: pole.kapacita, text: t('Kapacita musí být celé číslo od 1 do 5000.') });
    } else if (kapacita < prihlasenoTed) {
      nalezene.push({
        pole: pole.kapacita,
        text: t('Kapacita nesmí být nižší než počet přihlášených ({pocet}).', { pocet: prihlasenoTed })
      });
    }
    if (pole.popis.value.trim().length < 10) {
      nalezene.push({ pole: pole.popis, text: t('Popište akci alespoň jednou větou (10 znaků).') });
    }
    return nalezene;
  }

  function ukazChyby(nalezene) {
    Object.keys(pole).forEach(function (klic) {
      pole[klic].removeAttribute('aria-invalid');
    });
    chyby.textContent = '';
    if (nalezene.length === 0) {
      chyby.hidden = true;
      return;
    }
    chyby.appendChild(CZUApp.prvek('p', '', t('Formulář obsahuje chyby:')));
    const seznam = document.createElement('ul');
    nalezene.forEach(function (chyba) {
      chyba.pole.setAttribute('aria-invalid', 'true');
      seznam.appendChild(CZUApp.prvek('li', '', chyba.text));
    });
    chyby.appendChild(seznam);
    chyby.hidden = false;
    nalezene[0].pole.focus();
  }

  function vykresliTabulku() {
    return CZUData.nactiAkce().then(function (vsechny) {
      const vlastni = vsechny.filter(function (akce) {
        return akce.vlastni;
      });

      telo.textContent = '';
      vlastni.forEach(function (akce) {
        const radek = document.createElement('tr');

        const nazev = document.createElement('th');
        nazev.scope = 'row';
        const odkaz = CZUApp.prvek('a', '', akce.nazev);
        odkaz.href = CZUData.odkazNaDetail(akce);
        nazev.appendChild(odkaz);
        radek.appendChild(nazev);

        radek.appendChild(
          CZUApp.prvek('td', '', CZUData.formatDatum(akce.zacatek) + ' · ' + CZUData.formatCas(akce.zacatek))
        );
        radek.appendChild(CZUApp.prvek('td', '', akce.misto));
        radek.appendChild(CZUApp.prvek('td', '', t('{obsazeno} z {kapacita}', {
          obsazeno: akce.obsazeno,
          kapacita: akce.kapacita
        })));

        const bunka = document.createElement('td');
        const upravit = CZUApp.prvek('button', 'tlacitko', t('Upravit'));
        upravit.type = 'button';
        upravit.appendChild(CZUApp.prvek('span', 'skryte-vizualne', t(' akci {nazev}', { nazev: akce.nazev })));
        upravit.addEventListener('click', function () {
          nactiDoFormulare(akce);
        });
        bunka.appendChild(upravit);
        radek.appendChild(bunka);

        telo.appendChild(radek);
      });

      tabulka.hidden = vlastni.length === 0;
      prazdno.hidden = vlastni.length !== 0;
    });
  }

  formular.addEventListener('submit', function (udalost) {
    udalost.preventDefault();

    const upravuje = pole.id.value !== '';
    const prihlasenoTed = upravuje ? CZUData.pocetPrihlasenych(pole.id.value) : 0;
    const nalezene = zkontroluj(prihlasenoTed);
    ukazChyby(nalezene);
    if (nalezene.length > 0) {
      return;
    }

    const ulozena = CZUData.ulozAkci({
      id: pole.id.value || null,
      nazev: pole.nazev.value.trim(),
      kategorie: pole.kategorie.value,
      fakulta: pole.fakulta.value,
      zacatek: CZUData.slozZacatek(pole.datum.value, pole.cas.value),
      misto: pole.misto.value.trim(),
      kapacita: Number(pole.kapacita.value),
      popis: pole.popis.value.trim()
    });

    if (ulozena === null) {
      CZUApp.zprava(stav, t('Akci se nepodařilo uložit. Prohlížeč nepovolil úložiště.'), 'chyba');
      return;
    }

    vyprazdniFormular();
    vykresliTabulku().then(function () {
      CZUApp.zprava(
        stav,
        t(upravuje ? 'Změny akce „{nazev}“ jsou uložené.' : 'Akce „{nazev}“ je vytvořená a najdete ji v katalogu.',
          { nazev: ulozena.nazev }),
        'ok'
      );
      stav.scrollIntoView({ block: 'nearest' });
    });
  });

  zrusitUpravu.addEventListener('click', function () {
    vyprazdniFormular();
    CZUApp.zprava(stav, '', '');
  });

  vykresliTabulku().catch(function (duvod) {
    CZUApp.zprava(stav, CZUJazyk.t('Akce se nepodařilo načíst. Zkuste stránku obnovit. ({chyba})', { chyba: duvod.message }), 'chyba');
  });
});
