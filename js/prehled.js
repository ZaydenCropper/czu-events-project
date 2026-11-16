/* Informační řádek: pražský čas, výukový týden, zvolená role a počasí.
   Harmonogram 2026/2027: https://www.tf.czu.cz/dl/154160?lang=cs
   První týden ZS začíná v pondělí 28. 9. (výuka od úterý 29. 9.).
   Po skončení známého období používáme výslovně kalendářní týden ISO.
   Počasí: modelová aktuální data Open-Meteo, bez geolokace návštěvníka. */
'use strict';
(function () {
  const panel = document.querySelector('.denni-prehled');
  if (!panel) return;
  const en = CZUJazyk.jazyk === 'en';
  const text = (cs, anglicky) => en ? anglicky : cs;
  const datum = panel.querySelector('.prehled-datum');
  const tyden = panel.querySelector('.prehled-tyden');
  const pocasi = panel.querySelector('.prehled-pocasi-text');
  const ikona = panel.querySelector('.prehled-pocasi-ikona');
  panel.setAttribute('aria-label', text('Dnešní přehled', 'Today at a glance'));

  function aktualizujDatum() {
    const ted = new Date();
    const casti = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(ted).map(p => [p.type, p.value]));
    const den = Date.UTC(+casti.year, +casti.month - 1, +casti.day);
    datum.dateTime = casti.year + '-' + casti.month + '-' + casti.day;
    datum.textContent = new Intl.DateTimeFormat(CZUJazyk.locale, {
      timeZone: 'Europe/Prague', weekday: 'short', day: 'numeric', month: 'numeric', year: 'numeric'
    }).format(ted) + ' · ' + new Intl.DateTimeFormat(CZUJazyk.locale, {
      timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).format(ted);
    datum.title = text('Datum a čas v Praze', 'Date and time in Prague');
    const semestr = [
      { od: Date.UTC(2026, 8, 28), do: Date.UTC(2026, 11, 20), cs: 'ZS', en: 'winter' },
      { od: Date.UTC(2027, 1, 8), do: Date.UTC(2027, 4, 2), cs: 'LS', en: 'summer' }
    ].find(s => den >= s.od && den <= s.do);
    let cislo;
    if (semestr) {
      cislo = Math.floor((den - semestr.od) / 604800000) + 1;
      tyden.textContent = en
        ? 'Teaching week ' + cislo + ' · ' + (cislo % 2 ? 'odd' : 'even') + ' · ' + semestr.en + ' 2026/27'
        : cislo + '. výukový týden · ' + (cislo % 2 ? 'lichý' : 'sudý') + ' · ' + semestr.cs + ' 2026/27';
      tyden.title = text('Podle obecného harmonogramu ČZU 2026/2027; konkrétní rozvrh ověřte v UIS.',
        'Based on the general CZU 2026/2027 calendar; check your timetable in UIS.');
    } else {
      const ctvrtek = new Date(den);
      ctvrtek.setUTCDate(ctvrtek.getUTCDate() + 4 - (ctvrtek.getUTCDay() || 7));
      cislo = Math.ceil(((ctvrtek - Date.UTC(ctvrtek.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
      tyden.textContent = text('Kalendářní týden ', 'Calendar week ') + cislo + ' · ' +
        (cislo % 2 ? text('lichý', 'odd') : text('sudý', 'even'));
      tyden.title = text('Kalendářní týden ISO, nikoli výukový týden.', 'ISO calendar week, not a teaching week.');
    }
  }

  const role = CZUData.nactiRoli();
  const nazvy = { host: ['Host', 'Guest'], student: ['Student', 'Student'], poradatel: ['Pořadatel', 'Organiser'] };
  panel.querySelector('.prehled-role-text').textContent = text(...nazvy[role]);
  panel.querySelector('.prehled-profil').title = text('Zvolená role v prototypu', 'Selected role in the prototype');
  const vzor = document.querySelector('label[for="role-' + role + '"] svg');
  if (vzor) panel.querySelector('.prehled-avatar').appendChild(vzor.cloneNode(true));

  function popisPocasi(kod, den) {
    if (kod === 0) return [den ? '☀' : '☾', text('Jasno', 'Clear')];
    if (kod === 1 || kod === 2) return ['⛅', text('Polojasno', 'Partly cloudy')];
    if (kod === 3) return ['☁', text('Zataženo', 'Overcast')];
    if (kod === 45 || kod === 48) return ['≋', text('Mlha', 'Fog')];
    if ([51, 53, 55, 56, 57].includes(kod)) return ['☂', text('Mrholení', 'Drizzle')];
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(kod)) return ['☂', text('Déšť', 'Rain')];
    if ([71, 73, 75, 77, 85, 86].includes(kod)) return ['❄', text('Sněžení', 'Snow')];
    if ([95, 96, 99].includes(kod)) return ['ϟ', text('Bouřka', 'Thunderstorm')];
    return ['○', text('Počasí', 'Weather')];
  }
  const zdroj = panel.querySelector('.prehled-pocasi-zdroj');
  const klic = 'czu-events-05.pocasi-v1';
  function platne(data) {
    return data && Number.isFinite(data.temperature_2m) && Number.isFinite(data.weather_code)
      && Number.isFinite(data.time) && Math.abs(Date.now() / 1000 - data.time) < 3600;
  }
  function zobraz(data) {
    const stav = popisPocasi(data.weather_code, data.is_day);
    ikona.textContent = stav[0];
    pocasi.textContent = 'Suchdol · ' + new Intl.NumberFormat(CZUJazyk.locale, { maximumFractionDigits: 0 })
      .format(data.temperature_2m) + ' °C · ' + stav[1];
    zdroj.title = text('Modelová data Open-Meteo, čas ', 'Open-Meteo model data, time ') +
      new Intl.DateTimeFormat(CZUJazyk.locale, { timeZone: 'Europe/Prague', hour: '2-digit', minute: '2-digit' })
        .format(new Date(data.time * 1000));
  }
  async function aktualizujPocasi() {
    try {
      const ulozene = JSON.parse(sessionStorage.getItem(klic));
      if (ulozene && Date.now() - ulozene.ulozeno >= 0 && Date.now() - ulozene.ulozeno < 600000 && platne(ulozene.data)) {
        zobraz(ulozene.data);
        return;
      }
    } catch (chyba) { /* Bez úložiště se načtou aktuální data přímo. */ }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    try {
      const odpoved = await fetch('https://api.open-meteo.com/v1/forecast?latitude=50.129&longitude=14.373&current=temperature_2m,weather_code,is_day&timezone=Europe%2FPrague&timeformat=unixtime&forecast_days=1', {
        signal: controller.signal, credentials: 'omit', referrerPolicy: 'no-referrer'
      });
      if (!odpoved.ok) throw new Error('Pocasi');
      const data = await odpoved.json();
      if (!platne(data.current) || !data.current_units || data.current_units.temperature_2m !== '°C') throw new Error('Data');
      zobraz(data.current);
      try { sessionStorage.setItem(klic, JSON.stringify({ ulozeno: Date.now(), data: data.current })); } catch (chyba) { /* Volitelné úložiště. */ }
    } catch (chyba) {
      ikona.textContent = '☁';
      pocasi.textContent = text('Suchdol · počasí není dostupné', 'Suchdol · weather unavailable');
      zdroj.title = text('Zdroj počasí: Open-Meteo', 'Weather source: Open-Meteo');
    } finally { clearTimeout(timeout); }
  }
  aktualizujDatum();
  aktualizujPocasi();
  setInterval(aktualizujDatum, 30000);
  setInterval(aktualizujPocasi, 900000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { aktualizujDatum(); aktualizujPocasi(); }
  });
})();
