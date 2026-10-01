# Māmā · la météo des prix

Prototype d'application web pour suivre les prix alimentaires en Polynésie française, présentés comme un bulletin météo : grand beau quand les prix baissent, avis de hausse quand ils montent.

> **Les prix, magasins et pourcentages fournis sont fictifs.** Ils servent uniquement à la démonstration.

## Lancer l'application

Aucune installation, aucun outil de build : ce sont des fichiers HTML, CSS et JavaScript.

- **Sur ton ordinateur** : dans le dossier du projet, lance `python3 -m http.server 8000` puis ouvre <http://localhost:8000>. Un double-clic sur `index.html` marche aussi, mais l'app utilise alors la copie de secours des prix.
- **Sur GitHub Pages** : dépose tous les fichiers dans un dépôt, puis *Settings → Pages → Deploy from a branch → main / (root)*. L'app est en ligne à `https://<ton-compte>.github.io/<nom-du-depot>/`.

## Ce que fait le prototype

| Écran | Adresse | Contenu |
|---|---|---|
| Météo | `#/` | Météo de la commune choisie, bulletin du jour, bons plans |
| Communes | `#/communes` | Classement des communes par île |
| Fiche produit | `#/produit/<id>` | Prix par magasin et tendance sur 7 jours |
| Mon panier | `#/panier` | Total du panier au magasin le moins cher |
| Signaler | `#/signaler` | Formulaire de relevé de prix |

Le bouton **Mise à jour** recharge `data/prix.json` sans passer par le cache et réaffiche l'écran. Hors ligne, l'app garde les derniers prix connus.

## Organisation des fichiers

```
index.html             structure de la page, en-tête, onglets
css/style.css          couleurs, style BD, animations
js/icones.js           dessins SVG : tiare, soleil, nuage, orage
js/app.js              données, écrans, routeur, événements
js/secours.js          copie de data/prix.json utilisée hors ligne
data/prix.json         les prix (à remplacer par de vrais relevés)
assets/icone.svg       icône de l'application
manifest.webmanifest   installation sur l'écran d'accueil
```

## Modifier les prix

Tout est dans `data/prix.json` :

- `communes` : `panier` (prix du panier type en F) et `variation` (évolution sur 7 jours, en %).
- `produits` : `variation`, `tendance` (7 prix, du plus ancien au plus récent) et `magasins`.

La météo se calcule à partir de `variation`, dans la fonction `meteo()` de `js/app.js` :

| Variation sur 7 jours | Météo |
|---|---|
| −2 % ou moins | Grand beau |
| entre −2 % et +2 % | Variable |
| +2 % ou plus | Avis de hausse |

Après une modification de `data/prix.json`, régénère la copie de secours :

```
printf 'window.MAMA_SECOURS = %s;\n' "$(cat data/prix.json)" > js/secours.js
```

## Limites de cette version

- Pas de serveur : les relevés envoyés par le formulaire et le panier restent dans le navigateur (`localStorage`).
- Pour brancher une vraie source de prix, change la constante `SOURCE` en haut de `js/app.js`.
- Les mots en tahitien sont à faire relire par un locuteur.
