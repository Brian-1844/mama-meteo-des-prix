/* Māmā — les promos du fenua. Version en ligne, branchée sur Firebase.

   Trois rôles :
   - le public lit les promos, sans compte ;
   - un commerce se connecte et gère ses 4 promos ;
   - l'administrateur crée les commerces, règle les abonnements, modère.

   Les contrôles faits ici (4 promos, abonnement, prix) sont là pour le confort.
   La vraie barrière, ce sont les règles de sécurité : fichier firestore.rules. */

import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail, createUserWithEmailAndPassword
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, addDoc,
  serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { firebaseConfig } from './config.js';

const MAX_PROMOS = 4;        // doit correspondre aux emplacements _1 à _4 des règles
const MAX_JOURS = 60;        // durée maximale d'une promo
const CACHE_MINUTES = 5;     // évite de relire la base à chaque ouverture
const SECTEURS = [
  'Alimentation', 'Maison et bricolage', 'Auto, moto et vélo', 'Sport et loisirs',
  'Mode et beauté', 'High-tech et électroménager', 'Restaurants et snacks', 'Services'
];
const COMMUNES = [
  'Arue', 'Faa\'a', 'Hitia\'a O Te Ra', 'Mahina', 'Paea', 'Papara', 'Papeete', 'Pirae', 'Punaauia',
  'Taiarapu-Est', 'Taiarapu-Ouest', 'Teva I Uta', 'Moorea-Maiao', 'Bora-Bora', 'Huahine', 'Taha\'a', 'Uturoa'
];
const PHOTO_COTE = 480;      // taille maximale d'une photo, en pixels
const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
const photos = new Map();    // photos déjà lues pendant cette visite
const MOTIFS = ['Prix différent en magasin', 'Produit indisponible', 'Promo terminée', 'Autre problème'];

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const Icones = window.Icones;

const vue = document.getElementById('vue');
const boutonMaj = document.getElementById('maj');

const etat = {
  commerces: null,
  promos: null,
  majLe: 0,
  horsLigne: false,
  commune: 'toutes',
  secteur: 'tous',
  authPret: false,
  utilisateur: null,
  estAdmin: false,
  signalements: []
};

/* ---------- Outils ---------- */

function esc(texte) {
  return String(texte == null ? '' : texte).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const prix = (n) => Number(n).toLocaleString('fr-FR') + ' F';
const remise = (p) => Math.round((1 - p.prixPromo / p.prixNormal) * 100);

function iso(ms) {
  const d = new Date(ms);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

function finDeJournee(texteIso) {
  const p = texteIso.split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2], 23, 59, 59);
}

const dateCourte = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
const dateLongue = (ms) => new Date(ms).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

const commerce = (id) => (etat.commerces || []).find((c) => c.id === id);
const abonnementActif = (c) => !!c && c.actif && c.abonnement > Date.now();
const enCours = (p) => p.fin > Date.now();
const promosDe = (id) => (etat.promos || []).filter((p) => p.commerce === id && enCours(p));

function promosVisibles() {
  return (etat.promos || [])
    .filter((p) => enCours(p) && abonnementActif(commerce(p.commerce)))
    .sort((a, b) => remise(b) - remise(a));
}

function toast(message) {
  const t = document.getElementById('toast');
  t.textContent = message;
  t.classList.add('visible');
  clearTimeout(toast.minuteur);
  toast.minuteur = setTimeout(() => t.classList.remove('visible'), 3000);
}

function messageErreur(e) {
  const code = (e && e.code) || '';
  if (/invalid-credential|wrong-password|user-not-found|invalid-email|invalid-login/.test(code)) return 'Adresse e-mail ou mot de passe incorrect.';
  if (/too-many-requests/.test(code)) return 'Trop de tentatives. Réessaie dans quelques minutes.';
  if (/email-already-in-use/.test(code)) return 'Un compte existe déjà avec cette adresse e-mail.';
  if (/weak-password/.test(code)) return 'Mot de passe trop court : 6 caractères au minimum.';
  if (/permission-denied/.test(code)) return 'Action refusée : droits insuffisants ou abonnement terminé.';
  if (/photo/.test(code)) return 'Impossible d\'utiliser cette photo. Essaie avec une autre image.';
  if (/network-request-failed|unavailable/.test(code)) return 'Pas de connexion. Réessaie plus tard.';
  return 'Une erreur est survenue' + (code ? ' (' + code + ')' : '') + '.';
}

/* Exécute une action liée à un bouton : le bloque pendant l'envoi, affiche l'erreur s'il y en a une. */
async function action(bouton, travail) {
  if (bouton) bouton.disabled = true;
  try {
    await travail();
  } catch (e) {
    console.error(e);
    toast(messageErreur(e));
  } finally {
    if (bouton && bouton.isConnected) bouton.disabled = false;
  }
}

/* ---------- Lecture de la base et bouton « Mise à jour » ---------- */

