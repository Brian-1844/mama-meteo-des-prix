# Māmā · les promos du fenua

Prototype d'application web : les commerces de Polynésie française publient eux-mêmes leurs promotions, en échange d'un abonnement. Le public consulte gratuitement.

> **Les commerces, prix et promotions fournis sont fictifs.** La connexion des commerçants est une démonstration, pas une vraie protection (voir plus bas).

## Le principe

- **Public** : liste des promos triées par remise, filtre par commune et par secteur (alimentation, sport, auto…), fiche de chaque commerce.
- **Commerçant** : connexion par identifiant et mot de passe, puis publication de 4 promos au maximum, retirables à tout moment.
- **Abonnement** : chaque commerce a une date de fin d'abonnement. Passé cette date, ses promos disparaissent de l'app et il ne peut plus publier.
- **Mise à jour** : le bouton recharge les promos sans passer par le cache.

## Mettre en ligne sur GitHub Pages

Tous les fichiers sont au même niveau, sans dossier : on peut les déposer depuis un téléphone.

1. Dans le dépôt, **Add file → Upload files**, choisir tous les fichiers, puis **Commit changes**. Les fichiers du même nom sont remplacés.
2. L'ancien fichier `prix.json` ne sert plus et peut être supprimé.
3. Pages est déjà activé si l'ancienne version était en ligne ; l'adresse ne change pas.

## Les fichiers

```
index.html             structure de la page, en-tête, onglets
style.css              couleurs, style BD, animations
icones.js              dessins : tiare, soleil, nuage, orage
app.js                 données, écrans, connexion de démonstration
promos.json            commerces et promotions
secours.js             copie de promos.json utilisée hors ligne
icone.svg              icône de l'application
manifest.webmanifest   installation sur l'écran d'accueil
```

## Tester l'espace commerçant

Onglet **Mon commerce**, identifiant `magasin-a` (ou un autre identifiant de `promos.json`), mot de passe `demo`.

- `magasin-a` (alimentation) a 3 promos : il peut en publier une quatrième, puis la limite bloque.
- `magasin-e` a un abonnement terminé : ses promos sont cachées et la publication est bloquée.

## Gérer les commerces et les abonnements (version démo)

Dans `promos.json`, chaque commerce a une ligne :

```json
{ "id": "magasin-a", "nom": "Magasin A", "secteur": "Alimentation", "commune": "Punaauia", "adresse": "…", "tel": "…", "abonnement": "2027-03-31" }
```

- Ajouter un commerce : ajouter une ligne avec un `id` unique et un `secteur`.
- Les secteurs possibles sont listés dans `app.js`, constante `SECTEURS`. Le nom doit être écrit exactement pareil dans `promos.json`. Un secteur sans promo en cours n'apparaît pas dans les filtres.
- Renouveler un abonnement : changer la date `abonnement` (année-mois-jour).
- Le nombre de promos par commerce se règle dans `app.js`, constante `MAX_PROMOS`.

Après une modification de `promos.json`, régénérer la copie de secours :

```
printf 'window.MAMA_SECOURS = %s;\n' "$(cat promos.json)" > secours.js
```

## Limites de cette démonstration

- **Pas de vraie sécurité.** Le mot de passe est écrit dans `app.js`, que tout le monde peut lire. Ne jamais y mettre de vrais mots de passe.
- **Pas de partage.** Une promo publiée par un commerçant reste dans son navigateur : les autres utilisateurs ne la voient pas.

## Passer à la vraie version

GitHub Pages ne fait qu'afficher des fichiers : il ne peut ni vérifier un mot de passe ni enregistrer une promo. Il faut ajouter un serveur avec une base de données, qui se charge de :

1. **Les comptes** : un identifiant et un mot de passe par commerce, vérifiés côté serveur.
2. **Les promos** : enregistrées dans la base, lisibles par tous, modifiables seulement par leur commerce.
3. **Les règles** : 4 promos au maximum et abonnement à jour, vérifiés côté serveur (les contrôles de `app.js` ne suffisent pas, ils sont contournables).
4. **L'abonnement** : une date de fin par commerce, mise à jour à chaque paiement.

Un service comme Supabase ou Firebase fournit comptes et base de données sans écrire de serveur ; l'application peut rester sur GitHub Pages. Dans `app.js`, les endroits à brancher sont marqués par le mot « serveur » en commentaire.
