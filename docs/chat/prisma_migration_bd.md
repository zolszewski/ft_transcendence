# Regarder les tables et relations

```bash
# Déjà ajouté au make
docker compose exec backend npm exec prisma studio -- --browser none
```


# Migration

Quand le schéma prisma a été modifié, il faut effectuer une migration pour mettre à jour la base de données.

```bash
# depuis le dossier platform :
docker compose exec backend npm exec prisma migrate dev
docker compose exec backend npm exec prisma migrate status
docker compose exec backend npm exec prisma validate
```

ou

```bash
make prisma-migrate
make prisma-validate
```
