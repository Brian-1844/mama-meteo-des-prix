# Manu Ora

Ton manu, tes émotions. Un compagnon-oiseau polynésien qui se promène sur l'écran, demande comment tu vas, et propose de petites actions pour prendre soin de soi : respirer avec la vague, appeler son ama, trois māuruuru, démêler le upe'a. Les émotions se nomment en reo tahiti et en français, et se situent dans le tino (le corps).

**Prototype** : ce n'est pas un soin médical. En cas d'idées noires, l'appli renvoie vers SOS Suicide Polynésie, le 3114 et le 15.

## La croissance du manu

Le manu mûrit avec la personne, au plus **un stade par mois**, et ne revient jamais en arrière. Six stades, du poussin à l'ancien (noms en reo tahiti à faire valider) :

| Stade | Apparence | Comportement |
|---|---|---|
| 1 · Pīpī, le poussin | petit, tête ronde, grands yeux, queue courte | questions simples ; demande plus souvent |
| 2 · Manu ʻāpī, le jeune manu | un peu plus grand, premières couleurs | se souvient d'hier (« Hier : riri. Et aujourd'hui ? ») |
| 3 · Manu rere, le manu qui vole | ailes plus longues | revient de ses visites avec une petite histoire |
| 4 · Manu paʻari, le manu posé | queue longue, petite huppe | demande moins souvent ; « Qui aurait besoin d'un signe aujourd'hui ? » |
| 5 · Manu ʻura | une plume rouge de plus chaque mois (jusqu'à trois) | bilan du mois : l'émotion la plus nommée, une question de recul |
| 6 · Tupuna manu, l'ancien | huppe à pointes dorées, plumage complet | propose d'écrire un mot à son futur soi, rendu un mois plus tard |

**Ce qui fait grandir** (trois jauges, visibles dans « Mon manu ») : la *présence* (jours avec au moins une couleur, sur 31 jours), les *mots* (émotions différentes nommées au moins deux fois) et les *liens* (cœurs liés, ama, étoiles, semaines de Te tere suivies). Deux jauges sur trois suffisent ; les seuils montent doucement avec le stade. Pas de série à tenir, rien à acheter, rien à perdre.

**Plumage de mots** : chaque émotion nommée pour la première fois ajoute une petite plume de sa couleur sur l'aile (14 au plus). Le manu porte le vocabulaire de la personne.

**Le moment du mois** : à la date anniversaire (un mois après le début, puis chaque mois), le manu se réveille, des pétales tombent, il dit en une phrase ce qui a changé. Les amis voient l'apparence du manu (stade, plumes rouges) mais jamais de numéro de stade ni de jauge.

Les utilisateurs existants reçoivent un stade calculé sur leurs mois d'historique. Données dans `manuora.grow` (incluses dans la sauvegarde).

## Première ouverture et menu

- **Bienvenue en deux écrans** : on nomme le manu et on choisit sa couleur, puis deux choses à savoir (pas un soin médical, données sur le téléphone). En fermant, le manu propose tout de suite la ronde des couleurs.
- **Première semaine guidée** : chaque nouveau jour d'utilisation, le manu présente une porte de plus (le défi du jour, le faʻaʻapu, respirer, le cœur lié, les lieux, le ciel). Rien n'est verrouillé : tout reste accessible dans le menu, l'entrée du jour porte l'étiquette « Nouveau ». Les pastilles jardin, coffre et ciel en haut de l'écran n'apparaissent qu'une fois ces portes ouvertes (ou quand une récolte attend).
- **Un seul menu** : le bouton « Menu » de l'écran calme ouvre toutes les entrées avec un libellé et une ligne d'explication. Sur l'écran calme ne reste que « Trop de stress ? », le filet de sécurité.
- **Partager l'appli** : dans le menu, envoie le lien du site (partage du téléphone, ou copie du lien).
- **Accessibilité** : contrastes des boutons conformes (texte blanc sur bleu foncé, corail plus profond), zones tactiles d'au moins 44 px, petits textes agrandis. Vérifié avec axe-core : zéro violation WCAG 2 A/AA sur l'écran calme, le menu et l'accueil.
- **Polices locales** : Fredoka et Nunito sont dans le dossier `fonts/` (148 Ko), mises en cache hors ligne. Plus aucun appel à Google Fonts.
- **Version des données** : la clé `manuora.v` (actuellement 2) permet de migrer les anciennes données lors des prochaines mises à jour. Les utilisateurs existants gardent tout et voient toutes les portes ouvertes.

## Comment ça marche

**Mode veille (écran par défaut).** Le manu se repose dans un coin de l'écran (choix du coin dans « Mon manu »). En haut à gauche, un petit cœur se remplit des couleurs de la journée ; en haut à droite, « ≡ » ouvre tout Manu Ora (point complet, mots, personnalisation, aide).

- **Touche deux fois** le manu (ou l'écran) : une ronde de couleurs apparaît, une par émotion, en reo tahiti. Touche une couleur : elle s'ajoute au cœur. Le point noir « idées noires » ouvre directement l'aide.
- **Touche une fois** : petit menu (point complet, respirer, ukulele, mon cœur).
- **Caresse-le** lentement avec le doigt : il ferme les yeux et t'invite à respirer.
- **De temps en temps** (toutes les 2 h sans nouvelle, et 12 s après l'ouverture si rien n'a été noté depuis 2 h), le manu vole au centre de l'écran et demande « E aha tō 'oe huru ? ».
- **Le cœur** : touche-le pour voir la journée heure par heure, les 7 derniers jours, et les cœurs liés.

**Limite importante.** Une application web ne peut pas s'afficher *par-dessus* les autres applis du téléphone. Le manu vit donc dans Manu Ora, pas sur l'écran d'accueil ni sur WhatsApp. Pour cela, il faudrait une vraie application Android (permission « Afficher par-dessus d'autres applis ») ; iPhone ne le permet pas du tout.

## Plumes et boutique

Tout est enregistré sur le téléphone (pas de compte, pas d'e-mail, pas de mot de passe). Si la personne efface les données du navigateur ou change de téléphone, les plumes repartent de zéro.

| Pour gagner | Plumes |
|---|---|
| Journée complète : une couleur dans le cœur + une activité | 10 |
| Chaque activité (respirer, caresser, ukulele, point complet), 3 par jour au plus | 1 |
| Tous les 7 jours d'utilisation (au total, pas forcément d'affilée) | 20 de plus |
| Premier cœur lié avec un ami | 10 |

| Pour débloquer | Prix |
|---|---|
| Couleur de plumage (3 gratuites) | 10 |
| Tātau | 30 |
| Parure : hei, pāpale, 'aute, lunettes, pūpū, poe, pāreu (tiare gratuite) | 50 |
| Animation : 'ori, salto | 100 |
| Animal : honu | 150 |

Respirer, faire le point et l'aide ne sont jamais verrouillés.

**Veille.** Le manu dort dans son coin (yeux fermés, « z »). Un appui long permet de le prendre et de le poser n'importe où ; il réagit et garde cette place.

## Faʻaʻapu (le jardin)

**Mise à jour** : les plantes ont été redessinées (pousse, jeune plant, plante mûre propres à chaque espèce) et le jardin compte maintenant **9 parcelles** et **12 plantes** : tiare, ʻaute, tīpaniē, meiʻa, painapo, ʻīʻītā, taro, vī, ʻānani, ʻuru, vānira et haʻari. Quatre recettes s'ajoutent à l'atelier : hei tīpaniē, jus de fruits frais, poʻe taro, et une recette secrète à la vānira.

Six emplacements. On plante une graine, elle pousse avec le temps réel (appli ouverte ou non), puis on récolte. Rien ne meurt : un fruit mûr attend.

| Plante | Mûre en | Vaut |
|---|---|---|
| tiare | 1 jour | 5 plumes |
| ʻaute | 2 jours | 8 plumes |
| meiʻa (banane) | 3 jours | 12 plumes |
| vī (mangue) | 5 jours | 20 plumes |
| ʻuru | 7 jours | 30 plumes |

- **Graines :** 2 tiare et 1 ʻaute au départ ; une graine à chaque journée complète ; une graine reçue avec chaque fruit offert par un ami.
- **Récolte :** « Échanger » contre des plumes, ou « Offrir » à un ami lié. L'ami reçoit les plumes et une graine ; celui qui offre récupère une graine.
- Le jardin est enregistré sur le téléphone ; seuls les cadeaux passent par Firebase.

### Coffre et atelier

À la récolte, « Mettre au coffre » range la fleur ou le fruit. Le coffre s'ouvre depuis le bouton à côté des plumes. Dans l'atelier, on choisit les quantités de chaque ingrédient et on mélange : le dosage décide du résultat. Un mélange inconnu ne fait rien perdre.

| Création | Recette | Temps | Vaut | Aura (1 jour) |
|---|---|---|---|---|
| Hei tiare | 5 tiare | tout de suite | 30 | turquoise · la paix |
| Hei ʻārearea | 3 tiare + 2 ʻaute | tout de suite | 35 | rose · la tendresse |
| Salade de fruits | 1 meiʻa + 1 vī + 1 coco | tout de suite | 50 | orange · la joie |
| Poʻe meiʻa | 2 meiʻa + 1 coco | tout de suite | 40 | jaune · la gratitude |
| Monoï tiare | 3 tiare + 1 coco | 3 jours | 40 | dorée · le soin de soi |
| Monoï ʻaute (secrète) | 2 tiare + 1 ʻaute + 1 coco | 3 jours | 55 | rouge · le courage |
| Monoï ānuanua (secrète) | 3 tiare + 1 ʻaute + 1 vī + 1 coco | 4 jours | 90 | arc-en-ciel · l'espoir |

Les recettes secrètes apparaissent comme « ??? » avec un indice dans le carnet, jusqu'à ce qu'on les trouve. Chaque création peut être utilisée (aura sur son manu ; les monoï ouvrent en plus « Un moment pour toi »), offerte à un ami lié (l'aura va à son manu) ou échangée contre des plumes. Le haʻari (cocotier) mûrit en 4 jours ; une graine au départ, puis une tous les 7 jours.

### Étoile de confiance

Quand quelqu'un choisit un ami comme personne de confiance, son manu lui porte une étoile qui brille en haut de l'écran de veille. En la touchant, l'ami lit ce que cela veut dire et peut la garder ou la rendre. S'il la rend, la personne est prévenue et peut choisir quelqu'un d'autre.

## Trop de stress · calmer la tempête

Un bouton corail « Trop de stress ? » est toujours visible sur l'écran calme (aussi dans le petit menu du manu et sur la carte d'accueil). Il ouvre un guide court, en quatre pas :

1. **Souffler** – un cercle guide la respiration (expirer plus longtemps qu'inspirer).
2. **Relâcher le corps** – poings, épaules, mâchoire.
3. **Revenir ici** – 3 choses que je vois, 2 que j'entends, 1 que je touche.
4. **Nommer** – choisir le mot qui va avec la tension ; il colore le cœur du jour.

La personne note sa tension de 1 à 5 avant et après, voit la différence, reçoit quelques conseils pour la suite (boire de l'eau, bouger, parler à un ama, attendre avant de répondre à un message) et gagne une plume. Si la tension reste à 4 ou 5, le manu propose l'écran d'aide (numéros d'urgence). Ce guide ne remplace pas un professionnel : les textes sont à faire relire par un·e psychologue.

## Les lieux du jour

Sur l'écran calme, le bouton « Choisir un lieu » (aussi dans le petit menu du manu et sur l'accueil) propose quatre décors de jour, chacun avec une petite animation et une activité. « Écran simple » garde l'écran sans décor. La nuit, le ciel étoilé reprend la place du décor.

| Lieu | Animation | Activité |
|---|---|---|
| **Te vai** · la montagne et la rivière | cascade, eau qui coule, feuille qui descend, deux puhi (anguilles) qui nagent | *Poser un souci sur la rivière* : écrire ce qui pèse (rien n'est gardé), dire si cela dépend de soi ou non, recevoir un conseil adapté |
| **Tahatai** · la plage | vagues, pirogue, cocotier | *Trois coquillages* : trois bonnes choses de la journée, gardées sur le téléphone et relisibles les jours difficiles |
| **Te ʻoire** · la ville | truck et voiture qui passent, roulotte | *Dire non, sans se fâcher* : quatre situations de pression du groupe, trois réponses possibles, un retour sur chacune |
| **Te fare haʻapiʻiraʻa** · l'école | ballon, arbre | *Un moment difficile à l'école* : le trac, une dispute (phrase en « je »), les moqueries (victime, témoin, auteur) |

Chaque activité terminée donne une plume (dans la limite de trois par jour). Les textes sur les moqueries et la pression du groupe sont à faire relire en priorité par un·e psychologue ; les noms de lieux en reo tahiti par un locuteur.

**Jour ou nuit** : l'apparence claire ou sombre suit l'heure (clair de 6 h à 18 h), et non plus le thème sombre du téléphone. Dans « Choisir un lieu », trois boutons permettent de forcer : Automatique, Toujours le jour, Toujours la nuit.

## Compost et faʻaʻapu partagé

- **Compost** (recette : 1 coco + 1 meiʻa) : dans le faʻaʻapu, le bouton « Compost · −1 j » sur une plante qui pousse la fait mûrir un jour plus tôt.
- **Faʻaʻapu partagé** : avec chaque cœur lié (lien accepté des deux côtés), un champ commun. Deux plantes n'existent que là : la **tiare ʻāpetahi** (5 jours à deux) et le **ʻāhiʻa** (3 jours à deux). Un jour ne compte que si **les deux** ont arrosé ce jour-là ; un oubli ne fait rien perdre. À la récolte, chacun reçoit exactement la même chose (plumes, et un hei ʻāpetahi ou une graine). Le manu prévient quand l'ami·e a arrosé.
- **Règles Firebase à mettre à jour** : le champ partagé utilise un nouveau chemin `gardens/`. Recoller le contenu de `firebase-regles.json` dans la console Firebase (Realtime Database › Règles), sinon le champ partagé reste injoignable. Le reste de l'appli n'est pas touché.
- À valider avec une personne ressource : la tiare ʻāpetahi est une fleur protégée et chargée de sens à Raʻiātea ; vérifier qu'il est acceptable d'en faire une plante de jeu et un hei.

## Les airs de ukulele

Le bouton Ukulele ouvre un choix de cinq airs. Ce sont des airs **originaux**, écrits pour Manu Ora dans l'esprit des musiques du fenua ; aucune chanson existante n'est reprise. Ils se débloquent en prenant soin de soi, jamais avec des plumes.

| Air | Caractère | Se débloque avec |
|---|---|---|
| Pehe mātāmua | le premier air | dès le début |
| ʻAparima | lent et doux | 3 journées complètes |
| Tāʻiri pāʻumotu | frappe très rapide, son clair du ukulele tahitien | 6 émotions différentes nommées |
| Pehe tōʻere | tambour de bois (tōʻere) et pahu, le ukulele répond | 3e stade du manu |
| Hīmene pō | berceuse à trois temps | 5 étoiles apprises dans Te raʻi |

Les sons sont fabriqués dans le navigateur (aucun fichier audio). Noms et styles à faire valider par un musicien du fenua.

## L'heure du coucher

À partir de 22 h (réglable : 21 h, 22 h, 23 h ou jamais, dans Menu › Heure du coucher) et jusqu'à 5 h :

- le manu bâille et invite **une seule fois par nuit** : « Il est tard… Moi je vais dormir. Et toi ? » avec deux réponses, **Bonne nuit** ou **J'ai besoin de parler** ;
- « Bonne nuit » ouvre un court rituel (pourquoi dormir aide, trois souffles, poser le téléphone loin de l'oreiller, la berceuse Hīmene pō si elle est débloquée), puis le manu s'endort ;
- « J'ai besoin de parler » : le manu reste et ouvre la ronde des couleurs. Aucun reproche ;
- la nuit, le manu ne propose plus ni défi, ni nouveauté, ni rappel de sauvegarde, et ne vient plus demander de lui-même comment ça va ;
- **rien n'est jamais verrouillé** : toucher le manu endormi le réveille, avec un menu de nuit (respirer, dire comment je me sens, trop de stress, bonne nuit, aide). C'est voulu : la nuit est aussi le moment où la détresse est la plus forte.

## Te tere (le voyage)

Le fil conducteur de l'appli : une lune, quatre étapes d'environ une semaine, calées sur la phase de la lune.

| Étape | Lune | Thème | Compétence |
|---|---|---|---|
| 1 | nouvelle lune → premier quartier | ʻIte · se connaître | repérer et nommer ce que je ressens |
| 2 | premier quartier → pleine lune | Mau · tenir bon | laisser passer la vague avant d'agir |
| 3 | pleine lune → dernier quartier | Aroha · voir l'autre | deviner ce que l'autre ressent, puis vérifier |
| 4 | dernier quartier → lune noire | Tāhōʻē · se relier | dire les choses qui rapprochent |

- **Défi du jour :** trois propositions, on en choisit une (ou aucune), on la fait dans la vraie vie, puis « C'est fait ».
- **Question de l'étape :** ouverte après trois défis ; la réponse va dans le carnet de bord, sur le téléphone.
- **Îles :** une île atteinte quand deux étapes sont franchies dans la même lune (+20 plumes).
- **Ni note ni niveau.** Une absence ne fait rien perdre.

**Ce que dit la recherche, et comment c'est appliqué**

- Les programmes efficaces sont *séquencés, actifs, focalisés, explicites* (critères SAFE ; méta-analyse Durlak et al. : effet moyen 0,31 avec les quatre critères, 0,07 sans). D'où : étapes dans un ordre, défis à faire et non à lire, une compétence par semaine, nommée clairement.
- Santé publique France retient les mêmes critères, plus une pédagogie positive et expérientielle et un environnement qui soutient.
- Les cinq compétences RULER (Yale) : reconnaître, comprendre, nommer, exprimer, réguler. Elles sont réparties sur les quatre étapes.
- Chez les adolescents, les programmes qui « font la leçon » perdent leur effet ; ce qui marche respecte leur autonomie et les traite en personnes compétentes (Yeager, Dahl et Dweck, 2018). D'où : le choix du défi, le droit de passer, le ton sans morale, et la question d'étape qui demande leur conseil pour quelqu'un de plus jeune.

**Limite :** ces résultats viennent de programmes menés en groupe avec des adultes formés. Une appli seule fera moins. Te tere donnera le meilleur s'il sert de support à un groupe (classe, groupe de jeunes) avec un adulte. Le contenu des défis est un premier jet à faire relire par un·e psychologue ou un·e éducateur·rice ; les noms d'étapes en reo sont à valider.

## Te raʻi (le ciel)

Une carte du ciel simplifiée avec onze repères nommés en reo tahiti : Matariʻi (Pléiades), Tauhā (Croix du Sud), Nāmatarua (Alpha et Bêta du Centaure), Te Matau a Māui (Scorpion), ʻAna-mua (Antarès), Tautoru (Baudrier d'Orion), ʻAna-varu (Bételgeuse), Taʻurua-faupapa (Sirius), Pīpiri mā (Castor et Pollux), Te Vaiora (Voie lactée), Marama (Lune).

- **Explorer :** toucher une étoile affiche son nom, son sens et une courte histoire.
- **Jouer :** « Où est Tauhā ? » ; cinq questions, une plume par partie (dans la limite de 3 activités par jour), et un compteur d'étoiles connues.
- **La lune ce soir :** phase calculée, dessinée comme on la voit dans l'hémisphère sud.

### Le ciel qui se remplit, les cadeaux du ciel, mes ʻana

- **Ciel de nuit :** de 18 h à 6 h (réglable : toujours, jamais), l'écran de veille devient un ciel étoilé avec la lune du soir. Chaque étoile trouvée du premier coup dans le jeu s'y allume pour de bon.
- **Cadeaux du ciel (ne s'achètent pas) :** trois tātau gagnés en trouvant Tauhā, Te Matau a Māui et Matariʻi ; le plumage de nuit quand on connaît les onze étoiles.
- **Offrir une étoile :** une étoile connue peut être offerte à un ami lié, avec un message choisi parmi six (« Je pense à toi », « Merci d'être là », « Courage, je suis avec toi », « Je suis fier·e de toi », « Pardon », « Tu me manques »). Elle s'allume dans le ciel de l'ami.
- **Mes ʻana :** jusqu'à dix piliers personnels (une personne, un lieu, une chose qui tient debout). Chacun devient une étoile dans le ciel, sans nom affiché sur l'écran de veille, et la liste apparaît sur l'écran d'aide. Ils restent sur le téléphone.

Sources des noms : All Skies Encyclopaedia (page « Tahiti ») et une présentation de J.-C. Teriierooiterai (UCLA, 2015). Les noms varient selon les îles et les auteurs (Sirius : Taʻurua-faupapa ou Taʻurua-nui-i-te-amo-ʻaha ; Scorpion : hameçon de Māui ou de Tafaʻi). À faire valider localement, de même que : Sirius comme ʻaveiʻa de Tahiti, les noms de nuits de lune cités (Tireo, Hotu, Māraʻi, Mutu) et la légende de Pīpiri mā.

## Lier son cœur à un ami (optionnel)

Le partage des couleurs demande un tout petit serveur. Version gratuite avec Firebase :

1. Sur https://console.firebase.google.com, créer un projet (ex. `manu-ora`).
2. Menu « Realtime Database » → Créer une base → choisir une région → démarrer en **mode test**.
3. Copier l'URL de la base (elle ressemble à `https://manu-ora-default-rtdb.europe-west1.firebasedatabase.app`).
4. Dans `index.html`, chercher la ligne `const SYNC_URL = '';` et coller l'URL entre les guillemets. Envoyer le fichier sur GitHub.
5. Onglet « Règles » de la base, remplacer par :

```json
{ "rules": { "hearts": { "$code": { ".read": true, ".write": true, ".validate": "newData.hasChildren(['day','updated'])" } }, "visits": { "$to": { ".read": true, "$from": { ".write": true, ".validate": "newData.hasChildren(['g','t'])" } } } } }
```

**Accord et coupure du lien.** Entrer le code d'un ami envoie une *demande*. L'ami la voit dans « Cœurs liés » et choisit Accepter ou Refuser. Tant qu'il n'a pas accepté, personne ne voit le cœur de l'autre. Chacun peut « Couper le lien » à tout moment ; la personne coupée ne peut plus envoyer de demande, sauf si on entre soi-même son code. En cas d'abus, « Changer mon code » rend l'ancien code inutilisable. Limite : ces protections sont appliquées par l'application ; la base de test reste lisible par quelqu'un qui connaît un code et sait interroger Firebase directement.

**Prévenir une personne de confiance.** Dans « Cœurs liés », on peut désigner jusqu'à deux amis liés comme personnes de confiance. Sur l'écran d'aide (idées noires), un bouton propose alors « Oui, préviens … ». Rien n'est envoyé automatiquement : c'est toujours la personne qui appuie. L'ami voit arriver le manu avec « … a besoin de toi » et un écran de conseils (appeler, écouter, prévenir un adulte, le 15). Le message ne mentionne ni suicide ni dépression. Il n'est vu qu'à l'ouverture de Manu Ora : pour une urgence, il faut appeler. À faire relire par un·e psychologue avant diffusion.

**Rencontre des manu.** Quand deux personnes ont chacune entré le code de l'autre et coché « Partager », un bouton « Envoyer un signe » apparaît (salut, câlin, fleur de tiare, air de ukulele). Le manu de l'ami vient alors en visite sur l'écran de l'autre, avec son apparence et la couleur de son cœur du jour. Pas de messages écrits : uniquement ces gestes.

Ensuite, dans l'appli : cœur → « Cœurs liés » → cocher « Partager », donner son code à l'ami, et entrer le sien. Seules les couleurs du jour sont partagées (jamais les notes), sous un code aléatoire sans nom ni téléphone. C'est un prototype : pour une vraie mise en service, prévoir des règles d'accès plus strictes.

**Le manu porte lui-même les signes.** Quand on envoie un salut, un câlin ou un cadeau, le manu s'envole et quitte l'écran. Un petit message indique chez qui il est parti. Il revient tout seul après une à deux minutes ; on peut aussi toucher le message pour le rappeler tout de suite.

## Sauvegarde

Les données vivent dans le navigateur du téléphone. Si le navigateur est vidé, réinitialisé ou remplacé, elles disparaissent. Dans **Confidentialité › Sauvegarde** :

- **Enregistrer une sauvegarde** télécharge un fichier `manu-ora-sauvegarde-AAAA-MM-JJ.json` (cœur, notes, plumes, jardin, coffre, étoiles, apparence du manu, code et cœurs liés).
- **Restaurer une sauvegarde** relit ce fichier, sur le même appareil ou sur un autre. Le lien est aussi proposé sur l'écran de bienvenue.
- **Rappel** : quand la dernière sauvegarde a plus d'une semaine, un bouton « Sauvegarder ma progression » apparaît en haut de l'écran. Un appui enregistre le fichier ; la croix repousse le rappel de trois jours. Le rythme se règle dans Confidentialité : chaque semaine, chaque mois ou jamais.
- Une sauvegarde entièrement automatique n'est pas possible dans un navigateur de téléphone : il faut toujours un appui de la personne.

Le fichier n'est pas chiffré : il contient les notes personnelles. Ne pas restaurer la même sauvegarde sur deux appareils utilisés en même temps (ils auraient le même code de cœur).

## Lancer le site

Tout tient dans `index.html` (pas de serveur, pas de compte). Les données restent dans le téléphone (localStorage).

- En ligne : https://brian-1844.github.io/manu-ora/
- Sur téléphone : ouvrir le lien, puis « Ajouter à l'écran d'accueil ». L'appli fonctionne ensuite hors ligne (service worker).

## Fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | l'application complète (HTML, CSS, JS) |
| `manifest.webmanifest` | installation sur l'écran d'accueil |
| `sw.js` | cache hors ligne |
| `icon.svg` | icône |

## À faire avant de la donner à de vrais utilisateurs

1. Faire valider le vocabulaire tahitien et les libellés « Reo » par des locuteurs (Fare Vāna'a).
2. Vérifier par téléphone les numéros d'aide (SOS Suicide Polynésie, 3114 depuis le fenua) et les mettre à jour chaque année.
3. Faire relire le mode « idées noires » par un·e psychologue.
4. Co-concevoir avec des jeunes et des matahiapo (anciens) : histoires, motifs, parures.

## Idées pour la suite

- Versions pa'umotu, marquisienne, australe.
- Petites histoires à choix ('a'amu) pour apprendre à reconnaître les émotions chez les autres.
- Mode école / groupe de jeunes, en lien avec le label « École en santé ».

## Avant un partage public

- **Bienvenue et confidentialité :** au premier lancement, l'appli affiche « Manu Ora n'est pas un soin médical » et un résumé des données. La page « Confidentialité » (lien en bas de l'accueil et dans « Cœurs liés ») détaille ce qui reste sur le téléphone, ce qui est partagé, et propose « Tout effacer ».
- **Règles Firebase renforcées :** le fichier `firebase-regles.json` remplace les règles de test. Il refuse tout ce qui n'a pas la forme attendue (codes de 8 caractères, textes courts, champs connus) et interdit de lister les codes. Les liens entre cœurs continuent de fonctionner.
- **Licence :** voir `LICENSE` (tous droits réservés).
- **Restent à faire par des personnes :** vérifier les numéros d'aide par téléphone, relecture par un·e psychologue, validation du reo tahiti, avis sur les données personnelles de mineurs.
