/* Māmā — la météo des prix. Application sans dépendance ni étape de build.
   1. Les données viennent de data/prix.json (voir charger()).
   2. Chaque écran est une fonction vueXxx() qui renvoie du HTML.
   3. Le routeur lit l'ancre de l'URL (#/, #/communes, #/produit/<id>…). */
(function () {
  'use strict';

  var SOURCE = 'prix.json'; // à remplacer par l'URL d'une API quand il y en aura une
  var vue = document.getElementById('vue');
  var boutonMaj = document.getElementById('maj');

  var etat = {
    donnees: null,
    commune: lire('commune', 'punaauia'),
    ile: 'Tahiti',
    panier: lire('panier', []),
    signalements: lire('signalements', [])
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

  function pct(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + ' %'; }

  /* La règle météo : une variation du prix sur 7 jours devient un temps qu'il fait. */
  function meteo(variation) {
    if (variation <= -2) return { cle: 'beau', label: 'Grand beau', titre: 'Grand beau<br>sur les prix', bulle: 'Mea māmā !' };
    if (variation < 2) return { cle: 'variable', label: 'Variable', titre: 'Temps variable<br>sur les prix', bulle: 'À surveiller' };
    return { cle: 'hausse', label: 'Avis de hausse', titre: 'Avis de hausse<br>sur les prix', bulle: 'Aita māmā…' };
  }

  function moinsCher(produit) {
    return produit.magasins.slice().sort(function (a, b) { return a.prix - b.prix; })[0];
  }

  function plusCher(produit) {
    return produit.magasins.slice().sort(function (a, b) { return b.prix - a.prix; })[0];
  }

  function trouver(liste, id) {
    return liste.filter(function (x) { return x.id === id; })[0];
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
        // Hors ligne, ou page ouverte en double-cliquant sur index.html :
        // on garde les derniers prix connus, sinon la copie de secours.
        enLigne = false;
        etat.donnees = etat.donnees || window.MAMA_SECOURS || null;
      })
      .then(function () {
        // Laisse l'animation tourner au moins un instant, pour qu'on la voie.
        var reste = manuel ? Math.max(0, 700 - (Date.now() - debut)) : 0;
        return new Promise(function (ok) { setTimeout(ok, reste); });
      })
      .then(function () {
        boutonMaj.classList.remove('en-cours');
        boutonMaj.disabled = false;
        afficher();
        if (manuel) {
          var heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          toast(enLigne ? 'Prix mis à jour à ' + heure : 'Hors ligne : derniers prix connus');
        }
      });
  }

  /* ---------- Écrans ---------- */

  function vueMeteo() {
    var d = etat.donnees;
    var commune = trouver(d.communes, etat.commune) || d.communes[0];
    var m = meteo(commune.variation);

    var options = d.communes.map(function (c) {
      return '<option value="' + esc(c.id) + '"' + (c.id === commune.id ? ' selected' : '') + '>' + esc(c.nom) + '</option>';
    }).join('');

    var tries = d.produits.slice().sort(function (a, b) { return a.variation - b.variation; });
    var bulletin = [tries[0], tries[Math.floor(tries.length / 2)], tries[tries.length - 1]];

    var tuiles = bulletin.map(function (p) {
      var pm = meteo(p.variation);
      return '<a class="tuile carte fond-' + pm.cle + '" href="#/produit/' + esc(p.id) + '">' +
        Icones.meteo(pm.cle, 44) +
        '<span class="tuile-etat">' + pm.label + '</span>' +
        '<span class="tuile-nom">' + esc(p.nom) + '</span>' +
        '<span class="chiffre">' + pct(p.variation) + '</span></a>';
    }).join('');

    var plans = tries.slice(0, 3).map(function (p) {
      var m1 = moinsCher(p);
      return '<a class="ligne carte" href="#/produit/' + esc(p.id) + '">' +
        '<span class="ligne-texte"><strong>' + esc(p.nom) + ' · ' + esc(p.unite) + '</strong>' +
        '<small>' + esc(m1.nom) + ' · ' + esc(m1.lieu) + '</small></span>' +
        '<span class="pastille fond-beau">' + prix(m1.prix) + '</span></a>';
    }).join('');

    return '' +
      '<label class="choix-commune"><span>Ia ora na ! Ta commune :</span>' +
      '<select id="commune" class="bouton">' + options + '</select></label>' +

      '<section class="hero carte fond-' + m.cle + '">' +
        '<div class="hero-haut">' +
          '<div class="hero-texte">' +
            '<h1 class="titre">' + m.titre + '</h1>' +
            '<span class="bulle">' + m.bulle + '</span>' +
          '</div>' +
          '<div class="mascotte">' + Icones.meteo(m.cle, 128, true) + '</div>' +
        '</div>' +
        '<div class="niho"></div>' +
        '<div class="hero-bas">' +
          '<div><small>Panier type · 20 produits</small><div class="chiffre grand">' + prix(commune.panier) + '</div></div>' +
          '<span class="etiquette">' + pct(commune.variation) + ' en 7 jours</span>' +
        '</div>' +
      '</section>' +

      '<h2>Le bulletin du jour</h2>' +
      '<div class="tuiles">' + tuiles + '</div>' +

      '<div class="rang"><h2>Bons plans</h2><a href="#/communes">Voir les communes</a></div>' +
      '<div class="liste">' + plans + '</div>';
  }

  function vueCommunes() {
    var d = etat.donnees;
    var iles = [];
    d.communes.forEach(function (c) { if (iles.indexOf(c.ile) < 0) iles.push(c.ile); });

    var puces = iles.map(function (ile) {
      return '<button type="button" class="bouton puce' + (ile === etat.ile ? ' active' : '') +
        '" data-ile="' + esc(ile) + '" aria-pressed="' + (ile === etat.ile) + '">' + esc(ile) + '</button>';
    }).join('');

    var lignes = d.communes
      .filter(function (c) { return c.ile === etat.ile; })
      .sort(function (a, b) { return a.variation - b.variation; })
      .map(function (c) {
        var m = meteo(c.variation);
        return '<button type="button" class="ligne carte fond-' + m.cle + '" data-commune="' + esc(c.id) + '">' +
          Icones.meteo(m.cle, 46) +
          '<span class="ligne-texte"><strong>' + esc(c.nom) + '</strong>' +
          '<small>' + m.label + ' · panier ' + prix(c.panier) + '</small></span>' +
          '<span class="chiffre">' + pct(c.variation) + '</span></button>';
      }).join('');

    return '' +
      '<div class="rang haut">' +
        '<div><small class="surtitre">Te mau \'oire · les communes</small>' +
        '<h1 class="titre">Où fait-il beau<br>sur le caddie ?</h1></div>' +
        Icones.tiare(84, 'danse') +
      '</div>' +
      '<div class="puces">' + puces + '</div>' +
      '<div class="niho"></div>' +
      '<div class="liste">' + lignes + '</div>' +
      '<p class="note">Évolution du panier type sur 7 jours. Touche une commune pour voir sa météo.</p>';
  }

  function vueProduit(id) {
    var p = trouver(etat.donnees.produits, id);
    if (!p) return vueIntrouvable();
    var m = meteo(p.variation);
    var m1 = moinsCher(p);
    var max = plusCher(p).prix;

    var magasins = p.magasins.slice().sort(function (a, b) { return a.prix - b.prix; }).map(function (s, i) {
      var ecart = s.prix - m1.prix;
      var ton = i === 0 ? 'beau' : (s.prix === max ? 'hausse' : 'variable');
      return '<div class="magasin carte">' +
        '<div class="rang"><strong>' + esc(s.nom) + ' · ' + esc(s.lieu) + '</strong><span class="chiffre">' + prix(s.prix) + '</span></div>' +
        '<div class="jauge"><div class="jauge-barre plein-' + ton + '" style="width:' + Math.round(s.prix / max * 100) + '%"></div></div>' +
        '<small>' + (ecart === 0 ? 'Le moins cher' : '+' + prix(ecart)) + ' · relevé ' + esc(s.releve) + '</small></div>';
    }).join('');

    var t = p.tendance;
    var tMin = Math.min.apply(null, t);
    var tMax = Math.max.apply(null, t);
    var moyenne = t.reduce(function (a, b) { return a + b; }, 0) / t.length;
    var barres = t.map(function (v, i) {
      var h = tMax === tMin ? 70 : 40 + Math.round((v - tMin) / (tMax - tMin) * 60);
      var ton = v > moyenne * 1.01 ? 'hausse' : (v < moyenne * 0.990 ? 'beau' : 'variable');
      return '<div class="barre plein-' + ton + '" style="height:' + h + '%; animation-delay:' + (i * 60) + 'ms" title="' + prix(v) + '"></div>';
    }).join('');

    return '' +
      '<div class="rang">' +
        '<a class="bouton rond" href="#/" aria-label="Retour à la météo du jour">' +
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg></a>' +
        '<span class="pastille bord fond-' + m.cle + '">' + m.label + ' · ' + pct(p.variation) + '</span>' +
      '</div>' +
      '<div class="rang haut">' +
        '<div><h1 class="titre moyen">' + esc(p.nom) + ' · ' + esc(p.unite) + '</h1>' +
        '<span class="etiquette prix-geant">' + prix(m1.prix) + '</span>' +
        '<p class="note">au moins cher, chez ' + esc(m1.nom) + '</p></div>' +
        '<div class="mascotte">' + Icones.meteo(m.cle, 96, true) + '</div>' +
      '</div>' +
      '<div class="niho"></div>' +
      '<h2>Où l\'acheter aujourd\'hui</h2>' +
      '<div class="liste">' + magasins + '</div>' +
      '<h2>Tendance 7 jours</h2>' +
      '<div class="barres">' + barres + '</div>' +
      '<a class="bouton cta" href="#/signaler/' + esc(p.id) + '">Signaler un prix</a>';
  }

  function vuePanier() {
    var produits = etat.donnees.produits;
    var total = 0, totalCher = 0;

    var lignes = produits.map(function (p) {
      var coche = etat.panier.indexOf(p.id) >= 0;
      if (coche) { total += moinsCher(p).prix; totalCher += plusCher(p).prix; }
      return '<label class="ligne carte' + (coche ? ' fond-beau' : '') + '">' +
        '<input type="checkbox" data-panier="' + esc(p.id) + '"' + (coche ? ' checked' : '') + '>' +
        '<span class="ligne-texte"><strong>' + esc(p.nom) + '</strong><small>' + esc(p.unite) + ' · ' + esc(moinsCher(p).nom) + '</small></span>' +
        '<span class="chiffre">' + prix(moinsCher(p).prix) + '</span></label>';
    }).join('');

    return '' +
      '<div class="rang haut"><div><small class="surtitre">Tā\'u \'ete · mon panier</small>' +
      '<h1 class="titre">Mon panier<br>au meilleur prix</h1></div>' + Icones.tiare(84, 'danse') + '</div>' +
      '<section class="total carte fond-variable">' +
        '<div><small>' + etat.panier.length + ' produit(s) cochés</small><div class="chiffre grand">' + prix(total) + '</div></div>' +
        '<span class="etiquette">' + (totalCher > total ? prix(totalCher - total) + ' d\'économie' : 'Coche tes produits') + '</span>' +
      '</section>' +
      '<div class="liste">' + lignes + '</div>' +
      '<p class="note">Total calculé au magasin le moins cher pour chaque produit.</p>';
  }

  function vueSignaler(id) {
    var options = etat.donnees.produits.map(function (p) {
      return '<option value="' + esc(p.id) + '"' + (p.id === id ? ' selected' : '') + '>' + esc(p.nom) + ' · ' + esc(p.unite) + '</option>';
    }).join('');

    var mes = etat.signalements.slice().reverse().map(function (s) {
      var p = trouver(etat.donnees.produits, s.produit);
      return '<div class="ligne carte"><span class="ligne-texte"><strong>' + esc(p ? p.nom : s.produit) + '</strong>' +
        '<small>' + esc(s.magasin) + ' · ' + esc(s.date) + '</small></span><span class="chiffre">' + prix(s.prix) + '</span></div>';
    }).join('');

    return '' +
      '<div class="rang haut"><div><small class="surtitre">Māuruuru !</small>' +
      '<h1 class="titre">Signaler<br>un prix</h1></div>' + Icones.tiare(84, 'danse') + '</div>' +
      '<form id="formulaire" class="formulaire carte">' +
        '<label for="s-produit">Produit</label><select id="s-produit" name="produit" class="bouton">' + options + '</select>' +
        '<label for="s-magasin">Magasin</label><input id="s-magasin" name="magasin" class="bouton" required maxlength="60" placeholder="Nom du magasin, commune">' +
        '<label for="s-prix">Prix vu en rayon (F)</label><input id="s-prix" name="prix" class="bouton" type="number" inputmode="numeric" min="1" max="999999" required placeholder="1190">' +
        '<button class="bouton cta" type="submit">Envoyer mon relevé</button>' +
      '</form>' +
      '<h2>Mes relevés</h2>' +
      '<div class="liste">' + (mes || '<p class="note">Aucun relevé pour l\'instant. Le premier est pour toi !</p>') + '</div>' +
      '<p class="note">Dans cette version de démonstration, les relevés restent sur ton téléphone.</p>';
  }

  function vueIntrouvable() {
    return '<div class="vide">' + Icones.nuage(120) + '<h1 class="titre moyen">Page introuvable</h1>' +
      '<a class="bouton cta" href="#/">Retour à la météo</a></div>';
  }

  function vueErreur() {
    return '<div class="vide">' + Icones.orage(120) + '<h1 class="titre moyen">Pas de prix pour l\'instant</h1>' +
      '<p class="note">Impossible de lire ' + esc(SOURCE) + '. Vérifie ta connexion puis touche « Mise à jour ».</p></div>';
  }

  /* ---------- Routeur ---------- */

  function afficher() {
    var morceaux = (location.hash.replace(/^#\/?/, '') || 'meteo').split('/');
    var route = morceaux[0];
    var param = decodeURIComponent(morceaux[1] || '');
    var html;

    if (!etat.donnees) html = vueErreur();
    else if (route === 'meteo') html = vueMeteo();
    else if (route === 'communes') html = vueCommunes();
    else if (route === 'produit') html = vueProduit(param);
    else if (route === 'panier') html = vuePanier();
    else if (route === 'signaler') html = vueSignaler(param);
    else html = vueIntrouvable();

    vue.innerHTML = html;

    var onglet = route === 'produit' ? 'meteo' : route;
    Array.prototype.forEach.call(document.querySelectorAll('.onglets a'), function (a) {
      if (a.getAttribute('data-onglet') === onglet) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    var date = document.getElementById('maj-date');
    if (etat.donnees && etat.donnees.maj) {
      date.textContent = 'Prix relevés le ' + new Date(etat.donnees.maj).toLocaleString('fr-FR', {
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
      });
    } else {
      date.textContent = '';
    }
  }

  /* ---------- Événements ---------- */

  window.addEventListener('hashchange', function () {
    afficher();
    window.scrollTo(0, 0);
    vue.focus({ preventScroll: true });
  });

  boutonMaj.addEventListener('click', function () { charger(true); });

  vue.addEventListener('change', function (e) {
    if (e.target.id === 'commune') {
      etat.commune = e.target.value;
      ecrire('commune', etat.commune);
      afficher();
    }
    var idPanier = e.target.getAttribute('data-panier');
    if (idPanier) {
      var i = etat.panier.indexOf(idPanier);
      if (i >= 0) etat.panier.splice(i, 1); else etat.panier.push(idPanier);
      ecrire('panier', etat.panier);
      afficher();
    }
  });

  vue.addEventListener('click', function (e) {
    var ile = e.target.closest('[data-ile]');
    if (ile) { etat.ile = ile.getAttribute('data-ile'); afficher(); return; }

    var commune = e.target.closest('[data-commune]');
    if (commune) {
      etat.commune = commune.getAttribute('data-commune');
      ecrire('commune', etat.commune);
      location.hash = '#/';
    }
  });

  vue.addEventListener('submit', function (e) {
    if (e.target.id !== 'formulaire') return;
    e.preventDefault();
    var f = e.target;
    var valeur = Math.round(Number(f.prix.value));
    if (!f.magasin.value.trim() || !(valeur > 0)) return;
    etat.signalements.push({
      produit: f.produit.value,
      magasin: f.magasin.value.trim(),
      prix: valeur,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
    });
    ecrire('signalements', etat.signalements);
    afficher();
    toast('Māuruuru ! Relevé enregistré');
  });

  /* ---------- Démarrage ---------- */

  document.getElementById('logo-tiare').innerHTML = Icones.tiare(40, 'danse');
  charger(false);
})();
