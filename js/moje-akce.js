/* ČZU Events – Moje akce: akce, na které je přihlášený student nebo pořadatel. */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const jenStudent = document.getElementById('jen-student');
  const obsah = document.getElementById('moje-obsah');
  const seznam = document.getElementById('seznam');
  const prazdno = document.getElementById('prazdno');
  const stav = document.getElementById('stav');
  const t = CZUJazyk.t;

  if (!CZUData.muzeSePrihlasit()) {
    jenStudent.hidden = false;
    obsah.hidden = true;
    return;
  }

  function vykresli() {
    return CZUData.nactiMojeAkce().then(function (akce) {
      seznam.textContent = '';
      akce.forEach(function (polozka) {
        const odhlasit = CZUApp.prvek('button', 'tlacitko tlacitko-sirka tlacitko-plne', t('Odhlásit se'));
        odhlasit.type = 'button';
        odhlasit.appendChild(CZUApp.prvek('span', 'skryte-vizualne', t(' z akce {nazev}', { nazev: polozka.nazev })));
        odhlasit.addEventListener('click', function () {
          const vysledek = CZUData.odhlasit(polozka.id);
          if (vysledek.ok) {
            vykresli().then(function () {
              CZUApp.zprava(stav, t('Odhlášení z akce „{nazev}“ proběhlo.', { nazev: polozka.nazev }), 'ok');
            });
          } else {
            CZUApp.zprava(stav, t('Odhlášení se nepodařilo uložit.'), 'chyba');
          }
        });
        seznam.appendChild(CZUApp.kartaAkce(polozka, 2, odhlasit));
      });
      prazdno.hidden = akce.length !== 0;
    });
  }

  vykresli().catch(function (duvod) {
    CZUApp.zprava(stav, CZUJazyk.t('Akce se nepodařilo načíst. Zkuste stránku obnovit. ({chyba})', { chyba: duvod.message }), 'chyba');
  });
});
