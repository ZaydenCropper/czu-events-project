# ČZU Events – prototyp webu (skupina č. 5)

Responzivní portál akcí na ČZU podle úvodní studie: šest typů stránek, tři role
přepínané v záhlaví, katalog s filtry a měsíčním kalendářem, detail s mapou, přihlášení studenta
a formulář pořadatele. Čisté HTML5, jedno vlastní CSS a JavaScript bez frameworku.

## Struktura

```
index.html            Úvod: hledání, kategorie, tři nejbližší akce
akce.html             Katalog akcí s filtry
detail.html           Šablona detailu: detail.html?id=...
moje-akce.html        Akce přihlášeného studenta
poradatel.html        Formulář a tabulka pořadatele
o-projektu.html       Popis projektu a kontakt
akce/                 Tři statické detaily kvůli SEO (JSON-LD, Open Graph)
css/style.css         Všechny styly, od mobilu po počítač
js/role.js            Nastaví roli před vykreslením stránky
js/data.js            Datová vrstva: JSON nebo PHP, LocalStorage
js/app.js             Přepínač role, mobilní menu, karta akce
js/uvod.js            Úvodní stránka
js/katalog.js         Filtry, hledání a měsíční kalendář
js/detail.js          Detail, přihlášení, mapa
js/moje-akce.js       Moje akce
js/poradatel.js       Formulář pořadatele
data/akce.json        Jediný zdroj ukázkových dat (10 akcí)
api/akce.php          Příprava na PHP: vrací stejná data jako akce.json
img/                  Logo ČZU, ilustrace kategorií, ikona, náhled pro sdílení
sitemap.xml, robots.txt
```

## Kalendář akcí

Kalendář lze otevřít z úvodní stránky nebo přepínačem **Kalendář** v katalogu.
Platí stejné hledání a filtry jako v seznamu. Zeleně označené datum odkazuje
na program daného dne, odkud lze otevřít detail konkrétní akce. Šipkami lze
listovat po měsících. Adresa kalendáře obsahuje zobrazený měsíc a nastavené filtry.

## Rychlé filtry a osobní kalendář

Katalog nabízí rychlé volby Dnes, Tento týden, Jen volná místa a Moje fakulta.
Výběr vlastní fakulty si prohlížeč zapamatuje. Aktivní filtry lze rušit jednotlivě.
V měsíčním kalendáři jsou na počítači uvedeny názvy, časy a volná místa.
Po výběru data se zobrazí program daného dne.

Na statických i dynamických detailech lze stáhnout soubor iCalendar (.ics).
Obsahuje název, začátek, místo, popis a odkaz na detail. Čas konce v datech
není uveden, proto jej export nedoplňuje.

## Jak si web prohlédnout na počítači

Web nejde otevřít dvojklikem na `index.html`: prohlížeč pak z bezpečnostních
důvodů nenačte soubor `data/akce.json`. Je potřeba jednoduchý lokální server.

1. Otevřete Terminál a přejděte do této složky (`cd` a cesta ke složce).
2. Spusťte jeden z příkazů:
   - `python3 -m http.server 8000`
   - `php -S localhost:8000` (běží pak i `api/akce.php`)
3. V prohlížeči otevřete `http://localhost:8000`.

Další možnost je rozšíření Live Server v editoru VS Code.

## Nahrání na KitLab

1. Nahrajte **obsah** této složky do složky skupiny 05 (ne složku samotnou).
2. Otevřete veřejnou adresu skupiny a zkontrolujte úvod, katalog a detail.
3. Otevřete `api/akce.php` – musí se zobrazit seznam akcí ve formátu JSON.
4. Soubor `kitlab_db.php` ze serveru nepřepisujte a nikam veřejně nenahrávejte.

### Adresa webu

V souborech je použita **předpokládaná** adresa
`https://ete89e.pef.czu.cz/zs2627/05/`. Až bude skutečná adresa ověřená a bude
jiná, nahraďte ji hromadně (Najít a nahradit ve všech souborech) v:

- `akce/*.html` (canonical, Open Graph, JSON-LD),
- `sitemap.xml`,
- `robots.txt`.

Všechny ostatní odkazy jsou relativní a na adrese nezávisí.

## Příprava na PHP, AJAX a API třetích stran

- **AJAX:** akce se načítají přes Fetch API v `js/data.js`, filtry překreslují
  seznam bez obnovení stránky.
- **PHP:** v `js/data.js` změňte konstantu `ZDROJ_DAT` z `'data/akce.json'`
  na `'api/akce.php'`. Web pak bere data ze serverového skriptu.
- **API třetích stran:** mapu na detailu kreslí knihovna Leaflet nad dlaždicemi
  OpenStreetMap. Knihovna se načítá z `unpkg.com` až na detailu akce. Pod mapou
  zůstává odkaz na OpenStreetMap i při výpadku knihovny nebo mapových dlaždic.

## Co je prototyp

- Role se jen přepínají, skutečné přihlašování uživatelů web nemá.
- Přihlášení na akce a akce vytvořené pořadatelem jsou v LocalStorage. Jsou
  vidět jen ve stejném prohlížeči a na stejné adrese serveru.
- Klíče v LocalStorage mají předponu `czu-events-05.`, protože všechny skupiny
  sdílí na KitLabu jednu doménu.
- Ukázkové i nově vytvořené akce používají přibližný bod areálu ČZU v Suchdole
  (50.1300, 14.3740), který je v mapě označený jako přibližný. U ověřené
  polohy v `data/akce.json` změňte souřadnice a nastavte `"presnaPoloha": true`.
- Akce jsou ukázková data, ne skutečný program univerzity.

## Kontrolní scénář

Na akci Internetové technologie (42/60), v roli student:

1. Přihlášení změní počet na 43/60.
2. Po obnovení stránky zůstává 43/60.
3. Odhlášení vrátí 42/60.
4. Totéž platí na `akce/internetove-technologie-20-11-2026.html`
   i na `detail.html?id=internetove-technologie-20-11-2026`.

## Co je a není ověřeno

Automaticky v prohlížeči Chromium (šířky 390, 768 a 1280 px) prošlo:
navigace podle role, všechny filtry a hledání, kontrolní scénář 42/60,
plná akce, Moje akce, vytvoření a úprava akce pořadatelem, mobilní menu
a filtry, připnuté tlačítko na mobilu, výstup `api/akce.php`.

Zbývá ověřit na veřejné adrese: skutečné načtení mapy, W3C validátor,
Lighthouse, WAVE a zobrazení na skutečných telefonech.
