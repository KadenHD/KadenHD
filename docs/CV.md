# Export des CV en PDF

Les sources sont `CV_Pierre_Clement.html` et `CV_Pierre_Clement_EN.html`.
La police Nunito et sa licence sont conservées dans `assets/fonts/`.

Avec Node.js 22.12 ou supérieur (`.nvmrc` fixe Node.js 24.21.0), installer les dépendances :

```sh
nvm use
npm ci
```

`nvm use` est facultatif si une version compatible de Node.js est déjà active.

Puppeteer télécharge sa version de Chrome à l’installation. Sous Linux, les
bibliothèques système nécessaires à Chrome doivent être installées.
`PUPPETEER_EXECUTABLE_PATH` permet d’utiliser un navigateur déjà installé.

Régénérer les deux PDF :

```sh
npm run cv:pdf
```

La commande fonctionne depuis n’importe quel répertoire avec :

```sh
npm --prefix /chemin/vers/KadenHD run cv:pdf
```

Dans un conteneur de développement de confiance où le sandbox Chrome
n’est pas disponible :

```sh
npm run cv:pdf -- --no-sandbox
```

Le script attend le chargement de Nunito, utilise les styles d’impression A4
des HTML, conserve la pagination CSS et vérifie que les deux pages tiennent
dans la zone imprimable et que les dates restent sur une ligne.
Il remplace les PDF à la racine une fois les deux exports terminés.
Les textes se modifient dans les HTML ; les PDF sont des fichiers générés.
