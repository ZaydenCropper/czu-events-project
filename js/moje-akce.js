/* ČZU Events – Moje akce: akce, na které je student přihlášený. */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const jenStudent = document.getElementById('jen-student');
  const obsah = document.getElementById('moje-obsah');
  const seznam = document.getElementById('seznam');
  const prazdno = document.getElementById('prazdno');
  const stav = document.getElementById('stav');

  if (CZUData.nactiRoli() !== 'student') {
    jenStudent.hidden = false;
    obsah.hidden = true;
    return;
  }

  function vykresli() {
    return CZUData.nactiMojeAkce().then(function (akce) {
      seznam.textContent = '';
      akce.forEach(function (polozka) {
        const odhlasit = CZUApp.prvek('button', 'tlacitko tlacitko-sirka tlacitko-plne', 'Odhlásit se');
        odhlasit.type = 'button';
        odhlasit.appendChild(CZUApp.prvek('span', 'skryte-vizualne', ' z akce ' + polozka.nazev));
        odhlasit.addEventListener('click', function () {
          const vysledek = CZUData.odhlasit(polozka.id);
          if (vysledek.ok) {
            vykresli().then(function () {
              CZUApp.zprava(stav, 'Odhlášení z akce „' + polozka.nazev + '“ proběhlo.', 'ok');
            });
          } else {
            CZUApp.zprava(stav, 'Odhlášení se nepodařilo uložit.', 'chyba');
          }
        });
        seznam.appendChild(CZUApp.kartaAkce(polozka, 2, odhlasit));
      });
      prazdno.hidden = akce.length !== 0;
    });
  }

  vykresli().catch(function (duvod) {
    CZUApp.zprava(stav, 'Akce se nepodařilo načíst. Zkuste stránku obnovit. (' + duvod.message + ')', 'chyba');
  });
});
