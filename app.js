/* Māmā — les promos du fenua. Application sans dépendance ni étape de build.

   Côté public : la liste des promotions et des commerces.
   Côté commerçant : connexion, puis gestion de ses promotions (4 au maximum).

   ATTENTION — VERSION DE DÉMONSTRATION
   La connexion et l'enregistrement des promotions sont simulés dans le
   navigateur. Un vrai mot de passe ne se vérifie jamais dans le code d'une
   page web : il faut un serveur. Voir README.md, « Passer à la vraie version ». */
(function () {
  'use strict';

  var SOURCE = 'promos.json';   // à remplacer par l'adresse du serveur
  var MAX_PROMOS = 4;           // nombre de promotions par commerce
  var MOT_DE_PASSE_DEMO = 'demo';
  // Secteurs d'activité : chaque commerce en choisit un à l'inscription.
  var SECTEURS = [
    'Alimentation', 'Maison et bricolage', 'Auto, moto et vélo', 'Sport et loisirs',
    'Mode et beauté', 'High-tech et électroménager', 'Restaurants et snacks', 'Services'
  ];

  var vue = document.getElementById('vue');
  var boutonMaj = document.getElementById('maj');

  var etat = {
    donnees: null,
    commune: 'toutes',
    secteur: 'tous',
    session: lire('session', null),      // identifiant du commerce connecté
    ajoutees: lire('ajoutees', []),      // promos créées dans la démo
    retirees: lire('retirees', []),      // identifiants des promos retirées dans la démo
    erreur: ''
  };

  /* ---------- Outils ---------- */

  function lire(cle, defaut) {
    try {
      var v = localStorage.getItem('mama.' + cle);
      return v ? JSON.parse(v) : defaut;
    } catch (e) { return defaut; }
  }

  function ecrire(cle, valeur) {
    try { localStorage.setItem('mama.' + cle, JSON.stringify(valeur)); } catch (e) { /* stockage indisponible */ }
  }

  function esc(texte) {
    return String(texte).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function prix(n) { return Number(n).toLocaleString('fr-FR') + ' F'; }

  function aujourdhui() {
    var d = new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function dateLisible(iso) {
    var p = String(iso).split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  }

  function remise(p) { return Math.round((1 - p.prixPromo / p.prixNormal) * 100); }

  function commerce(id) {
    return etat.donnees.commerces.filter(function (c) { return c.id === id; })[0];
  }

  function abonnementActif(c) { return !!c && c.abonnement >= aujourdhui(); }

  /* Toutes les promos connues : celles du fichier, moins les retirées, plus les ajoutées. */
  function toutesLesPromos() {
    return etat.donnees.promos
      .filter(function (p) { return etat.retirees.indexOf(p.id) < 0; })
      .concat(etat.ajoutees);
  }

  function promosDuCommerce(id) {
    return toutesLesPromos().filter(function (p) { return p.commerce === id && p.fin >= aujourdhui(); });
  }

  /* Ce que le public voit : promos en cours, de commerces dont l'abonnement est à jour. */
  function promosVisibles() {
    return toutesLesPromos()
      .filter(function (p) { return p.fin >= aujourdhui() && abonnementActif(commerce(p.commerce)); })
      .sort(function (a, b) { return remise(b) - remise(a); });
  }

  function toast(message) {
    var t = document.getElementById('toast');
    t.textContent = message;
    t.classList.add('visible');
    clearTimeout(toast.minuteur);
    toast.minuteur = setTimeout(function () { t.classList.remove('visible'); }, 2600);
  }

  /* ---------- Données et bouton « Mise à jour » ---------- */

  function charger(manuel) {
    boutonMaj.classList.add('en-cours');
    boutonMaj.disabled = true;
    var debut = Date.now();
    var enLigne = true;

    return fetch(SOURCE + '?t=' + debut, { cache: 'no-store' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (donnees) { etat.donnees = donnees; })
      .catch(function () {
        enLigne = false;
        etat.donnees = etat.donnees || window.MAMA_SECOURS || null;
      })
      .then(function () {
        var reste = manuel ? Math.max(0, 700 - (Date.now() - debut)) : 0;
        return new Promise(function (ok) { setTimeout(ok, reste); });
      })
      .then(function () {
        boutonMaj.classList.remove('en-cours');
        boutonMaj.disabled = false;
        afficher();
        if (manuel) {
          var heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          toast(enLigne ? 'Promos mises à jour à ' + heure : 'Hors ligne : dernières promos connues');
        }
      });
  }

  /* ---------- Briques d'affichage ---------- */

  function cartePromo(p, avecCommerce) {
    var c = commerce(p.commerce);
    var r = remise(p);
    var ligne = avecCommerce && c ? '<small>' + esc(c.nom) + ' · ' + esc(c.commune) + '</small>' : '';
    return '<a class="promo carte" href="#/commerce/' + esc(p.commerce) + '">' +
      '<span class="remise' + (r >= 30 ? ' forte' : '') + '">−' + r + ' %</span>' +
      '<span class="promo-texte"><strong>' + esc(p.produit) + '</strong>' +
      ligne + '<small>jusqu\'au ' + dateLisible(p.fin) + '</small></span>' +
      '<span class="promo-prix"><del>' + prix(p.prixNormal) + '</del><span class="chiffre">' + prix(p.prixPromo) + '</span></span></a>';
  }

  function vide(dessin, titre, texte) {
    return '<div class="vide">' + dessin + '<h2>' + titre + '</h2><p class="note">' + texte + '</p></div>';
  }

  /* ---------- Écrans publics ---------- */

  function vuePromos() {
    var visibles = promosVisibles();

    var communes = [];
    etat.donnees.commerces.forEach(function (c) {
      if (abonnementActif(c) && communes.indexOf(c.commune) < 0) communes.push(c.commune);
    });
    communes.sort();

    var options = '<option value="toutes">Toutes les communes</option>' + communes.map(function (n) {
      return '<option value="' + esc(n) + '"' + (n === etat.commune ? ' selected' : '') + '>' + esc(n) + '</option>';
    }).join('');

    // On ne propose que les secteurs qui ont au moins une promo en cours.
    var secteurs = SECTEURS.filter(function (s) {
      return visibles.some(function (p) { return commerce(p.commerce).secteur === s; });
    });
    if (secteurs.indexOf(etat.secteur) < 0) etat.secteur = 'tous';

    var puces = ['tous'].concat(secteurs).map(function (s) {
      var actif = s === etat.secteur;
      return '<button type="button" class="bouton puce' + (actif ? ' active' : '') + '" data-secteur="' + esc(s) +
        '" aria-pressed="' + actif + '">' + (s === 'tous' ? 'Tout' : esc(s)) + '</button>';
    }).join('');

    var filtrees = visibles.filter(function (p) {
      var c = commerce(p.commerce);
      return (etat.commune === 'toutes' || c.commune === etat.commune) &&
             (etat.secteur === 'tous' || c.secteur === etat.secteur);
    });

    var meilleure = visibles[0];
    var liste = filtrees.length
      ? filtrees.map(function (p) { return cartePromo(p, true); }).join('')
      : vide(Icones.nuage(110), 'Pas de promo ici pour l\'instant', 'Essaie une autre commune ou un autre secteur.');

    return '' +
      '<section class="hero carte fond-beau">' +
        '<div class="hero-haut">' +
          '<div class="hero-texte">' +
            '<small class="surtitre">Ia ora na !</small>' +
            '<h1 class="titre">' + visibles.length + ' promos<br>au fenua</h1>' +
            '<span class="bulle">Mea māmā !</span>' +
          '</div>' +
          '<div class="mascotte">' + Icones.soleil(128, true) + '</div>' +
        '</div>' +
        '<div class="niho"></div>' +
        '<div class="hero-bas">' +
          (meilleure
            ? '<div><small>La plus forte remise</small><div class="chiffre">' + esc(meilleure.produit) + '</div></div>' +
              '<span class="etiquette">−' + remise(meilleure) + ' %</span>'
            : '<div><small>Aucune promo en cours</small></div>') +
        '</div>' +
      '</section>' +

      '<div class="filtres">' +
        '<label class="surtitre" for="commune">Où cherches-tu ?</label>' +
        '<select id="commune" class="bouton">' + options + '</select>' +
        '<div class="puces">' + puces + '</div>' +
      '</div>' +

      '<div class="liste">' + liste + '</div>';
  }

  function vueCommerces() {
    var lignes = etat.donnees.commerces
      .filter(abonnementActif)
      .sort(function (a, b) { return a.nom.localeCompare(b.nom, 'fr'); })
      .map(function (c) {
        var n = promosDuCommerce(c.id).length;
        return '<a class="ligne carte" href="#/commerce/' + esc(c.id) + '">' +
          '<span class="ligne-texte"><strong>' + esc(c.nom) + '</strong><small>' + esc(c.secteur) + ' · ' + esc(c.commune) + '</small></span>' +
          '<span class="pastille ' + (n ? 'fond-beau' : 'fond-variable') + '">' + n + ' promo' + (n > 1 ? 's' : '') + '</span></a>';
      }).join('');

    return '' +
      '<div class="rang haut"><div><small class="surtitre">Te mau fare toa · les commerces</small>' +
      '<h1 class="titre">Les commerces<br>partenaires</h1></div>' + Icones.tiare(84, 'danse') + '</div>' +
      '<div class="niho"></div><div style="height:16px"></div>' +
      '<div class="liste">' + lignes + '</div>' +
      '<p class="note">Tu tiens un commerce ? Ouvre l\'onglet « Mon commerce » pour publier tes promos.</p>';
  }

  function vueCommerce(id) {
    var c = commerce(id);
    if (!c || !abonnementActif(c)) return vueIntrouvable();
    var promos = promosDuCommerce(id).sort(function (a, b) { return remise(b) - remise(a); });

    return '' +
      '<div class="rang">' +
        '<a class="bouton rond" href="#/commerces" aria-label="Retour aux commerces">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg></a>' +
        '<span class="pastille bord fond-beau">' + esc(c.secteur) + '</span>' +
      '</div>' +
      '<div class="rang haut"><div><h1 class="titre">' + esc(c.nom) + '</h1>' +
      '<p class="note">' + esc(c.commune) + ' · ' + esc(c.adresse) + '<br>Tél. <a href="tel:' + esc(c.tel.replace(/\s/g, '')) + '">' + esc(c.tel) + '</a></p></div>' +
      Icones.tiare(72, 'danse') + '</div>' +
      '<div class="niho"></div>' +
      '<h2>Ses promos du moment</h2>' +
      '<div class="liste">' + (promos.length
        ? promos.map(function (p) { return cartePromo(p, false); }).join('')
        : vide(Icones.nuage(110), 'Pas de promo en ce moment', 'Reviens bientôt !')) + '</div>';
  }

  /* ---------- Espace commerçant ---------- */

  function vueConnexion() {
    var comptes = etat.donnees.commerces.map(function (c) { return '<code>' + esc(c.id) + '</code>'; }).join(', ');
    return '' +
      '<div class="rang haut"><div><small class="surtitre">Espace commerçant</small>' +
      '<h1 class="titre">Mon<br>commerce</h1></div>' + Icones.tiare(84, 'danse') + '</div>' +
      '<form id="connexion" class="formulaire carte" novalidate>' +
        '<label for="c-id">Identifiant</label>' +
        '<input id="c-id" name="identifiant" class="bouton" autocomplete="username" autocapitalize="none" required>' +
        '<label for="c-mdp">Mot de passe</label>' +
        '<input id="c-mdp" name="motdepasse" class="bouton" type="password" autocomplete="current-password" required>' +
        '<p class="erreur" role="alert">' + esc(etat.erreur) + '</p>' +
        '<button class="bouton cta" type="submit">Se connecter</button>' +
      '</form>' +
      '<div class="demo"><strong>Démonstration.</strong> Identifiants : ' + comptes +
      '. Mot de passe : <code>' + MOT_DE_PASSE_DEMO + '</code>. Ce n\'est pas une vraie protection : la vraie version vérifiera le mot de passe sur un serveur.</div>';
  }

  function vueTableau() {
    var c = commerce(etat.session);
    if (!c) { etat.session = null; ecrire('session', null); return vueConnexion(); }

    var actif = abonnementActif(c);
    var promos = promosDuCommerce(c.id);
    var plein = promos.length >= MAX_PROMOS;
    var bloque = !actif || plein;

    var lignes = promos.map(function (p) {
      return '<div class="ligne carte">' +
        '<span class="ligne-texte"><strong>' + esc(p.produit) + '</strong>' +
        '<small>' + prix(p.prixPromo) + ' au lieu de ' + prix(p.prixNormal) + ' · jusqu\'au ' + dateLisible(p.fin) + '</small></span>' +
        '<button type="button" class="bouton retirer" data-retirer="' + esc(p.id) + '">Retirer</button></div>';
    }).join('');

    var message = !actif
      ? 'Ton abonnement est terminé : tes promos ne sont plus affichées. Renouvelle-le pour publier à nouveau.'
      : (plein ? 'Tu as atteint la limite de ' + MAX_PROMOS + ' promos. Retires-en une pour en publier une autre.' : '');

    return '' +
      '<div class="rang haut"><div><small class="surtitre">Espace commerçant</small>' +
      '<h1 class="titre moyen">' + esc(c.nom) + '</h1><p class="note">' + esc(c.secteur) + ' · ' + esc(c.commune) + '</p></div>' +
      '<div class="mascotte">' + (actif ? Icones.soleil(88, true) : Icones.orage(88)) + '</div></div>' +

      '<section class="total carte ' + (actif ? 'fond-beau' : 'fond-hausse') + '">' +
        '<div><small>' + (actif ? 'Abonnement actif jusqu\'au' : 'Abonnement terminé le') + '</small>' +
        '<div class="chiffre">' + dateLisible(c.abonnement) + '</div></div>' +
        '<span class="etiquette"><span class="compteur">' + promos.length + ' / ' + MAX_PROMOS + '</span> promos</span>' +
      '</section>' +

      '<h2>Mes promos en ligne</h2>' +
      '<div class="liste">' + (lignes || '<p class="note">Aucune promo publiée pour l\'instant.</p>') + '</div>' +

      '<h2>Publier une promo</h2>' +
      '<form id="ajout" class="formulaire carte" novalidate>' +
        (message ? '<p class="erreur">' + esc(message) + '</p>' : '') +
        '<fieldset' + (bloque ? ' disabled' : '') + '>' +
          '<label for="a-produit">Produit</label>' +
          '<input id="a-produit" name="produit" class="bouton" maxlength="60" required placeholder="Nom du produit ou du service">' +
          '<div class="deux">' +
            '<div><label for="a-normal">Prix normal (F)</label><input id="a-normal" name="prixNormal" class="bouton" type="number" inputmode="numeric" min="1" max="999999" required></div>' +
            '<div><label for="a-promo">Prix promo (F)</label><input id="a-promo" name="prixPromo" class="bouton" type="number" inputmode="numeric" min="1" max="999999" required></div>' +
          '</div>' +
          '<label for="a-fin">Dernier jour de la promo</label>' +
          '<input id="a-fin" name="fin" class="bouton" type="date" min="' + aujourdhui() + '" required>' +
          '<p class="erreur" role="alert">' + (bloque ? '' : esc(etat.erreur)) + '</p>' +
          '<button class="bouton cta" type="submit">Publier la promo</button>' +
        '</fieldset>' +
      '</form>' +
      '<button type="button" class="lien-bouton" data-deconnexion="1">Se déconnecter</button>' +
      '<div class="demo"><strong>Démonstration.</strong> Les promos publiées ici restent sur cet appareil. Dans la vraie version, elles seront envoyées au serveur et visibles par tout le monde.</div>';
  }

  function vueIntrouvable() {
    return '<div class="vide">' + Icones.nuage(120) + '<h1 class="titre moyen">Page introuvable</h1>' +
      '<a class="bouton cta" href="#/">Retour aux promos</a></div>';
  }

  function vueErreur() {
    return '<div class="vide">' + Icones.orage(120) + '<h1 class="titre moyen">Pas de promos pour l\'instant</h1>' +
      '<p class="note">Impossible de lire ' + esc(SOURCE) + '. Vérifie ta connexion puis touche « Mise à jour ».</p></div>';
  }

  /* ---------- Routeur ---------- */

  function afficher() {
    var morceaux = (location.hash.replace(/^#\/?/, '') || 'promos').split('/');
    var route = morceaux[0];
    var param = decodeURIComponent(morceaux[1] || '');
    var html;

    if (!etat.donnees) html = vueErreur();
    else if (route === 'promos') html = vuePromos();
    else if (route === 'commerces') html = vueCommerces();
    else if (route === 'commerce') html = vueCommerce(param);
    else if (route === 'espace') html = etat.session ? vueTableau() : vueConnexion();
    else html = vueIntrouvable();

    vue.innerHTML = html;
    etat.erreur = '';

    var onglet = route === 'commerce' ? 'commerces' : route;
    Array.prototype.forEach.call(document.querySelectorAll('.onglets a'), function (a) {
      if (a.getAttribute('data-onglet') === onglet) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var date = document.getElementById('maj-date');
    date.textContent = etat.donnees && etat.donnees.maj
      ? 'Promos à jour au ' + new Date(etat.donnees.maj).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
      : '';
  }

  /* ---------- Événements ---------- */

  window.addEventListener('hashchange', function () {
    afficher();
    window.scrollTo(0, 0);
    vue.focus({ preventScroll: true });
  });

  boutonMaj.addEventListener('click', function () { charger(true); });

  vue.addEventListener('change', function (e) {
    if (e.target.id === 'commune') { etat.commune = e.target.value; afficher(); }
  });

  vue.addEventListener('click', function (e) {
    var secteur = e.target.closest('[data-secteur]');
    if (secteur) { etat.secteur = secteur.getAttribute('data-secteur'); afficher(); return; }

    var retirer = e.target.closest('[data-retirer]');
    if (retirer) {
      var id = retirer.getAttribute('data-retirer');
      var avant = etat.ajoutees.length;
      etat.ajoutees = etat.ajoutees.filter(function (p) { return p.id !== id; });
      if (etat.ajoutees.length === avant) etat.retirees.push(id);
      ecrire('ajoutees', etat.ajoutees);
      ecrire('retirees', etat.retirees);
      afficher();
      toast('Promo retirée');
      return;
    }

    if (e.target.closest('[data-deconnexion]')) {
      etat.session = null;
      ecrire('session', null);
      afficher();
      toast('À bientôt !');
    }
  });

  vue.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;

    if (f.id === 'connexion') {
      var id = f.identifiant.value.trim().toLowerCase();
      // DÉMO : dans la vraie version, cette vérification se fait sur le serveur.
      if (commerce(id) && f.motdepasse.value === MOT_DE_PASSE_DEMO) {
        etat.session = id;
        ecrire('session', id);
        afficher();
        toast('Ia ora na, ' + commerce(id).nom + ' !');
      } else {
        etat.erreur = 'Identifiant ou mot de passe incorrect.';
        afficher();
      }
      return;
    }

    if (f.id === 'ajout') {
      var c = commerce(etat.session);
      var produit = f.produit.value.trim();
      var normal = Math.round(Number(f.prixNormal.value));
      var promo = Math.round(Number(f.prixPromo.value));
      var fin = f.fin.value;

      // Les mêmes règles devront être revérifiées par le serveur.
      if (!abonnementActif(c)) etat.erreur = 'Abonnement terminé.';
      else if (promosDuCommerce(c.id).length >= MAX_PROMOS) etat.erreur = 'Limite de ' + MAX_PROMOS + ' promos atteinte.';
      else if (!produit) etat.erreur = 'Indique le nom du produit.';
      else if (!(normal > 0) || !(promo > 0)) etat.erreur = 'Indique les deux prix.';
      else if (promo >= normal) etat.erreur = 'Le prix promo doit être plus bas que le prix normal.';
      else if (!fin || fin < aujourdhui()) etat.erreur = 'Choisis un dernier jour à partir d\'aujourd\'hui.';

      if (etat.erreur) {
        var zone = f.querySelector('fieldset .erreur');
        if (zone) zone.textContent = etat.erreur;
        etat.erreur = '';
        return;
      }

      etat.ajoutees.push({
        id: 'local-' + Date.now(),
        commerce: c.id,
        produit: produit,
        prixNormal: normal,
        prixPromo: promo,
        fin: fin
      });
      ecrire('ajoutees', etat.ajoutees);
      afficher();
      toast('Promo publiée !');
    }
  });

  /* ---------- Démarrage ---------- */

  document.getElementById('logo-tiare').innerHTML = Icones.tiare(40, 'danse');
  charger(false);
})();