function lireCache() {
  try { return JSON.parse(localStorage.getItem('mama.cache') || 'null'); } catch (e) { return null; }
}

function ecrireCache() {
  try {
    localStorage.setItem('mama.cache', JSON.stringify({ t: etat.majLe, commerces: etat.commerces, promos: etat.promos }));
  } catch (e) { /* stockage indisponible */ }
}

function appliquer(cache) {
  etat.commerces = cache.commerces;
  etat.promos = cache.promos;
  etat.majLe = cache.t;
}

async function charger(forcer, manuel) {
  const cache = lireCache();
  if (!forcer && cache && Date.now() - cache.t < CACHE_MINUTES * 60000) {
    appliquer(cache);
    afficher();
    return;
  }

  boutonMaj.classList.add('en-cours');
  boutonMaj.disabled = true;
  const debut = Date.now();
  etat.horsLigne = false;

  try {
    const [c, p] = await Promise.all([getDocs(collection(db, 'commerces')), getDocs(collection(db, 'promos'))]);
    etat.commerces = c.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id, nom: x.nom || '', secteur: x.secteur || '', commune: x.commune || '',
        adresse: x.adresse || '', tel: x.tel || '', actif: x.actif === true,
        abonnement: x.abonnement ? x.abonnement.toMillis() : 0
      };
    });
    etat.promos = p.docs.map((d) => {
      const x = d.data();
      return {
        id: d.id, commerce: x.commerce, produit: x.produit || '',
        prixNormal: x.prixNormal, prixPromo: x.prixPromo, fin: x.fin ? x.fin.toMillis() : 0,
        photo: x.photo === true
      };
    });
    etat.majLe = Date.now();
    ecrireCache();
  } catch (e) {
    console.error(e);
    etat.horsLigne = true;
    if (cache) appliquer(cache);
  }

  if (manuel) await new Promise((ok) => setTimeout(ok, Math.max(0, 700 - (Date.now() - debut))));
  boutonMaj.classList.remove('en-cours');
  boutonMaj.disabled = false;
  afficher();
  if (manuel) {
    const heure = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    toast(etat.horsLigne ? 'Hors ligne : dernières promos connues' : 'Promos mises à jour à ' + heure);
  }
}

async function chargerSignalements() {
  try {
    const s = await getDocs(collection(db, 'signalements'));
    etat.signalements = s.docs.map((d) => {
      const x = d.data();
      return { id: d.id, promo: x.promo, commerce: x.commerce, produit: x.produit, motif: x.motif, cree: x.cree ? x.cree.toMillis() : 0 };
    }).sort((a, b) => b.cree - a.cree);
  } catch (e) {
    console.error(e);
    etat.signalements = [];
  }
}

/* ---------- Photos ----------
   Chaque photo est réduite sur le téléphone du commerçant, puis rangée dans
   photos/<identifiant de la promo>. Elle n'est lue que lorsqu'elle arrive à l'écran. */

async function compresser(fichier) {
  const url = URL.createObjectURL(fichier);
  try {
    const img = await new Promise((ok, ko) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ko(Object.assign(new Error('photo'), { code: 'photo-illisible' }));
      i.src = url;
    });
    const k = Math.min(1, PHOTO_COTE / Math.max(img.naturalWidth, img.naturalHeight));
    const toile = document.createElement('canvas');
    toile.width = Math.max(1, Math.round(img.naturalWidth * k));
    toile.height = Math.max(1, Math.round(img.naturalHeight * k));
    const ctx = toile.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, toile.width, toile.height);
    ctx.drawImage(img, 0, 0, toile.width, toile.height);
    let qualite = 0.72;
    let image = toile.toDataURL('image/jpeg', qualite);
    while (image.length > 120000 && qualite > 0.36) {
      qualite -= 0.12;
      image = toile.toDataURL('image/jpeg', qualite);
    }
    if (image.length > 190000 || image.indexOf('data:image/jpeg;base64,') !== 0) {
      throw Object.assign(new Error('photo'), { code: 'photo-trop-lourde' });
    }
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

const balisePhoto = (p, classe) =>
  '<img class="' + classe + '" alt="Photo : ' + esc(p.produit) + '" data-photo="' + esc(p.id) + '" src="' + PIXEL + '">';

async function lirePhoto(id) {
  if (!photos.has(id)) {
    photos.set(id, getDoc(doc(db, 'photos', id)).then((d) => (d.exists() ? d.data().image : null)).catch(() => null));
  }
  return photos.get(id);
}

const guetteur = 'IntersectionObserver' in window ? new IntersectionObserver((entrees) => {
  entrees.forEach((e) => {
    if (!e.isIntersecting) return;
    guetteur.unobserve(e.target);
    remplirPhoto(e.target);
  });
}, { rootMargin: '200px' }) : null;

