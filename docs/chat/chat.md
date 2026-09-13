# Première fonctionnalité du chat (le chat n'envoir pas encore de message : cette étape prépare la sélection du destinataire)

la liste des utilisateurs disponibles :
- création de la route authentifiée GET/api/users;
- exclusion automatique de l'utilisateur connecté
- protection avec resuireAuth;
- ajout d'un service Prsima pour récupérer les utilisateurs;
- retour uniquement de id, email et name (et non de mdp);
-tri des utilisateurs par nom;
- branchement de la route dans le serveur Express


fichiers

user.routes.ts  > platform/bacjkend/src/routes
server.ts >  platform/backend/src
user.services.ts > platform/backend/src/services

# l'API du chat 
-récupérer les messages;
-envoyer un message;
-valider 