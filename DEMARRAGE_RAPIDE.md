# Guide de démarrage rapide - SUPCONTENT

## 🚀 Lancement avec Docker (Recommandé)

### 1. Configuration initiale

```bash
# Cloner et accéder au projet
git clone https://github.com/Abdoul12Rahim/SUPCONTENT.git 
cd supcontent

# Créer le fichier .env à partir de l'exemple
copy .env.example .env

# IMPORTANT : Éditer .env et remplir vos clés API
notepad .env
```

**Clés nécessaires dans .env :**
- `RAWG_API_KEY` : Obtenir sur https://rawg.io/apidocs (gratuit)
- `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` : (optionnel) OAuth Google
- `GITHUB_CLIENT_ID` et `GITHUB_CLIENT_SECRET` : (optionnel) OAuth GitHub
- `JWT_SECRET` : Générer avec `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` 
- `SESSION_SECRET` : Générer avec la même commande

### 2. Démarrage des services

```bash
# Démarrer tous les services
docker compose up

# OU en arrière-plan
docker compose up -d
```

### 3. Accès aux services

- **Frontend Web** : http://localhost:3000
- **Backend API** : http://localhost:5000
- **MongoDB** : localhost:27017

## 🛠️ Développement sans Docker

### Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier et configurer .env
copy .env.example .env
notepad .env

# Démarrer MongoDB localement (requis)
# Puis lancer le serveur
npm run dev
```

### Frontend Web

```bash
cd web

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
```

### Frontend Mobile (Expo)

```bash
cd mobile

# Installer les dépendances  
npm install

# Démarrer Expo
npx expo start
```

## ✅ Vérification

### Test Backend

```bash
# Health check
curl http://localhost:5000/health

# Devrait retourner : {"status":"OK","message":"Server is running"}
```

### Test Frontend

Ouvrir http://localhost:3000 dans le navigateur.

## 📝 Commandes utiles

```bash
# Voir les logs
docker compose logs -f

# Arrêter les services
docker compose down

# Rebuild les containers
docker compose up --build

# Reset complet (supprime la base de données)
docker compose down -v

# Accéder au shell du backend
docker exec -it supcontent-backend sh

# Accéder à MongoDB
docker exec -it supcontent-mongo mongosh supcontent
```

## 🐛 Dépannage

### Erreur "RAWG_API_KEY"
→ Vous n'avez pas configuré la clé API RAWG dans .env

### Erreur "Port already in use"
→ Un service tourne déjà sur le port. Arrêter ou changer le port dans docker-compose.yml

### Erreur de connexion MongoDB
→ Vérifier que MongoDB est démarré : `docker compose ps`

### Frontend ne se connecte pas au Backend
→ Vérifier que REACT_APP_API_URL est correct dans le .env du web

### Erreur "Cannot parse an empty JSON string"

## 📚 Prochaines étapes

1. **Créer un compte** sur http://localhost:3000/register
2. **Explorer les jeux** via la recherche
3. **Ajouter des jeux** à votre bibliothèque
4. **Écrire des critiques**
5. **Suivre d'autres utilisateurs**

## 💡 Aide supplémentaire

Consultez le [README.md](./README.md) pour la documentation complète.

---

**Bon développement ! 🎮**