async function remplirPhoto(img) {
  const image = await lirePhoto(img.getAttribute('data-photo'));
  if (image && image.indexOf('data:image/jpeg;base64,') === 0) img.src = image;
  else img.hidden = true;
}

function chargerPhotos() {
  vue.querySelectorAll('img[data-photo]').forEach((img) => (guetteur ? guetteur.observe(img) : remplirPhoto(img)));
}

async function supprimerPromo(id) {
  const p = (etat.promos || []).find((x) => x.id === id);
  await deleteDoc(doc(db, 'promos', id));
  if (p && p.photo) await deleteDoc(doc(db, 'photos', id)).catch((e) => console.error(e));
  photos.delete(id);
}

/* ---------- Briques d'affichage ---------- */

function interieurPromo(p, avecCommerce, sansVignette) {
  const c = commerce(p.commerce);
  const r = remise(p);
  const pastille = '<span class="remise' + (r >= 30 ? ' forte' : '') + (p.photo && !sansVignette ? ' mini' : '') + '">−' + r + ' %</span>';
  return (p.photo && !sansVignette ? '<span class="photo-case">' + balisePhoto(p, 'vignette') + pastille + '</span>' : pastille) +
    '<span class="promo-texte"><strong>' + esc(p.produit) + '</strong>' +
    (avecCommerce && c ? '<small>' + esc(c.nom) + ' · ' + esc(c.commune) + '</small>' : '') +
    '<small>jusqu\'au ' + dateCourte(p.fin) + '</small></span>' +
    '<span class="promo-prix"><del>' + prix(p.prixNormal) + '</del><span class="chiffre">' + prix(p.prixPromo) + '</span></span>';
}

const cartePromo = (p) => '<a class="promo carte" href="#/commerce/' + esc(p.commerce) + '">' + interieurPromo(p, true) + '</a>';

function vide(dessin, titre, texte) {
  return '<div class="vide">' + dessin + '<h2>' + titre + '</h2><p class="note">' + texte + '</p></div>';
}

const enTete = (surtitre, titre, dessin) =>
  '<div class="rang haut"><div><small class="surtitre">' + surtitre + '</small><h1 class="titre">' + titre + '</h1></div>' + dessin + '</div>';

/* ---------- Écrans publics ---------- */

