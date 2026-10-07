/* Māmā — vérification des règles de sécurité contre la vraie base.
   Chaque essai attend « ok » (autorisé) ou « refus » (permission-denied). */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signInAnonymously, signOut } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore, collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const zone = document.getElementById('tests');
const bilan = document.getElementById('bilan');

const dans = (jours) => Timestamp.fromDate(new Date(Date.now() + jours * 86400000));
const promoValide = (uid, extra) => Object.assign({
  commerce: uid, produit: 'Test de sécurité', type: 'promo', prixNormal: 1000, prixPromo: 800, fin: dans(10), cree: serverTimestamp()
}, extra || {});

function ligne(etat, titre, detail) {
  const d = document.createElement('div');
  d.className = 'test ' + etat;
  d.innerHTML = '<span class="etat">' + (etat === 'ok' ? '✓' : etat === 'ko' ? '✗' : '–') + '</span><div><strong></strong><small></small></div>';
  d.querySelector('strong').textContent = titre;
  d.querySelector('small').textContent = detail;
  zone.appendChild(d);
}

let total = 0, reussis = 0;

async function essai(titre, attendu, travail) {
  total++;
  let obtenu, detail;
  try {
    await travail();
    obtenu = 'ok'; detail = 'autorisé';
  } catch (e) {
    const code = (e && e.code) || String(e);
    obtenu = /permission-denied/.test(code) ? 'refus' : 'erreur';
    detail = code;
  }
  const bon = obtenu === attendu;
  if (bon) reussis++;
  ligne(bon ? 'ok' : 'ko', titre, 'attendu : ' + attendu + ' · obtenu : ' + detail);
}

function ignore(titre, pourquoi) {
  ligne('skip', titre, 'ignoré : ' + pourquoi);
}

