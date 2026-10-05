## Disaster recovery

### Où sont les sauvegardes

Le service `backup` écrit une sauvegarde compressée toutes les heures dans `platform/backups/`, au format `academic-AAAAMMJJ-HHMMSS.sql.gz`. Seules les 7 plus récentes sont conservées. Ces fichiers ne sont jamais commités (ils sont dans le `.gitignore`).

### Vérifier que les sauvegardes tournent

```bash
docker compose -f platform/docker-compose.yml ps backup
ls -lh platform/backups/
```

### Choisir la sauvegarde à restaurer

Lister les sauvegardes disponibles, puis copier le nom du fichier voulu.

```bash
ls -lh platform/backups/
```

Dans les commandes ci-dessous, `NOM_DU_FICHIER` désigne ce nom, sans le dossier (par exemple `academic-20261004-211612.sql.gz`).

### Tester une restauration (base de test)

Cet exercice restaure la sauvegarde dans une base séparée, `academic_restore_test`. La base réelle n'est pas modifiée.

```bash
docker compose -f platform/docker-compose.yml run --rm -e F=NOM_DU_FICHIER --entrypoint sh backup -c '
  createdb academic_restore_test &&
  gunzip -c /backups/$F | psql -q -v ON_ERROR_STOP=1 -d academic_restore_test &&
  psql -d academic_restore_test -tA -c "SELECT count(*) FROM \"User\";"'
```

Si le nombre affiché correspond à ce que la sauvegarde doit contenir, la sauvegarde est exploitable.

Pour supprimer la base de test ensuite :

```bash
docker compose -f platform/docker-compose.yml run --rm --entrypoint sh backup -c 'dropdb academic_restore_test'
```

### Restaurer la base réelle

**Attention** : toutes les données créées après la sauvegarde seront perdues.

**1. Sauvegarder l'état actuel.** Ce fichier porte le préfixe `pre-restore-`, donc la rétention ne le supprime pas. Il permet de revenir en arrière si la restauration se passe mal :

```bash
docker compose -f platform/docker-compose.yml exec -T backup sh -c 'pg_dump --clean --if-exists | gzip > /backups/pre-restore-$(date +%Y%m%d-%H%M%S).sql.gz'
```

**2. Arrêter les services qui écrivent dans la base** (le backend et les sauvegardes automatiques) :

```bash
docker compose -f platform/docker-compose.yml stop backend backup
```

**3. Restaurer** (remplacer `NOM_DU_FICHIER` par le nom choisi plus haut) :

```bash
docker compose -f platform/docker-compose.yml run --rm -e F=NOM_DU_FICHIER --entrypoint sh backup -c 'gunzip -c /backups/$F | psql -q -v ON_ERROR_STOP=1 -d academic'
```

`ON_ERROR_STOP=1` arrête la restauration à la première erreur, au lieu de laisser la base à moitié restaurée.

**4. Vérifier les données :**

```bash
docker compose -f platform/docker-compose.yml exec -T postgresql psql -U academic -d academic -tA -c "SELECT (SELECT count(*) FROM \"User\"), (SELECT count(*) FROM \"Article\");"
```

**5. Redémarrer les services :**

```bash
docker compose -f platform/docker-compose.yml start backend backup
curl -i http://localhost:4000/health
```

Le health check doit répondre `200`.

En cas d'échec, restaurer le fichier `pre-restore-*` créé à l'étape 1, avec la même commande qu'à l'étape 3.

Les sessions utilisateur sont stockées dans Redis, qui n'est pas sauvegardé : après une restauration, les utilisateurs doivent se reconnecter.

### Paramètres

Ils se règlent dans `platform/.env` (voir `platform/.env.example`) :

- `BACKUP_INTERVAL` : intervalle entre deux sauvegardes, en secondes (3600 par défaut).
- `BACKUP_KEEP` : nombre de sauvegardes conservées (7 par défaut).

Après modification, recréer le conteneur de sauvegarde : `docker compose -f platform/docker-compose.yml up -d backup`.

## Health check et page de statut

- `https://localhost:8443/health` renvoie du JSON : `200` si le backend, PostgreSQL et Redis répondent, `503` sinon (statut `degraded`).
- `https://localhost:8443/status` affiche le même état dans une page HTML, rafraîchie toutes les 30 secondes.
- Chaque service est testé avec un délai maximum de 2 secondes, pour qu'un service bloqué ne fasse pas attendre la page.

Vérification :

```bash
curl -sk https://localhost:8443/health
docker compose -f platform/docker-compose.yml stop redis
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:8443/health   # attendu : 503
docker compose -f platform/docker-compose.yml start redis
```

## Pare-feu applicatif (WAF)

Le WAF est intégré à Nginx : ModSecurity (module `libnginx-mod-http-modsecurity`) avec les règles OWASP CRS 3.3.4, en mode bloquant et au niveau de paranoïa 2.

Fichiers concernés :
- `platform/requirements/nginx/dockerfile` : installe le module et les règles, et passe l'action par défaut en `deny`.
- `platform/requirements/nginx/modsec/main.conf` : configuration du moteur, niveau de paranoïa et exclusions.
- `platform/requirements/nginx/nginx.conf` : charge le module et active le WAF sur le bloc HTTPS.

Vérification :

```bash
curl -sk -o /dev/null -w "%{http_code}\n" https://localhost:8443/                                    # attendu : 200
curl -sk -o /dev/null -w "%{http_code}\n" "https://localhost:8443/?q=<script>alert(1)</script>"     # attendu : 403
curl -sk -o /dev/null -w "%{http_code}\n" "https://localhost:8443/?q=1%27%20OR%20%271%27=%271"       # attendu : 403
```

### Faux positifs corrigés

Au niveau de paranoïa 2, les règles bloquaient le HTML légitime envoyé par l'éditeur d'articles. Trois règles ne sont donc pas appliquées au seul champ `content` du JSON :
- **941100** et **941320** (détection XSS) : elles bloquaient les balises HTML du texte (`<p>`, `<strong>`).
- **942130** (détection SQLi) : elle bloquait un texte formaté comme une tautologie SQL.

Ces exclusions ne concernent que le champ `content`. Le backend passe par Prisma, qui envoie les valeurs en requêtes paramétrées : une injection SQL dans ce champ ne peut donc pas modifier une requête. Le risque XSS sur le contenu stocké doit en revanche être traité côté front, en nettoyant le HTML avant affichage.

### Limites connues

- Un XSS envoyé dans un autre champ du corps JSON n'est pas détecté par le WAF dans cette configuration.
- L'accès par adresse IP (`https://127.0.0.1:8443`) est bloqué par la règle 920350 (en-tête `Host` numérique). L'accès normal par `localhost` ne l'est pas.
