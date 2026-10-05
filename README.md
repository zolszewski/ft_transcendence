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

## Secrets avec Vault

Les secrets de l'application (secret de session, identifiants GitHub, `DATABASE_URL`) sont stockés dans HashiCorp Vault, et le backend les récupère au démarrage. Ils ne sont pas lus depuis le `.env` par l'application.

Composants :
- `vault` : serveur Vault, stockage fichier dans le volume `platform_vault_data`. Vault chiffre lui-même ses données avant écriture. Il n'est pas exposé à l'extérieur : seuls les services internes y accèdent.
- `vault-init` : bootstrap, lancé à chaque `make`. Il est idempotent : il initialise Vault une seule fois, le déverrouille s'il est scellé, crée le moteur de secrets `secret/`, la politique `backend` (lecture seule sur `secret/app`), et le token du backend. Il ne réécrit jamais les secrets déjà présents.
- `backend/scripts/with-vault.js` : lance le backend (migrations puis serveur) avec les secrets récupérés depuis Vault.

Stockage des éléments sensibles :
- clé de déverrouillage et token racine : volume `platform_vault_keys`, jamais dans git ;
- token du backend : volume `platform_vault_token`, monté en lecture seule dans le backend ;
- secrets applicatifs : chiffrés dans `platform_vault_data`.

### Premier lancement (clone frais)

1. Lance `make` une fois : il crée `platform/.env` à partir de `platform/.env.example`, puis s'arrête.
2. Remplis les valeurs de `platform/.env` (identifiants GitHub, secret de session, `DATABASE_URL`, mot de passe PostgreSQL).
3. Relance `make`.

Le `.env` contient aussi les valeurs que le bootstrap utilise pour remplir Vault la première fois. Si Vault est réinitialisé, il faut donc que ces valeurs soient toujours présentes.

### Redémarrage

Après un redémarrage de Vault, Vault est scellé. Relancer `make` le déverrouille automatiquement via le bootstrap. Sans ce passage, le backend ne peut pas récupérer ses secrets.

Vérification :

```bash
docker compose -f platform/docker-compose.yml exec -T vault sh -c 'VAULT_ADDR=http://127.0.0.1:8200 vault status'
docker compose -f platform/docker-compose.yml logs vault-init
```

### Limites connues

- Le mot de passe superutilisateur de PostgreSQL reste dans le `.env`, car le conteneur PostgreSQL en a besoin à son initialisation, avant que Vault soit prêt.
- Une seule clé de déverrouillage est utilisée, et elle est stockée sur la même machine que Vault. C'est plus simple à automatiser, mais ça ne protège pas contre un accès à la machine.
- Le token racine est conservé dans le volume `platform_vault_keys`. En production, il faudrait le révoquer après le bootstrap.