document.getElementById('lancer').addEventListener('submit', async (e) => {
  e.preventDefault();
  zone.innerHTML = '';
  bilan.textContent = 'En cours…';
  total = 0; reussis = 0;
  const email = document.getElementById('t-email').value.trim();
  const mdp = document.getElementById('t-mdp').value;

  try {
    /* ----- En tant que commerce ----- */
    await signOut(auth).catch(() => {});
    const compte = (await signInWithEmailAndPassword(auth, email, mdp)).user;
    const uid = compte.uid;
    const admin = await getDoc(doc(db, 'admins', uid)).then((d) => d.exists()).catch(() => false);
    if (admin) { bilan.textContent = 'Ce compte est administrateur : utilise un compte de commerce.'; return; }

    const slot = uid + '_4';
    const occupe = (await getDoc(doc(db, 'promos', slot))).exists();

    await essai('Promo dans l\'emplacement d\'un autre commerce', 'refus', () => setDoc(doc(db, 'promos', 'autre_1'), promoValide(uid)));
    await essai('Promo dans un 5e emplacement', 'refus', () => setDoc(doc(db, 'promos', uid + '_5'), promoValide(uid)));
    await essai('Promo au nom d\'un autre commerce dans mon emplacement', 'refus', () => setDoc(doc(db, 'promos', slot), promoValide('autre')));
    await essai('Prix promo plus haut que le prix normal', 'refus', () => setDoc(doc(db, 'promos', slot), promoValide(uid, { prixPromo: 1200 })));
    await essai('Promo de 70 jours', 'refus', () => setDoc(doc(db, 'promos', slot), promoValide(uid, { fin: dans(70) })));
    await essai('Produit de 61 caractères', 'refus', () => setDoc(doc(db, 'promos', slot), promoValide(uid, { produit: 'x'.repeat(61) })));
    await essai('Type d\'annonce inconnu', 'refus', () => setDoc(doc(db, 'promos', slot), promoValide(uid, { type: 'solde' })));
    await essai('Arrivage avec un prix normal', 'refus', () => setDoc(doc(db, 'promos', slot), promoValide(uid, { type: 'arrivage' })));
    await essai('Champ inconnu dans une promo', 'refus', () => setDoc(doc(db, 'promos', slot), promoValide(uid, { vedette: true })));
    await essai('Date de création falsifiée', 'refus', () => setDoc(doc(db, 'promos', slot), promoValide(uid, { cree: Timestamp.fromDate(new Date(2020, 0, 1)) })));
    await essai('Modifier mon propre abonnement', 'refus', () => updateDoc(doc(db, 'commerces', uid), { abonnement: dans(3650) }));
    await essai('Me déclarer administrateur', 'refus', () => setDoc(doc(db, 'admins', uid), { role: 'admin' }));
    await essai('Lire les signalements', 'refus', () => getDocs(collection(db, 'signalements')));
    await essai('Photo dans l\'emplacement d\'un autre', 'refus', () => setDoc(doc(db, 'photos', 'autre_1'), { commerce: uid, image: 'data:image/jpeg;base64,AAAA', cree: serverTimestamp() }));
    await essai('Photo qui n\'est pas un JPEG', 'refus', () => setDoc(doc(db, 'photos', slot), { commerce: uid, image: 'data:text/html;base64,PHNjcmlwdD4=', cree: serverTimestamp() }));
    await essai('Supprimer la promo d\'un autre', 'refus', () => deleteDoc(doc(db, 'promos', 'autre_1')));

    if (occupe) {
      ignore('Promo valide (témoin)', 'emplacement 4 occupé');
      ignore('Arrivage valide (témoin)', 'emplacement 4 occupé');
    } else {
      await essai('Promo valide (témoin)', 'ok', () => setDoc(doc(db, 'promos', slot), promoValide(uid)));
      await essai('Retirer ma promo (témoin)', 'ok', () => deleteDoc(doc(db, 'promos', slot)));
      await essai('Arrivage valide sans prix (témoin)', 'ok', () => setDoc(doc(db, 'promos', slot), { commerce: uid, produit: 'Arrivage de test', type: 'arrivage', fin: dans(5), cree: serverTimestamp() }));
      await deleteDoc(doc(db, 'promos', slot)).catch(() => {});
    }

    /* ----- En visiteur anonyme ----- */
    await signOut(auth);
    const anonyme = (await signInAnonymously(auth)).user;
    await essai('Visiteur : lire les promos', 'ok', () => getDocs(collection(db, 'promos')));
    await essai('Visiteur : publier une promo', 'refus', () => setDoc(doc(db, 'promos', anonyme.uid + '_1'), promoValide(anonyme.uid)));
    await essai('Visiteur : signalement avec un identifiant trafiqué', 'refus', () => setDoc(doc(db, 'signalements', 'test-securite_autre'), { promo: 'test-securite', commerce: 'x', produit: 'x', motif: 'x', cree: serverTimestamp() }));
    await essai('Visiteur : signalement correct (témoin)', 'ok', () => setDoc(doc(db, 'signalements', 'test-securite_' + anonyme.uid), { promo: 'test-securite', commerce: 'test', produit: 'Test de sécurité', motif: 'Autre problème', cree: serverTimestamp() }));
    await essai('Visiteur : signaler deux fois la même promo', 'refus', () => setDoc(doc(db, 'signalements', 'test-securite_' + anonyme.uid), { promo: 'test-securite', commerce: 'test', produit: 'Test de sécurité', motif: 'Autre problème', cree: serverTimestamp() }));
    await essai('Visiteur : lire les signalements', 'refus', () => getDocs(collection(db, 'signalements')));
    await signOut(auth);

    bilan.textContent = reussis + ' / ' + total + ' essais conformes' + (reussis === total ? ' : les règles tiennent.' : ' : à corriger.');
    document.getElementById('fin').hidden = false;
  } catch (err) {
    console.error(err);
    bilan.textContent = 'Impossible de lancer les tests : ' + ((err && err.code) || err);
  }
});
