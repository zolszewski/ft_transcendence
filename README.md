## Disaster recovery

### Où sont les sauvegardes

Le service `backup` écrit une sauvegarde compressée toutes les heures dans `platform/backups/`, au format `academic-AAAAMMJJ-HHMMSS.sql.gz`. Seules les 7 plus récentes sont conservées. Ces fichiers ne sont jamais commités (ils sont dans le `.gitignore`).

### Vérifier que les sauvegardes tournent

```bash
docker compose -f platform/docker-compose.yml ps backup
ls -lh platform/backups/
```

### Choisir la sauvegarde à restaurer

Liste les sauvegardes disponibles, puis copie le nom du fichier voulu. Ne le tape pas à la main : une faute de frappe ou un retour à la ligne dans le collage fait échouer la commande.

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

**3. Restaurer** (remplace `NOM_DU_FICHIER` par le nom choisi plus haut) :

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

En cas d'échec, restaure le fichier `pre-restore-*` créé à l'étape 1, avec la même commande qu'à l'étape 3.

Les sessions utilisateur sont stockées dans Redis, qui n'est pas sauvegardé : après une restauration, les utilisateurs doivent se reconnecter.

### Paramètres

Ils se règlent dans `platform/.env` (voir `platform/.env.example`) :

- `BACKUP_INTERVAL` : intervalle entre deux sauvegardes, en secondes (3600 par défaut).
- `BACKUP_KEEP` : nombre de sauvegardes conservées (7 par défaut).

Après modification, recrée le conteneur de sauvegarde : `docker compose -f platform/docker-compose.yml up -d backup`.
