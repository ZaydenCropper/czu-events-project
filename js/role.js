/* Nastaví roli a jazyk na prvku <html> ještě před vykreslením stránky,
   aby navigace hned odpovídala zvolené roli a čtečka obrazovky
   i prohlížeč znaly jazyk stránky. */
(function () {
  var role = 'host';
  var jazyk = 'cs';
  try {
    var ulozena = window.localStorage.getItem('czu-events-05.role');
    if (ulozena === 'student' || ulozena === 'poradatel') {
      role = ulozena;
    }
    if (window.localStorage.getItem('czu-events-05.jazyk') === 'en') {
      jazyk = 'en';
    }
  } catch (chyba) {
    role = 'host';
    jazyk = 'cs';
  }
  document.documentElement.setAttribute('data-role', role);
  document.documentElement.setAttribute('data-jazyk', jazyk);
  document.documentElement.setAttribute('lang', jazyk);
  /* Třída js: styly mohou počítat s tím, že JavaScript běží. */
  document.documentElement.classList.add('js');
})();
