ÉTAPE 1
☐ Définir Conversation / Participant / Message
☐ schema.prisma
☐ migration

ÉTAPE 2
☐ GET utilisateurs
☐ GET messages
☐ POST message

ÉTAPE 3
☐ Tester les API

ÉTAPE 4
☐ Créer page chat
☐ Afficher les utilisateurs
☐ Afficher les messages
☐ Envoyer un message

ÉTAPE 5
☐ Ajouter Socket.IO
☐ Recevoir les nouveaux messages en direct

ÉTAPE 6
☐ readAt
☐ inbox
☐ pagination
☐ autres améliorations!



Email	Mot de passe
alice.chat@example.com	motdepasse123
bob.chat@example.com	motdepasse123
chloe.chat@example.com	motdepasse123

système d'amis. 2 points. les utilisateurs peuvent rajouter des amis et voir une page avec les infos des autres users.

Installe le nouveau paquet dans le conteneur du front :

Installer le nouveau paquet dans le conteneur du front : docker compose exec nextjs npm install

Dans ton cas, socket.io-client était bien dans la liste (package.json), mais pas encore téléchargé dans node_modules/. npm install a fait ce téléchargement.

Pourquoi il fallait l'installer : dans docker-compose.yml, le node_modules du front est un volume Docker à part (nextjs_node_modules), créé une seule fois avec les anciens paquets. Mettre à jour package.json ne suffit pas, et même un rebuild ne remplace pas ce volume. Il faut donc lancer npm install dans le conteneur. Tes coéquipiers devront faire la même chose après avoir récupéré la branche :


Pourquoi il fallait l'installer : dans docker-compose.yml, le node_modules du front est un volume Docker à part (nextjs_node_modules), créé une seule fois avec les anciens paquets. Mettre à jour package.json ne suffit pas, et même un rebuild ne remplace pas ce volume. Il faut donc lancer npm install dans le conteneur. Tes coéquipiers devront faire la même chose après avoir récupéré la branche :

Pourquoi il fallait l'installer : dans docker-compose.yml, le node_modules du front est un volume Docker à part (nextjs_node_modules), créé une seule fois avec les anciens paquets. Mettre à jour package.json ne suffit pas, et même un rebuild ne remplace pas ce volume. Il faut donc lancer npm install dans le conteneur. Tes coéquipiers devront faire la même chose après avoir récupéré la branche :

docker exec nextjs npm install
docker restart nextjs


La cause est la même que pour socket.io-client : le node_modules du backend est lui aussi dans un volume Docker. Le client Prisma (le code qui parle à la base) y avait été généré avec un ancien schéma, sans les tables Conversation et Message. Donc prisma.Message n'existait pas.

docker exec backend npx prisma generate   # régénère le client Prisma à partir du schema.prisma actuel
docker restart backend

Test username git config v3
