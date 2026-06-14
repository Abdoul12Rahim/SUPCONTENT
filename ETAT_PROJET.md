# État du projet SUPCONTENT

Dernière mise à jour: 27 avril 2026

## Résumé rapide

- Backend: opérationnel et démarrable en local.
- Frontend web: implémenté avec routes, contextes et pages principales.
- Mobile principal (dossier mobile): base Expo/React Native existante, encore en développement.
- Nouveau mobile collaborateur (dossier Supcontent-mobile-app): squelette Expo ajouté récemment via GitHub.

## Changements GitHub intégrés récemment

Commits récupérés sur main:
- 5369779 (Agkader): Initialisation de l'application mobile React Native.
- 10dc131 (Abdoul12Rahim): Merge PR #1 de la branche mobile.

Impact concret:
- Ajout d'un nouveau dossier: Supcontent-mobile-app.
- Fichiers ajoutés: App.js, index.js, app.json, package.json, package-lock.json, assets Expo.

## État par composant

### Backend (backend)

- API Express + TypeScript en place (controllers, routes, services, modèles).
- Connexion MongoDB et WebSocket configurés.
- Endpoint santé disponible: /health.
- Ajustement de compatibilité TypeScript effectué dans tsconfig.json (module et moduleResolution en Node16).

### Frontend Web (web)

- Stack active: React + Vite + TypeScript + Chakra UI + React Query + React Router.
- Routing avancé déjà en place (home, games, feed, reviews, profil, messages, notifications, achievements, listes collaboratives).
- Le frontend web n'est pas vide, il est déjà structuré et partiellement fonctionnel.

### Mobile principal (mobile)

- Projet Expo TypeScript présent.
- Arborescence métier présente (components, contexts, navigation, screens, services).
- Écran d'entrée encore simple, indiquant un développement en cours.

### Mobile collaborateur (Supcontent-mobile-app)

- Projet Expo JavaScript indépendant ajouté récemment.
- Démarrage validé en local (Expo/Metro).
- Visualisation possible:
- Web: http://localhost:8081
- Expo Go: via QR terminal (exp://...)

## Exécution locale validée

Backend:
- npm --prefix backend run dev
- Santé: http://localhost:5000/health

Web:
- npm --prefix web run dev -- --host 0.0.0.0 --port 3000
- URL: http://localhost:3000

Mobile collaborateur:
- npm --prefix Supcontent-mobile-app start
- Expo Web: http://localhost:8081

## Points d'attention

- Un seul processus doit occuper le port 5000 (sinon erreur EADDRINUSE).
- Le projet Supcontent-mobile-app remonte des warnings de versions Expo (non bloquants pour un test rapide).
- Le fichier backend/tsconfig.json est actuellement modifié localement (non commité).

## Prochaines priorités conseillées

1. Décider quelle app mobile conserver comme base officielle: mobile ou Supcontent-mobile-app.
2. Harmoniser les versions Expo/React Native sur l'app mobile retenue.
3. Centraliser la documentation de démarrage pour éviter les doublons entre les deux apps mobiles.
4. Préparer un commit de stabilisation (tsconfig backend + état projet + éventuels scripts de lancement).
