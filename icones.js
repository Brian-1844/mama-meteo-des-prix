/* Māmā — illustrations cartoon en SVG (tiare, soleil, nuage, orage).
   Chaque fonction renvoie une chaîne SVG. Les classes (rayons, oeil, eclair…)
   sont animées dans css/style.css. */
(function () {
  'use strict';

  var ENCRE = '#1B1B3A';

  function petales() {
    return [0, 51.4, 102.9, 154.3, 205.7, 257.1, 308.6].map(function (a) {
      return '<ellipse cx="0" cy="-26" rx="10" ry="22" transform="rotate(' + a + ')"></ellipse>';
    }).join('');
  }

  function rayons() {
    return [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) {
      return '<path d="M-9 -40L0 -57L9 -40Z" transform="rotate(' + a + ')"></path>';
    }).join('');
  }

  /* Fleur de tiare : 7 pétales blancs, cœur jaune. */
  function tiare(taille, classe) {
    return '<svg class="tiare ' + (classe || '') + '" width="' + taille + '" height="' + taille +
      '" viewBox="0 0 100 100" aria-hidden="true"><g transform="translate(50 50)" fill="#FFFFFF" stroke="' + ENCRE +
      '" stroke-width="5" stroke-linejoin="round">' + petales() + '<circle r="9" fill="#FFD23F"></circle></g></svg>';
  }

  /* Soleil souriant. avecTiare = true lui met une tiare à l'oreille. */
  function soleil(taille, avecTiare) {
    var fleur = avecTiare
      ? '<g transform="translate(27 -27) scale(0.340)"><g class="fleur-oreille" fill="#FFFFFF" stroke-width="9">' +
        petales() + '<circle r="9" fill="#FF9F1C"></circle></g></g>'
      : '';
    return '<svg class="soleil" width="' + taille + '" height="' + taille + '" viewBox="0 0 120 120" aria-hidden="true">' +
      '<g transform="translate(60 60)" stroke="' + ENCRE + '" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">' +
      '<g class="rayons" fill="#FF9F1C">' + rayons() + '</g>' +
      '<circle r="36" fill="#FFD23F"></circle>' +
      '<circle class="oeil" cx="-12" cy="-4" r="4.500" fill="' + ENCRE + '" stroke="none"></circle>' +
      '<circle class="oeil" cx="12" cy="-4" r="4.500" fill="' + ENCRE + '" stroke="none"></circle>' +
      '<ellipse cx="-22" cy="8" rx="6" ry="4" fill="#FF5C8A" stroke="none"></ellipse>' +
      '<ellipse cx="22" cy="8" rx="6" ry="4" fill="#FF5C8A" stroke="none"></ellipse>' +
      '<path d="M-14 8Q0 24 14 8" fill="none"></path>' + fleur + '</g></svg>';
  }

  var CORPS_NUAGE = 'M25 66H75A17 17 0 0 0 78 32A26 26 0 0 0 28 36A15 15 0 0 0 25 66Z';

  /* Nuage neutre : temps variable. */
  function nuage(taille) {
    return '<svg class="nuage" width="' + taille + '" height="' + taille + '" viewBox="0 -10 100 100" aria-hidden="true">' +
      '<g stroke="' + ENCRE + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
      '<path d="' + CORPS_NUAGE + '" fill="#FFFFFF"></path>' +
      '<circle class="oeil" cx="42" cy="46" r="3.500" fill="' + ENCRE + '" stroke="none"></circle>' +
      '<circle class="oeil" cx="60" cy="46" r="3.500" fill="' + ENCRE + '" stroke="none"></circle>' +
      '<path d="M44 56H58" fill="none"></path></g></svg>';
  }

  /* Nuage fâché avec éclair : avis de hausse. */
  function orage(taille) {
    return '<svg class="orage" width="' + taille + '" height="' + taille + '" viewBox="0 0 100 100" aria-hidden="true">' +
      '<g stroke="' + ENCRE + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
      '<path d="' + CORPS_NUAGE + '" fill="#C9C3F2"></path>' +
      '<path d="M36 39L46 44M66 39L56 44" fill="none"></path>' +
      '<circle cx="43" cy="49" r="3.500" fill="' + ENCRE + '" stroke="none"></circle>' +
      '<circle cx="59" cy="49" r="3.500" fill="' + ENCRE + '" stroke="none"></circle>' +
      '<path class="eclair" d="M52 62L40 82H50L44 98L64 76H54L60 62Z" fill="#FFD23F"></path></g></svg>';
  }

  /* Icône selon l'état météo : 'beau' | 'variable' | 'hausse'. */
  function meteo(cle, taille, avecTiare) {
    if (cle === 'beau') return soleil(taille, avecTiare);
    if (cle === 'hausse') return orage(taille);
    return nuage(taille);
  }

  window.Icones = { tiare: tiare, soleil: soleil, nuage: nuage, orage: orage, meteo: meteo };
})();
