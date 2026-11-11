<?php
/**
 * ČZU Events – příprava na serverovou část (PHP).
 *
 * Skript vrací ukázkové akce ve formátu JSON. Čte stejný soubor
 * data/akce.json jako JavaScript, takže data mají jediný zdroj.
 *
 * Použití:
 *   api/akce.php          všechny akce
 *   api/akce.php?id=...   jedna akce podle id
 *
 * Přepnutí webu na tento skript: v souboru js/data.js změnit konstantu
 * ZDROJ_DAT z 'data/akce.json' na 'api/akce.php'.
 *
 * Další krok vývoje: místo souboru číst akce z databáze a přidat
 * ukládání přihlášení, které je zatím v LocalStorage prohlížeče.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

/**
 * Odešle odpověď ve formátu JSON a ukončí skript.
 */
function odpovez(int $stav, $data): void
{
    http_response_code($stav);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    header('Allow: GET');
    odpovez(405, ['chyba' => 'Povolena je pouze metoda GET.']);
}

$soubor = __DIR__ . '/../data/akce.json';

if (!is_readable($soubor)) {
    odpovez(500, ['chyba' => 'Soubor s daty akcí není dostupný.']);
}

$akce = json_decode((string) file_get_contents($soubor), true);

if (!is_array($akce)) {
    odpovez(500, ['chyba' => 'Soubor s daty akcí nemá platný formát JSON.']);
}

$id = isset($_GET['id']) ? (string) $_GET['id'] : '';

if ($id === '') {
    odpovez(200, $akce);
}

foreach ($akce as $polozka) {
    if (isset($polozka['id']) && $polozka['id'] === $id) {
        odpovez(200, $polozka);
    }
}

odpovez(404, ['chyba' => 'Akce s tímto id neexistuje.']);