function vuePromos() {
  const visibles = promosVisibles();
  const communes = [...new Set(etat.commerces.filter(abonnementActif).map((c) => c.commune))].sort();
  const secteurs = SECTEURS.filter((s) => visibles.some((p) => commerce(p.commerce).secteur === s));
  if (!secteurs.includes(etat.secteur)) etat.secteur = 'tous';
  if (!communes.includes(etat.commune)) etat.commune = 'toutes';

  const options = '<option value="toutes">Toutes les communes</option>' + communes.map((n) =>
    '<option value="' + esc(n) + '"' + (n === etat.commune ? ' selected' : '') + '>' + esc(n) + '</option>').join('');

  const puces = ['tous', ...secteurs].map((s) => {
    const actif = s === etat.secteur;
    return '<button type="button" class="bouton puce' + (actif ? ' active' : '') + '" data-secteur="' + esc(s) +
      '" aria-pressed="' + actif + '">' + (s === 'tous' ? 'Tout' : esc(s)) + '</button>';
  }).join('');

  const filtrees = visibles.filter((p) => {
    const c = commerce(p.commerce);
    return (etat.commune === 'toutes' || c.commune === etat.commune) && (etat.secteur === 'tous' || c.secteur === etat.secteur);
  });

  const meilleure = visibles[0];
  const liste = filtrees.length
    ? filtrees.map(cartePromo).join('')
    : (visibles.length
      ? vide(Icones.nuage(110), 'Pas de promo ici pour l\'instant', 'Essaie une autre commune ou un autre secteur.')
      : vide(Icones.nuage(110), 'Les premières promos arrivent', 'Reviens bientôt, ou touche « Mise à jour ».'));

  return '' +
    '<section class="hero carte fond-beau">' +
      '<div class="hero-haut"><div class="hero-texte">' +
        '<small class="surtitre">Ia ora na !</small>' +
        '<h1 class="titre">' + visibles.length + ' promo' + (visibles.length > 1 ? 's' : '') + '<br>au fenua</h1>' +
        '<span class="bulle">Mea māmā !</span>' +
      '</div><div class="mascotte">' + Icones.soleil(128, true) + '</div></div>' +
      '<div class="niho"></div>' +
      '<div class="hero-bas">' + (meilleure
        ? '<div><small>La plus forte remise</small><div class="chiffre" style="white-space:normal">' + esc(meilleure.produit) + '</div></div>' +
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
  const actifs = etat.commerces.filter(abonnementActif).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const lignes = actifs.map((c) => {
    const n = promosDe(c.id).length;
    return '<a class="ligne carte" href="#/commerce/' + esc(c.id) + '">' +
      '<span class="ligne-texte"><strong>' + esc(c.nom) + '</strong><small>' + esc(c.secteur) + ' · ' + esc(c.commune) + '</small></span>' +
      '<span class="pastille ' + (n ? 'fond-beau' : 'fond-variable') + '">' + n + ' promo' + (n > 1 ? 's' : '') + '</span></a>';
  }).join('');

  return enTete('Te mau fare toa · les commerces', 'Les commerces<br>partenaires', Icones.tiare(84, 'danse')) +
    '<div class="niho"></div><div style="height:16px"></div>' +
    '<div class="liste">' + (lignes || vide(Icones.nuage(110), 'Pas encore de commerce', 'Les premiers partenaires arrivent bientôt.')) + '</div>' +
    '<p class="note">Tu tiens un commerce ? Ouvre l\'onglet « Mon commerce » pour publier tes promos.</p>';
}

function vueCommerce(id) {
  const c = commerce(id);
  if (!c || !abonnementActif(c)) return vueIntrouvable();
  const promos = promosDe(id).sort((a, b) => remise(b) - remise(a));
  const motifs = MOTIFS.map((m) => '<option>' + esc(m) + '</option>').join('');

  const cartes = promos.map((p) =>
    '<div class="promo-bloc">' + (p.photo ? balisePhoto(p, 'photo-grande') : '') +
    '<div class="promo carte">' + interieurPromo(p, false, true) + '</div>' +
    '<details class="signaler"><summary>Signaler un problème</summary>' +
    '<form data-signaler="' + esc(p.id) + '"><select name="motif" class="bouton" aria-label="Motif du signalement">' + motifs + '</select>' +
    '<button class="bouton" type="submit">Envoyer</button></form></details></div>').join('');

  return '' +
    '<div class="rang">' +
      '<a class="bouton rond" href="#/commerces" aria-label="Retour aux commerces">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"></path></svg></a>' +
      '<span class="pastille bord fond-beau">' + esc(c.secteur) + '</span>' +
    '</div>' +
    '<div class="rang haut"><div><h1 class="titre">' + esc(c.nom) + '</h1>' +
    '<p class="note">' + esc(c.commune) + (c.adresse ? ' · ' + esc(c.adresse) : '') +
    (c.tel ? '<br>Tél. <a href="tel:' + esc(c.tel.replace(/\s/g, '')) + '">' + esc(c.tel) + '</a>' : '') + '</p></div>' +
    Icones.tiare(72, 'danse') + '</div>' +
    '<div class="niho"></div>' +
    '<h2>Ses promos du moment</h2>' +
    '<div class="liste">' + (cartes || vide(Icones.nuage(110), 'Pas de promo en ce moment', 'Reviens bientôt !')) + '</div>';
}

/* ---------- Connexion ---------- */

function vueConnexion() {
  return enTete('Espace commerçant', 'Mon<br>commerce', Icones.tiare(84, 'danse')) +
    '<form id="connexion" class="formulaire carte" novalidate>' +
      '<label for="c-email">Adresse e-mail</label>' +
      '<input id="c-email" name="email" class="bouton" type="email" autocomplete="username" autocapitalize="none" required>' +
      '<label for="c-mdp">Mot de passe</label>' +
      '<input id="c-mdp" name="motdepasse" class="bouton" type="password" autocomplete="current-password" required>' +
      '<p class="erreur" role="alert"></p>' +
      '<button class="bouton cta" type="submit">Se connecter</button>' +
    '</form>' +
    '<button type="button" class="lien-bouton" data-oubli="1">Mot de passe oublié ?</button>' +
    '<p class="note">Pas encore de compte ? Les comptes sont créés par l\'équipe Māmā à la souscription de l\'abonnement.</p>';
}

/* ---------- Tableau de bord du commerce ---------- */

function emplacementLibre(uid) {
  for (let n = 1; n <= MAX_PROMOS; n++) {
    const id = uid + '_' + n;
    const p = etat.promos.find((x) => x.id === id);
    if (!p || !enCours(p)) return id;
  }
  return null;
}

function vueTableau() {
  const uid = etat.utilisateur.uid;
  const c = commerce(uid);
  const sortie = '<button type="button" class="lien-bouton" data-deconnexion="1">Se déconnecter</button>';

  if (!c) {
    return '<div class="vide">' + Icones.nuage(110) + '<h1 class="titre moyen">Compte sans commerce</h1>' +
      '<p class="note">Ce compte (' + esc(etat.utilisateur.email) + ') n\'est rattaché à aucun commerce. Contacte l\'équipe Māmā.</p>' + sortie + '</div>';
  }

  const actif = abonnementActif(c);
  const promos = promosDe(uid);
  const plein = promos.length >= MAX_PROMOS;
  const bloque = !actif || plein;

  const lignes = promos.map((p) =>
    '<div class="ligne carte">' + (p.photo ? balisePhoto(p, 'vignette petite') : '') +
    '<span class="ligne-texte"><strong>' + esc(p.produit) + '</strong>' +
    '<small>' + prix(p.prixPromo) + ' au lieu de ' + prix(p.prixNormal) + ' · jusqu\'au ' + dateCourte(p.fin) + '</small></span>' +
    '<button type="button" class="bouton retirer" data-retirer="' + esc(p.id) + '">Retirer</button></div>').join('');

  const message = !c.actif ? 'Ton compte est suspendu : tes promos ne sont plus affichées. Contacte l\'équipe Māmā.'
    : (!actif ? 'Ton abonnement est terminé : tes promos ne sont plus affichées. Renouvelle-le pour publier à nouveau.'
      : (plein ? 'Tu as atteint la limite de ' + MAX_PROMOS + ' promos. Retires-en une pour en publier une autre.' : ''));

  const auj = iso(Date.now());
  const max = iso(Date.now() + MAX_JOURS * 86400000);

  return '' +
    '<div class="rang haut"><div><small class="surtitre">Espace commerçant</small>' +
    '<h1 class="titre moyen">' + esc(c.nom) + '</h1><p class="note">' + esc(c.secteur) + ' · ' + esc(c.commune) + '</p></div>' +
    '<div class="mascotte">' + (actif ? Icones.soleil(88, true) : Icones.orage(88)) + '</div></div>' +

    '<section class="total carte ' + (actif ? 'fond-beau' : 'fond-hausse') + '">' +
      '<div><small>' + (!c.actif ? 'Compte suspendu' : (actif ? 'Abonnement actif jusqu\'au' : 'Abonnement terminé le')) + '</small>' +
      '<div class="chiffre">' + dateLongue(c.abonnement) + '</div></div>' +
      '<span class="etiquette"><span class="compteur">' + promos.length + ' / ' + MAX_PROMOS + '</span> promos</span>' +
    '</section>' +

    '<h2>Mes promos en ligne</h2>' +
    '<div class="liste">' + (lignes || '<p class="note">Aucune promo publiée pour l\'instant.</p>') + '</div>' +

    '<h2>Publier une promo</h2>' +
    '<form id="ajout" class="formulaire carte" novalidate>' +
      (message ? '<p class="erreur">' + esc(message) + '</p>' : '') +
      '<fieldset' + (bloque ? ' disabled' : '') + '>' +
        '<label for="a-produit">Produit ou service</label>' +
        '<input id="a-produit" name="produit" class="bouton" maxlength="60" required>' +
        '<div class="deux">' +
          '<div><label for="a-normal">Prix normal (F)</label><input id="a-normal" name="prixNormal" class="bouton" type="number" inputmode="numeric" min="1" required></div>' +
          '<div><label for="a-promo">Prix promo (F)</label><input id="a-promo" name="prixPromo" class="bouton" type="number" inputmode="numeric" min="1" required></div>' +
        '</div>' +
        '<label for="a-fin">Dernier jour de la promo (' + MAX_JOURS + ' jours au plus)</label>' +
        '<input id="a-fin" name="fin" class="bouton" type="date" min="' + auj + '" max="' + max + '" required>' +
        '<label for="a-photo">Photo (facultative)</label>' +
        '<input id="a-photo" name="photo" class="bouton fichier" type="file" accept="image/*">' +
        '<img id="a-apercu" class="apercu" alt="Aperçu de la photo" hidden>' +
        '<p class="erreur" role="alert"></p>' +
        '<button class="bouton cta" type="submit">Publier la promo</button>' +
      '</fieldset>' +
    '</form>' + sortie;
}

/* ---------- Tableau de bord de l'administrateur ---------- */

function vueAdmin() {
  const signalements = etat.signalements.map((s) => {
    const c = commerce(s.commerce);
    const existe = etat.promos.some((p) => p.id === s.promo);
    return '<div class="admin-commerce carte fond-variable">' +
      '<div><strong>' + esc(s.produit) + '</strong><br><small>' + esc(c ? c.nom : 'Commerce inconnu') + ' · ' + esc(s.motif) +
      (s.cree ? ' · ' + dateCourte(s.cree) : '') + (existe ? '' : ' · promo déjà retirée') + '</small></div>' +
      '<div class="admin-actions">' +
      (existe ? '<button type="button" class="bouton danger" data-sig-supprimer="' + esc(s.id) + '" data-promo="' + esc(s.promo) + '">Supprimer la promo</button>' : '') +
      '<button type="button" class="bouton" data-sig-ignorer="' + esc(s.id) + '">Classer</button></div></div>';
  }).join('');

  const commerces = etat.commerces.slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map((c) => {
    const statut = !c.actif ? ['fond-hausse', 'Suspendu']
      : (c.abonnement > Date.now() ? ['fond-beau', 'Actif'] : ['fond-variable', 'Abonnement terminé']);
    const promos = (etat.promos || []).filter((p) => p.commerce === c.id).map((p) =>
      '<div class="admin-promo">' + (p.photo ? balisePhoto(p, 'vignette petite') : '') + '<span class="ligne-texte">' + esc(p.produit) + ' · ' + prix(p.prixPromo) + (enCours(p) ? '' : ' · terminée') + '</span>' +
      '<button type="button" class="bouton retirer danger" data-admin-supprimer="' + esc(p.id) + '">Supprimer</button></div>').join('');
    return '<div class="admin-commerce carte">' +
      '<div class="rang"><strong>' + esc(c.nom) + '</strong><span class="pastille bord ' + statut[0] + '">' + statut[1] + '</span></div>' +
      '<small>' + esc(c.secteur) + ' · ' + esc(c.commune) + (c.tel ? ' · ' + esc(c.tel) : '') + '</small>' +
      '<form class="admin-actions" data-abonnement="' + esc(c.id) + '">' +
        '<label class="surtitre" for="ab-' + esc(c.id) + '">Abonnement jusqu\'au</label>' +
        '<input id="ab-' + esc(c.id) + '" name="date" type="date" class="bouton" value="' + (c.abonnement ? iso(c.abonnement) : '') + '" required>' +
        '<button class="bouton" type="submit">Enregistrer</button>' +
        '<button type="button" class="bouton' + (c.actif ? ' danger' : '') + '" data-basculer="' + esc(c.id) + '" data-actif="' + (c.actif ? '0' : '1') + '">' +
        (c.actif ? 'Suspendre' : 'Réactiver') + '</button>' +
      '</form>' + promos + '</div>';
  }).join('');

  const secteurs = SECTEURS.map((s) => '<option>' + esc(s) + '</option>').join('');
  const communes = COMMUNES.map((s) => '<option value="' + esc(s) + '"></option>').join('');
  const dansUnAn = iso(Date.now() + 365 * 86400000);

  return enTete('Administration', 'Tableau<br>de bord', Icones.tiare(84, 'danse')) +
    '<h2>Signalements (' + etat.signalements.length + ')</h2>' +
    '<div class="liste">' + (signalements || '<p class="note">Aucun signalement.</p>') + '</div>' +

    '<h2>Commerces (' + etat.commerces.length + ')</h2>' +
    '<div class="liste">' + (commerces || '<p class="note">Aucun commerce pour l\'instant.</p>') + '</div>' +

    '<h2>Ajouter un commerce</h2>' +
    '<form id="nouveau" class="formulaire carte" novalidate>' +
      '<label for="n-nom">Nom du commerce</label><input id="n-nom" name="nom" class="bouton" maxlength="60" required>' +
      '<label for="n-secteur">Secteur</label><select id="n-secteur" name="secteur" class="bouton">' + secteurs + '</select>' +
      '<label for="n-commune">Commune</label><input id="n-commune" name="commune" class="bouton" list="communes" maxlength="40" required>' +
      '<datalist id="communes">' + communes + '</datalist>' +
      '<label for="n-adresse">Adresse</label><input id="n-adresse" name="adresse" class="bouton" maxlength="80">' +
      '<label for="n-tel">Téléphone</label><input id="n-tel" name="tel" class="bouton" type="tel" maxlength="20">' +
      '<label for="n-email">E-mail de connexion du commerce</label><input id="n-email" name="email" class="bouton" type="email" autocapitalize="none" autocomplete="off" required>' +
      '<label for="n-mdp">Mot de passe provisoire (6 caractères au moins)</label><input id="n-mdp" name="motdepasse" class="bouton" autocomplete="off" minlength="6" required>' +
      '<label for="n-abo">Abonnement jusqu\'au</label><input id="n-abo" name="abonnement" class="bouton" type="date" value="' + dansUnAn + '" required>' +
      '<p class="erreur" role="alert"></p>' +
      '<button class="bouton cta" type="submit">Créer le commerce</button>' +
    '</form>' +
    '<button type="button" class="lien-bouton" data-deconnexion="1">Se déconnecter</button>';
}

function vueIntrouvable() {
  return '<div class="vide">' + Icones.nuage(120) + '<h1 class="titre moyen">Page introuvable</h1>' +
    '<a class="bouton cta" href="#/">Retour aux promos</a></div>';
}

function vueErreur() {
  return '<div class="vide">' + Icones.orage(120) + '<h1 class="titre moyen">Pas de promos pour l\'instant</h1>' +
    '<p class="note">Impossible de joindre le serveur. Vérifie ta connexion puis touche « Mise à jour ».</p></div>';
}

/* ---------- Routeur ---------- */

function afficher() {
  const morceaux = (location.hash.replace(/^#\/?/, '') || 'promos').split('/');
  const route = morceaux[0];
  const param = decodeURIComponent(morceaux[1] || '');
  let html;

  if (route === 'espace') {
    if (!etat.authPret) html = '<p class="attente">Chargement…</p>';
    else if (!etat.utilisateur) html = vueConnexion();
    else if (!etat.commerces) html = etat.horsLigne ? vueErreur() : '<p class="attente">Chargement…</p>';
    else html = etat.estAdmin ? vueAdmin() : vueTableau();
  } else if (!etat.commerces) html = etat.horsLigne ? vueErreur() : '<p class="attente">Chargement…</p>';
  else if (route === 'promos') html = vuePromos();
  else if (route === 'commerces') html = vueCommerces();
  else if (route === 'commerce') html = vueCommerce(param);
  else html = vueIntrouvable();

  vue.innerHTML = html;
  chargerPhotos();

  const onglet = route === 'commerce' ? 'commerces' : route;
  document.querySelectorAll('.onglets a').forEach((a) => {
    if (a.getAttribute('data-onglet') === onglet) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  document.getElementById('maj-date').textContent = etat.majLe
    ? 'Promos à jour au ' + new Date(etat.majLe).toLocaleString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
    : '';
}

/* ---------- Événements ---------- */

window.addEventListener('hashchange', () => {
  afficher();
  window.scrollTo(0, 0);
  vue.focus({ preventScroll: true });
});

boutonMaj.addEventListener('click', async () => {
  if (etat.estAdmin) await chargerSignalements();
  charger(true, true);
});

vue.addEventListener('change', (e) => {
  if (e.target.id === 'commune') { etat.commune = e.target.value; afficher(); }

  if (e.target.id === 'a-photo') {
    const apercu = document.getElementById('a-apercu');
    const fichier = e.target.files[0];
    apercu.hidden = true;
    if (!fichier) return;
    compresser(fichier)
      .then((image) => { apercu.src = image; apercu.hidden = false; })
      .catch((err) => { e.target.value = ''; toast(messageErreur(err)); });
  }
});

vue.addEventListener('click', (e) => {
  const cible = (selecteur) => e.target.closest(selecteur);
  let b;

  if ((b = cible('[data-secteur]'))) { etat.secteur = b.getAttribute('data-secteur'); afficher(); return; }

  if ((b = cible('[data-deconnexion]'))) {
    action(b, async () => { await signOut(auth); toast('À bientôt !'); });
    return;
  }

  if ((b = cible('[data-oubli]'))) {
    const email = (document.getElementById('c-email').value || '').trim();
    if (!email) { toast('Écris d\'abord ton adresse e-mail.'); return; }
    action(b, async () => {
      await sendPasswordResetEmail(auth, email);
      toast('E-mail de réinitialisation envoyé.');
    });
    return;
  }

  if ((b = cible('[data-retirer]'))) {
    action(b, async () => {
      await supprimerPromo(b.getAttribute('data-retirer'));
      await charger(true);
      toast('Promo retirée');
    });
    return;
  }

  if ((b = cible('[data-admin-supprimer]'))) {
    if (!confirm('Supprimer cette promo ?')) return;
    action(b, async () => {
      await supprimerPromo(b.getAttribute('data-admin-supprimer'));
      await charger(true);
      toast('Promo supprimée');
    });
    return;
  }

  if ((b = cible('[data-basculer]'))) {
    const activer = b.getAttribute('data-actif') === '1';
    if (!activer && !confirm('Suspendre ce commerce ? Ses promos ne seront plus affichées.')) return;
    action(b, async () => {
      await updateDoc(doc(db, 'commerces', b.getAttribute('data-basculer')), { actif: activer });
      await charger(true);
      toast(activer ? 'Commerce réactivé' : 'Commerce suspendu');
    });
    return;
  }

  if ((b = cible('[data-sig-ignorer]')) || (b = cible('[data-sig-supprimer]'))) {
    const idSignalement = b.getAttribute('data-sig-ignorer') || b.getAttribute('data-sig-supprimer');
    const idPromo = b.getAttribute('data-promo');
    action(b, async () => {
      if (idPromo) await supprimerPromo(idPromo);
      await deleteDoc(doc(db, 'signalements', idSignalement));
      await chargerSignalements();
      await charger(true);
      toast(idPromo ? 'Promo supprimée' : 'Signalement classé');
    });
  }
});

vue.addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.target;
  const bouton = f.querySelector('button[type="submit"]');
  const zone = f.querySelector('.erreur[role="alert"]');
  const refuser = (texte) => { if (zone) zone.textContent = texte; };
  if (zone) zone.textContent = '';

  /* Envoi avec affichage de l'erreur dans le formulaire. */
  const envoyer = async (travail) => {
    bouton.disabled = true;
    try { await travail(); } catch (err) { console.error(err); refuser(messageErreur(err)); }
    if (bouton.isConnected) bouton.disabled = false;
  };

  if (f.id === 'connexion') {
    envoyer(() => signInWithEmailAndPassword(auth, f.email.value.trim(), f.motdepasse.value));
    return;
  }

  if (f.id === 'ajout') {
    const uid = etat.utilisateur.uid;
    const produit = f.produit.value.trim();
    const normal = Math.round(Number(f.prixNormal.value));
    const promo = Math.round(Number(f.prixPromo.value));
    const fin = f.fin.value;
    const emplacement = emplacementLibre(uid);

    if (!emplacement) return refuser('Limite de ' + MAX_PROMOS + ' promos atteinte.');
    if (!produit) return refuser('Indique le nom du produit.');
    if (!(normal > 0) || !(promo > 0)) return refuser('Indique les deux prix.');
    if (promo >= normal) return refuser('Le prix promo doit être plus bas que le prix normal.');
    if (!fin || finDeJournee(fin).getTime() < Date.now()) return refuser('Choisis un dernier jour à partir d\'aujourd\'hui.');
    if (finDeJournee(fin).getTime() > Date.now() + (MAX_JOURS + 1) * 86400000) return refuser('La promo ne peut pas durer plus de ' + MAX_JOURS + ' jours.');

    envoyer(async () => {
      const fichier = f.photo.files[0];
      const image = fichier ? await compresser(fichier) : null;
      const ancienne = etat.promos.find((x) => x.id === emplacement);
      // La photo d'abord : une promo marquée « avec photo » a ainsi toujours sa photo.
      if (image) {
        await setDoc(doc(db, 'photos', emplacement), { commerce: uid, image: image, cree: serverTimestamp() });
      } else if (ancienne && ancienne.photo) {
        await deleteDoc(doc(db, 'photos', emplacement)).catch((e2) => console.error(e2));
      }
      photos.delete(emplacement);
      await setDoc(doc(db, 'promos', emplacement), {
        commerce: uid, produit: produit, prixNormal: normal, prixPromo: promo,
        fin: Timestamp.fromDate(finDeJournee(fin)), photo: !!image, cree: serverTimestamp()
      });
      await charger(true);
      toast('Promo publiée !');
    });
    return;
  }

  if (f.hasAttribute('data-signaler')) {
    const p = etat.promos.find((x) => x.id === f.getAttribute('data-signaler'));
    if (!p) return;
    action(bouton, async () => {
      await addDoc(collection(db, 'signalements'), {
        promo: p.id, commerce: p.commerce, produit: p.produit, motif: f.motif.value, cree: serverTimestamp()
      });
      f.closest('details').open = false;
      toast('Māuruuru ! Signalement envoyé.');
    });
    return;
  }

  if (f.hasAttribute('data-abonnement')) {
    if (!f.date.value) return;
    action(bouton, async () => {
      await updateDoc(doc(db, 'commerces', f.getAttribute('data-abonnement')), {
        abonnement: Timestamp.fromDate(finDeJournee(f.date.value))
      });
      await charger(true);
      toast('Abonnement enregistré');
    });
    return;
  }

  if (f.id === 'nouveau') {
    const nom = f.nom.value.trim();
    const commune = f.commune.value.trim();
    const email = f.email.value.trim();
    const mdp = f.motdepasse.value;
    if (!nom || !commune) return refuser('Indique le nom et la commune.');
    if (!email) return refuser('Indique l\'adresse e-mail du commerce.');
    if (mdp.length < 6) return refuser('Mot de passe trop court : 6 caractères au minimum.');
    if (!f.abonnement.value) return refuser('Indique la fin de l\'abonnement.');

    envoyer(async () => {
      // Le compte est créé depuis une seconde connexion, pour que l'administrateur reste connecté.
      const app2 = initializeApp(firebaseConfig, 'creation-' + Date.now());
      let uid;
      try {
        const auth2 = getAuth(app2);
        const compte = await createUserWithEmailAndPassword(auth2, email, mdp);
        uid = compte.user.uid;
        await signOut(auth2);
      } finally {
        await deleteApp(app2);
      }
      await setDoc(doc(db, 'commerces', uid), {
        nom: nom, secteur: f.secteur.value, commune: commune,
        adresse: f.adresse.value.trim(), tel: f.tel.value.trim(),
        actif: true, abonnement: Timestamp.fromDate(finDeJournee(f.abonnement.value)),
        cree: serverTimestamp()
      });
      await charger(true);
      toast('Commerce créé : ' + nom);
    });
  }
});

/* ---------- Démarrage ---------- */

document.getElementById('logo-tiare').innerHTML = Icones.tiare(40, 'danse');

onAuthStateChanged(auth, async (utilisateur) => {
  etat.utilisateur = utilisateur;
  etat.estAdmin = false;
  etat.signalements = [];
  if (utilisateur) {
    try {
      etat.estAdmin = (await getDoc(doc(db, 'admins', utilisateur.uid))).exists();
    } catch (e) { console.error(e); }
    if (etat.estAdmin) await chargerSignalements();
  }
  etat.authPret = true;
  afficher();
  // Un commerçant ou l'administrateur travaille toujours sur des données fraîches.
  if (utilisateur) charger(true);
});

afficher();
charger(false);
