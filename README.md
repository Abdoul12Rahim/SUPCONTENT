# UNIVERS GAME - Réseau Social de Jeux Vidéo 🎮

Réseau social de niche dédié aux passionnés de jeux vidéo, permettant de découvrir des jeux, gérer sa collection personnelle et échanger des avis avec la communauté.

## 📋 Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Technologies](#technologies)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [Documentation](#documentation)

## ✨ Fonctionnalités

### Authentification
- ✅ Inscription/Connexion classique (email/mot de passe)
- ✅ OAuth2 (Google, GitHub)
- ✅ Accès public sans compte (lecture seule)

### Bibliothèque Personnelle
- ✅ Statuts prédéfinis : À jouer, En cours, Terminé, Abandonné
- ✅ Listes personnalisées (publiques/privées)
- ✅ Notes personnelles et heures de jeu

### Fiches Jeux & Critiques
- ✅ Informations complètes via API RAWG
- ✅ Notes et critiques détaillées
- ✅ Système de likes et commentaires
- ✅ Marquage spoilers

### Interaction Sociale
- ✅ Système de follow/unfollow
- ✅ Fil d'actualité des amis
- ✅ Notifications temps réel (WebSocket)

### Modération
- ✅ Signalement de contenu
- ✅ Dashboard admin

### Autres
- ✅ Recherche avancée (jeux, utilisateurs, listes)
- ✅ Thème clair/sombre
- ✅ Export données RGPD (CSV/JSON)

## 🛠️ Technologies

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de données**: MongoDB
- **Auth**: JWT, Passport (OAuth2)
- **API externe**: RAWG Video Games Database
- **WebSocket**: Socket.io
- **Validation**: Express-validator
- **Sécurité**: Helmet, Bcrypt

### Frontend Web
- **Framework**: React 18
- **Routing**: React Router v6
- **UI**: Chakra UI
- **État**: Zustand
- **Requêtes**: React Query
- **WebSocket**: Socket.io-client

### Frontend Mobile
- **Framework**: React Native / Expo
- **Navigation**: React Navigation
- **UI**: React Native Paper

### DevOps
- **Containerisation**: Docker, Docker Compose
- **CI/CD**: À configurer (GitHub Actions recommandé)

## 📦 Installation

### Prérequis

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker et Docker Compose (recommandé)
- Compte RAWG API (gratuit) : https://rawg.io/apidocs

### Installation avec Docker (Recommandée)

1. **Cloner le projet**
```bash
git clone https://github.com/votre-username/supcontent.git
cd supcontent
```

2. **Configurer les variables d'environnement**
```bash
cp .env.example .env
# Éditer .env et remplir les clés API
```

3. **Démarrer les services**
```bash
docker compose up
```

L'application sera accessible sur :
- Frontend Web : http://localhost:3000
- Backend API : http://localhost:5000
- MongoDB : localhost:27017

### Installation sans Docker

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# Éditer .env avec vos configurations
npm run dev
```

#### Frontend Web

```bash
cd web
npm install
npm start
```

#### Frontend Mobile

```bash
cd mobile
npm install
npx expo start
```

## ⚙️ Configuration

### 1. Obtenir une clé API RAWG

1. Créer un compte sur https://rawg.io/login
2. Récupérer votre clé API dans les paramètres
3. Ajouter la clé dans `.env` : `RAWG_API_KEY=votre_clé`

### 2. OAuth Google (Optionnel)

1 Aller sur https://console.cloud.google.com/
2. Créer un projet
3. Activer l'API Google+ 
4. Créer des identifiants OAuth 2.0
5. Ajouter les URLs de redirection :
   - `http://localhost:5000/api/auth/google/callback`
6. Ajouter les clés dans `.env`

### 3. OAuth GitHub (Optionnel)

1. Aller sur https://github.com/settings/developers
2. Créer une nouvelle OAuth App
3. Ajouter l'URL de callback : `http://localhost:5000/api/auth/github/callback`
4. Ajouter les clés dans `.env`

### 4. Sécurité

**⚠️ IMPORTANT** : Changez les secrets par défaut en production !

```bash
# Générer des secrets sécurisés
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Utilisation

### Démarrage rapide

```bash
# Avec Docker
docker compose up

# Sans Docker
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - MongoDB
mongod

# Terminal 3 - Frontend
cd web && npm start
```

### Commandes utiles

```bash
# Voir les logs
docker compose logs -f

# Arrêter les services
docker compose down

# Rebuild les containers
docker compose up --build

# Accéder au terminal backend
docker exec -it supcontent-backend sh

# Reset la base de données
docker compose down -v
docker compose up
```

## 🏗️ Architecture

```
supcontent/
├── backend/           # API Node.js/Express
│   ├── src/
│   │   ├── config/    # Configuration (DB, Auth, API)
│   │   ├── models/    # Modèles Mongoose
│   │   ├── controllers/ # Logique métier
│   │   ├── routes/    # Routes Express
│   │   ├── services/  # Services (Auth, API externe)
│   │   ├── middleware/ # Middleware (Auth, Validation)
│   │   └── utils/     # Utilitaires
│   ├── Dockerfile
│   └── package.json
├── web/               # Frontend React
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── Dockerfile
│   └── package.json
├── mobile/            # Frontend React Native
│   └── ...
├── docker-compose.yml
└── README.md
```

### Flux de données

1. **Client** → Requête HTTP → **Backend API**
2. **Backend** → Vérifie JWT → **Middleware Auth**
3. **Backend** → Exécute logique → **Controllers/Services**
4. **Backend** → Query/Update → **MongoDB**
5. **Backend** → Requête si nécessaire → **RAWG API**
6. **Backend** → Réponse JSON → **Client**
7. **Backend** → Notification → **WebSocket** → **Client**

## 📚 Documentation

### Documentation Technique

Voir [DOCUMENTATION_TECHNIQUE.md](./DOCUMENTATION_TECHNIQUE.md) pour :
- Schéma de base de données
- Diagrammes UML (Cas d'utilisation, Séquence)
- API Endpoints
- Architecture détaillée

### Manuel Utilisateur

Voir [MANUEL_UTILISATEUR.md](./MANUEL_UTILISATEUR.md) pour :
- Guide de démarrage
- Tutoriels fonctionnalités
- FAQ

### API Documentation

Les endpoints API principaux :

#### Auth
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

#### Content (Jeux)
- `GET /api/content/search?q=...` - Recherche
- `GET /api/content/:id` - Détails jeu
- `GET /api/content/popular` - Jeux populaires

#### Reviews
- `POST /api/reviews` - Créer critique
- `GET /api/reviews/game/:id` - Critiques d'un jeu
- `POST /api/reviews/:id/like` - Liker

#### Social
- `POST /api/social/follow/:userId` - Suivre
- `GET /api/social/feed` - Fil d'actualité
- `GET /api/social/search?q=...` - Rechercher utilisateurs

#### Library
- `POST /api/library` - Ajouter à bibliothèque
- `GET /api/library/my` - Ma bibliothèque

## 🧪 Tests

```bash
# Backend
cd backend
npm test

# Frontend
cd web
npm test
```

## 🤝 Contribution

Ce projet est un projet académique. Les contributions ne sont pas acceptées pour le moment.

## 📄 Licence

Ce projet est sous licence MIT.

## 👥 Auteurs

Équipe de développement - Projet SUPCONTENT 2026

## 🙏 Remerciements

- API RAWG pour les données de jeux
- Culture Connect pour le sujet de projet

---

**Note**: Ce projet est développé dans un cadre pédagogique. Aucune donnée sensible ne doit être committée.
