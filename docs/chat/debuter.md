Pour construire le chat, commence par une version simple et fiable : messages privés, sauvegardés en base, récupérés périodiquement. Le temps réel avec WebSocket viendra ensuite.

1. Liste des utilisateurs (ta première tâche dans `PROGRESS.md`)

Ajoute `GET /api/users`, protégé par `requireAuth`, qui renvoie tous les utilisateurs sauf celui connecté. Ne jamais renvoyer `password`.

2. Modèle de données Prisma

Dans `platform/backend/prisma/schema.prisma`, ajoute un modèle de message :

```prisma
model Message {
  id         String   @id @default(cuid())
  content    String
  senderId   String
  recipientId String
  createdAt  DateTime @default(now())

  sender    User @relation("SentMessages", fields: [senderId], references: [id])
  recipient User @relation("ReceivedMessages", fields: [recipientId], references: [id])

  @@index([senderId, recipientId, createdAt])
}
```

Et complète `User` :

```prisma
sentMessages     Message[] @relation("SentMessages")
receivedMessages Message[] @relation("ReceivedMessages")
```

Puis applique le schéma avec `npm run prisma:push` dans `platform/backend`.

3. API de chat

Crée `platform/backend/src/routes/chat.routes.ts` :

- `GET /api/chat/:userId` : récupère la conversation entre l’utilisateur connecté et `userId`.
- `POST /api/chat/:userId` : crée un message, avec `senderId = req.session.userId`.
- Contrôles indispensables : destinataire existant, contenu non vide et longueur maximale.

Enregistre ensuite la route dans `server.ts` :

```ts
app.use("/api/chat", chatRoutes);
```

4. Frontend

Crée une page `platform/app/app/chat/page.tsx` avec :

- une colonne de gauche : utilisateurs ;
- une colonne de droite : messages avec l’utilisateur sélectionné ;
- un champ de saisie et un bouton « Envoyer ».

Le navigateur peut appeler :

```ts
fetch(`/api/chat/${selectedUser.id}`, {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content }),
});
```

5. Temps réel, ensuite

Pour une première version, recharge les messages toutes les 2–3 secondes avec `setInterval`. Une fois cela fonctionnel, vous pourrez ajouter Socket.IO pour recevoir les messages instantanément.

Je te conseille de commencer maintenant par `GET /api/users`, puis le schéma `Message`. Si tu veux, je peux implémenter cette première étape directement sur ta branche `chat`.