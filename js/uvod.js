/* ČZU Events – úvodní stránka: tři nejbližší akce. */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  const seznam = document.getElementById('nejblizsi');
  const chyba = document.getElementById('chyba');

  CZUData.nactiAkce()
    .then(function (akce) {
      const nadchazejici = akce.filter(function (polozka) {
        return !CZUData.probehla(polozka);
      });
      /* Když už všechny ukázkové akce proběhly, ukážeme poslední tři. */
      const vyber = nadchazejici.length > 0 ? nadchazejici.slice(0, 3) : akce.slice(-3);

      seznam.textContent = '';
      vyber.forEach(function (polozka) {
        seznam.appendChild(CZUApp.kartaAkce(polozka, 3));
      });
    })
    .catch(function (duvod) {
      CZUApp.zprava(chyba, 'Akce se nepodařilo načíst. Zkuste stránku obnovit. (' + duvod.message + ')', 'chyba');
    });
});
