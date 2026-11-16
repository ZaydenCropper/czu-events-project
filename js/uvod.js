/* ČZU Events – nejbližší budoucí akce a další tři, bez opakování. */
'use strict';
document.addEventListener('DOMContentLoaded', function () {
  const seznam = document.getElementById('nejblizsi');
  const dalsi = document.getElementById('dalsi-akce');
  const chyba = document.getElementById('chyba');
  const tip = document.querySelector('.uvod-tip');
  const obsah = document.getElementById('tip-obsah');
  const t = CZUJazyk.t;
  const den = new Intl.DateTimeFormat(CZUJazyk.locale, {
    weekday: 'short', day: 'numeric', month: 'long', timeZone: 'Europe/Prague'
  });
  function katalog() {
    const odkaz = CZUApp.prvek('a', 'tlacitko', t('Zobrazit všechny akce'));
    odkaz.href = 'akce.html';
    obsah.appendChild(odkaz);
  }
  function vykresli(akce) {
    obsah.textContent = '';
    seznam.textContent = '';
    // Již zahájenou akci nenabízíme jako nadcházející; data nemají konec akce.
    const budouci = akce.filter(polozka => new Date(polozka.zacatek).getTime() >= Date.now());
    const prvni = budouci[0];
    if (prvni) {
      const termin = CZUApp.prvek('p', 'tip-termin');
      const cas = document.createElement('time');
      cas.dateTime = prvni.zacatek;
      cas.textContent = den.format(new Date(prvni.zacatek)) + ' · ' + CZUData.formatCas(prvni.zacatek);
      termin.appendChild(cas);
      const volno = Math.max(prvni.kapacita - prvni.obsazeno, 0);
      obsah.append(termin, CZUApp.prvek('h3', '', prvni.nazev),
        CZUApp.prvek('p', 'tip-misto', prvni.misto),
        CZUApp.prvek('p', 'tip-volno' + (volno === 0 ? ' tip-plno' : ''), CZUApp.textVolnychMist(prvni)));
      const odkaz = CZUApp.prvek('a', 'tlacitko', t('Zobrazit detail'));
      odkaz.href = CZUData.odkazNaDetail(prvni);
      odkaz.setAttribute('aria-label', t('Zobrazit detail') + ': ' + prvni.nazev);
      obsah.appendChild(odkaz);
    } else {
      obsah.appendChild(CZUApp.prvek('p', '', t('Momentálně nejsou žádné nadcházející akce.')));
      katalog();
    }
    const zbytek = budouci.slice(1, 4);
    zbytek.forEach(polozka => seznam.appendChild(CZUApp.kartaAkce(polozka, 3)));
    dalsi.hidden = zbytek.length === 0;
    obsah.removeAttribute('aria-busy');
    tip.hidden = false;
  }
  CZUData.nactiAkce().then(vykresli).catch(function (duvod) {
    obsah.textContent = '';
    obsah.appendChild(CZUApp.prvek('p', '', t('Nejbližší akci se nepodařilo načíst.')));
    katalog();
    obsah.removeAttribute('aria-busy');
    tip.hidden = false;
    dalsi.hidden = true;
    CZUApp.zprava(chyba, t('Akce se nepodařilo načíst. Zkuste stránku obnovit. ({chyba})', { chyba: duvod.message }), 'chyba');
  });
});
