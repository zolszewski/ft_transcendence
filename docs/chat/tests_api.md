# Tester l'API du chat (étape 3)

On teste les routes du chat avec `curl`, depuis le terminal, avec deux comptes : Alice et Bob.

Le projet doit tourner (`make up`). Les commandes passent par nginx : `https://localhost:8444`.

## Les options de curl utilisées

| Option | Rôle |
|---|---|
| `-k` | accepte le certificat HTTPS "fait maison" |
| `-X POST` | méthode HTTP (GET par défaut) |
| `-H "Content-Type: application/json"` | on envoie du JSON |
| `-d '{...}'` | les données envoyées |
| `-c fichier.txt` | enregistre le cookie de session (= rester connecté) |
| `-b fichier.txt` | renvoie le cookie (= agir en tant que cet utilisateur) |
| `-w " [%{http_code}]\n"` | affiche le code HTTP de la réponse |

## Codes HTTP

| Code | Signification |
|---|---|
| 200 | OK |
| 201 | créé (message envoyé, compte créé) |
| 400 | données invalides |
| 401 | ps connecté |
| 404 | introuvable |
| 409 | existe déjà (email déjà utilisé) |


# 1. Préparer les comptes

```bash
# variables pour raccourcir les commandes
URL=https://localhost:8444/api
JSON="Content-Type: application/json"
```

## Créer les comptes (201, ou 409 s'ils existent déjà : pas grave)

```bash
curl -k -X POST $URL/auth/register -H "$JSON" \
  -d '{"email":"alice.chat@example.com","name":"Alice","password":"motdepasse123"}'

curl -k -X POST $URL/auth/register -H "$JSON" \
  -d '{"email":"bob.chat@example.com","name":"Bob","password":"motdepasse123"}'
```

## Se connecter (le cookie de chacun est gardé dans un fichier)

```bash
curl -k -c /tmp/alice.txt -X POST $URL/auth/login -H "$JSON" \
  -d '{"email":"alice.chat@example.com","password":"motdepasse123"}'

curl -k -c /tmp/bob.txt -X POST $URL/auth/login -H "$JSON" \
  -d '{"email":"bob.chat@example.com","password":"motdepasse123"}'
```

## Récupérer les id (pour les mettre dans l'adresse des routes du chat)

```bash
ALICE=$(curl -sk -b /tmp/alice.txt $URL/auth/me | sed 's/.*"id":"\([^"]*\)".*/\1/')
BOB=$(curl -sk -b /tmp/bob.txt $URL/auth/me | sed 's/.*"id":"\([^"]*\)".*/\1/')
echo "Alice = $ALICE / Bob = $BOB"
```

On peut aussi copier l'`id` à la main depuis la réponse du login.


# 2. Liste des utilisateurs : `GET /api/users`

```bash
# Alice voit Bob, mais pas elle-même (200)
curl -k -b /tmp/alice.txt $URL/users -w " [%{http_code}]\n"

# sans être connecté (401)
curl -k $URL/users -w " [%{http_code}]\n"
```


# 3. Envoyer et lire des messages : `POST` / `GET /api/chat/:userId`

```bash
# Alice écrit à Bob (201) : les espaces autour du message sont retirés
curl -k -b /tmp/alice.txt -X POST $URL/chat/$BOB -H "$JSON" \
  -d '{"content":"   Salut Bob !   "}' -w " [%{http_code}]\n"

# Bob lit la conversation : il voit le message d'Alice (200)
curl -k -b /tmp/bob.txt $URL/chat/$ALICE -w " [%{http_code}]\n"

# Bob répond (201) : même conversationId que le message d'Alice
curl -k -b /tmp/bob.txt -X POST $URL/chat/$ALICE -H "$JSON" \
  -d '{"content":"Salut Alice !"}' -w " [%{http_code}]\n"

# Alice relit : les deux messages, dans l'ordre (200)
curl -k -b /tmp/alice.txt $URL/chat/$BOB -w " [%{http_code}]\n"
```


# 4. Cas d'erreur

```bash
# message vide (400)
curl -k -b /tmp/alice.txt -X POST $URL/chat/$BOB -H "$JSON" \
  -d '{"content":"   "}' -w " [%{http_code}]\n"

# message à soi-même (400)
curl -k -b /tmp/alice.txt -X POST $URL/chat/$ALICE -H "$JSON" \
  -d '{"content":"Je me parle"}' -w " [%{http_code}]\n"

# destinataire qui n'existe pas (404)
curl -k -b /tmp/alice.txt -X POST $URL/chat/id-inexistant -H "$JSON" \
  -d '{"content":"Il y a quelqu un ?"}' -w " [%{http_code}]\n"

# sans être connecté (401)
curl -k -X POST $URL/chat/$BOB -H "$JSON" \
  -d '{"content":"Message anonyme"}' -w " [%{http_code}]\n"
```


# 5. Pas de conversation en double

Deux utilisateurs qui s'écrivent pour la première fois **au même moment** ne doivent avoir qu'une seule conversation
(grâce à `directKey`, unique dans la table `Conversation`).

On crée un nouveau compte Chloé, puis Alice et Chloé s'envoient 5 messages chacune en parallèle
(le `&` lance chaque commande en arrière-plan, `wait` attend qu'elles soient toutes finies) :

```bash
curl -sk -X POST $URL/auth/register -H "$JSON" \
  -d '{"email":"chloe.chat@example.com","name":"Chloe","password":"motdepasse123"}'
curl -sk -c /tmp/chloe.txt -X POST $URL/auth/login -H "$JSON" \
  -d '{"email":"chloe.chat@example.com","password":"motdepasse123"}'
CHLOE=$(curl -sk -b /tmp/chloe.txt $URL/auth/me | sed 's/.*"id":"\([^"]*\)".*/\1/')

for i in 1 2 3 4 5; do
  curl -sk -o /dev/null -w "%{http_code} " -b /tmp/alice.txt -X POST $URL/chat/$CHLOE -H "$JSON" -d '{"content":"Alice -> Chloe"}' &
  curl -sk -o /dev/null -w "%{http_code} " -b /tmp/chloe.txt -X POST $URL/chat/$ALICE -H "$JSON" -d '{"content":"Chloe -> Alice"}' &
done; wait; echo
```

Résultat attendu : dix `201`. Puis on vérifie que tous les messages sont dans **une seule** conversation
(une seule valeur de `conversationId`) :

```bash
curl -sk -b /tmp/alice.txt $URL/chat/$CHLOE | grep -o '"conversationId":"[^"]*"' | sort | uniq -c
```

Ce test ne marche qu'une fois : ensuite la conversation existe déjà. Pour le refaire, changer l'email de Chloé.


# 6. Vérifier directement dans la base

```bash
# depuis le dossier platform :
docker compose exec postgresql sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

```sql
-- nombre de conversations et de clés différentes : les deux nombres doivent être égaux
SELECT count(*), count(DISTINCT "directKey") FROM "Conversation";

-- les derniers messages
SELECT "senderId", content, "createdAt" FROM "Message" ORDER BY "createdAt" DESC LIMIT 10;
```

`\q` pour quitter.
