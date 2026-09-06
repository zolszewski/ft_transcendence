# Regarder mes tables directement dans PGSQL

On ne fait pas directement nous même les modifications de la BDD, on le fait par l'intermédiaire de prisma et de ses commandes avec son fichier de schéma.

## D'abord entrer dans le conteneur

```bash
docker compose exec postgresql psql -U academic -d academic
```


## Afficher les tables

```PGSQL
\dt
\dt+
```

## Afficher le contenu d'une table

```PGSQL
SELECT * FROM "Conversation";
```