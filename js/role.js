/* Nastaví roli na prvku <html> ještě před vykreslením stránky,
   aby navigace hned odpovídala zvolené roli. */
(function () {
  var role = 'host';
  try {
    var ulozena = window.localStorage.getItem('czu-events-05.role');
    if (ulozena === 'student' || ulozena === 'poradatel') {
      role = ulozena;
    }
  } catch (chyba) {
    role = 'host';
  }
  document.documentElement.setAttribute('data-role', role);
})();
