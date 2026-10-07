# Māmā · les promos du fenua

Application web où les commerces de Polynésie française publient eux-mêmes leurs promotions, en échange d'un abonnement. Le public consulte gratuitement, sans compte.

Les pages sont hébergées sur GitHub Pages ; les comptes et les données sont dans Firebase (projet `mama-promos`).

## Les trois rôles

| Rôle | Ce qu'il peut faire |
|---|---|
| Public | Voir les promos et les arrivages, filtrer par zone et par secteur, partager sur Facebook ou Messenger, signaler une promo |
| Commerce | Se connecter, publier 4 annonces au maximum (promo avec remise, ou arrivage sans prix barré ; 60 jours au plus ; photo facultative), les retirer |
| Administrateur | Créer un commerce, régler la fin d'abonnement, suspendre, supprimer une promo, traiter les signalements |

Un commerce dont l'abonnement est terminé ou qui est suspendu n'apparaît plus dans l'app et ne peut plus publier.

## Mise en service (à faire une seule fois)

### 1. Activer la connexion anonyme

Console Firebase → **Authentication** → onglet **Méthode de connexion** (ou **Fournisseurs**) → **Ajouter un fournisseur** → **Anonyme** → activer → enregistrer. C'est ce qui permet au public de signaler une promo sans compte, avec une limite d'un signalement par appareil et par promo.

### 2. Coller les règles de sécurité

Console Firebase → **Firestore** → onglet **Règles**. Remplacer tout le contenu par celui du fichier `firestore.rules`, puis **Publier**.

### 3. Créer le compte administrateur

1. Console Firebase → **Authentication** → onglet **Utilisateurs** → **Ajouter un utilisateur**. Saisir son e-mail et un mot de passe solide.
2. Dans la liste, copier la valeur de la colonne **UID de l'utilisateur**.
3. **Firestore** → onglet **Données** → **Commencer une collection**. ID de collection : `admins`.
4. ID du document : coller l'UID. Ajouter un champ `role`, type string, valeur `admin`. **Enregistrer**.

### 4. Déposer les fichiers sur GitHub

Dans le dépôt, **Add file → Upload files**, déposer tous les fichiers de ce dossier (ils sont au même niveau, sans sous-dossier), puis **Commit changes**. Les anciens `promos.json`, `prix.json` et `secours.js` ne servent plus et peuvent être supprimés.

### 5. Vérifier

Ouvrir l'app, onglet **Mon commerce**, se connecter avec le compte administrateur : le tableau de bord d'administration doit s'afficher. Créer un commerce de test, se déconnecter, se connecter avec ce commerce et publier une promo.

### 6. Tester les règles de sécurité

Ouvrir `https://<ton-site>/test-securite.html`, saisir l'e-mail et le mot de passe du commerce de test, lancer. Chaque ligne doit être verte. La page crée un signalement nommé « test-securite » à classer depuis le tableau de bord. Supprimer ensuite `test-securite.html` et `test-securite.js` du dépôt.

### 7. Restreindre la clé Firebase à ton site

Console Google Cloud (console.cloud.google.com) → projet `mama-promos` → **API et services** → **Identifiants** → la clé « Browser key (auto created by Firebase) » → **Restrictions liées aux applications** : **Sites web**, ajouter `https://brian-1844.github.io/*` et `https://mama-promos.firebaseapp.com/*` → enregistrer. La clé ne fonctionne plus depuis un autre site. En cas d'erreur `api-key-not-valid` après coup, vérifier l'orthographe des deux adresses.

## Au quotidien

- **Nouveau commerce** : formulaire « Ajouter un commerce » du tableau de bord. Indiquer la zone (telle que les gens la nomment), le PK et le côté (mer ou montagne), et le nom de la page Facebook du commerce pour le bouton « Écrire sur Messenger ». Transmettre au commerçant son e-mail et son mot de passe provisoire ; il peut le changer avec « Mot de passe oublié ? ».
- **Renouvellement** : changer la date « Abonnement jusqu'au » puis **Enregistrer**.
- **Abus** : **Suspendre** cache toutes les promos du commerce ; **Supprimer** retire une seule promo.
- **Signalements** : ils arrivent en haut du tableau de bord.

## Les fichiers

```
index.html             structure de la page, en-tête, onglets
style.css              couleurs, style BD, animations
icones.js              dessins : tiare, soleil, nuage, orage
app.js                 écrans, connexion, lecture et écriture dans Firebase
config.js              identifiants du projet Firebase (non secrets)
firestore.rules        règles de sécurité à coller dans la console Firebase
test-securite.html     page de vérification des règles (à supprimer après usage)
test-securite.js       son code
icone.svg              icône de l'application
manifest.webmanifest   installation sur l'écran d'accueil
```

## Comment les données sont rangées

- `commerces/<uid>` : nom, secteur, zone, pk, cote, adresse, tel, facebook, actif, abonnement (date).
- `promos/<uid>_1` à `promos/<uid>_4` : les quatre emplacements d'un commerce. C'est ce nommage qui impose la limite de 4. Champ `type` : `promo` (prixNormal et prixPromo) ou `arrivage` (prixPromo facultatif) ; `epuisement` : affiche « jusqu'à épuisement ».
- `photos/<uid>_1` à `photos/<uid>_4` : la photo de la promo du même nom, réduite à 480 pixels et rangée sous forme de texte.
- `admins/<uid>` : la fiche qui fait d'un compte un administrateur.
- `signalements/<promo>_<uid>` : promo signalée, motif, date. L'identifiant impose un signalement par appareil et par promo.

`<uid>` est l'identifiant que Firebase donne à chaque compte.

## Réglages

Dans `app.js` : `MAX_JOURS` (durée d'une annonce), `SECTEURS`, `ZONES` (l'ordre est celui du menu), `CACHE_MINUTES`.

Pour passer de 4 à 3 promos : mettre `MAX_PROMOS = 3` dans `app.js` **et** retirer la ligne `_4` dans `firestore.rules`, puis republier les règles.

## Limites connues

- **Forfait gratuit** : environ 50 000 lectures par jour. Chaque ouverture de l'app lit tous les commerces et toutes les promos, puis garde le résultat 5 minutes. Avec quelques dizaines de commerces, c'est largement suffisant ; au-delà, il faudra optimiser.
- **Suppression d'un compte** : l'app sait suspendre un commerce, pas supprimer son compte. La suppression se fait dans la console Firebase (Authentication, puis la fiche dans Firestore).
- **Photos** : elles sont petites (480 pixels) pour rester dans le forfait gratuit. Pour des photos plus grandes, il faudra passer à Firebase Storage, qui demande le forfait payant à l'usage.
- **Paiement** : l'abonnement est encaissé hors de l'app ; l'administrateur règle la date à la main.
- **Signalements** : n'importe qui peut en envoyer, un par appareil et par promo. Quelqu'un de déterminé peut contourner la limite en effaçant les données du navigateur.
- **Partage** : sur téléphone, le bouton « Partager » ouvre la feuille de partage (Facebook, Messenger, WhatsApp…) ; sur ordinateur, il ouvre la fenêtre de partage Facebook. Facebook affiche l'aperçu de la page d'accueil, pas de la promo.
- **Anciennes fiches** : un commerce créé avant cette version a une `commune` et pas de `zone` ; l'app lit l'un ou l'autre. Pour lui donner un PK, un côté ou une page Facebook, modifier sa fiche dans la console Firebase (collection `commerces`).
- **En cas d'erreur `auth/unauthorized-domain`** : Authentication → Paramètres → Domaines autorisés → ajouter `brian-1844.github.io`.
