# Guide de Test - Étape 13 : Système d'Authentification

## 🎯 Objectif
Tester le système d'authentification complet de votre application VoiceAI.

## 📋 Prérequis

### 1. Installation des dépendances

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend  
cd frontend
npm install
```

### 2. Configuration MongoDB

**Option A : MongoDB Local**
```bash
# Installer MongoDB localement
# Démarrer le service MongoDB
```

**Option B : MongoDB Atlas (Recommandé)**
1. Créer un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créer un cluster gratuit
3. Obtenir l'URL de connexion
4. Créer le fichier `backend/.env` :
```env
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/voiceai_db?retryWrites=true&w=majority
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=http://localhost:5174,http://localhost:3000
```

### 3. Configuration Frontend

Créer le fichier `frontend/.env.local` :
```env
VITE_API_URL=http://localhost:3000/api
VITE_TTS_API_URL=http://localhost:8000
VITE_DEBUG_MODE=true
```

## 🚀 Démarrage des Services

### 1. Démarrer le Backend (Port 3000)
```bash
cd backend
python main.py
```

**Vérifications :**
- ✅ Serveur démarré sur http://localhost:3000
- ✅ Connexion MongoDB réussie
- ✅ Index créés

### 2. Démarrer l'API TTS (Port 8000)
```bash
cd kokoro-api
python api_kokoro_optimized.py
```

### 3. Démarrer le Frontend (Port 5174)
```bash
cd frontend
npm run dev
```

## 🧪 Tests d'Authentification

### Test 1 : Inscription d'un nouvel utilisateur

1. **Accéder à l'application** : http://localhost:5174
2. **Cliquer sur "Créer un compte"**
3. **Remplir le formulaire :**
   - Nom : "Test User"
   - Email : "test@example.com"
   - Mot de passe : "password123"
   - Confirmer : "password123"
4. **Cliquer "Créer mon compte"**

**Résultat attendu :**
- ✅ Redirection vers `/app`
- ✅ Interface TTS visible
- ✅ Utilisateur connecté

### Test 2 : Connexion d'un utilisateur existant

1. **Se déconnecter** (bouton logout si disponible)
2. **Aller sur** : http://localhost:5174/login
3. **Se connecter avec :**
   - Email : "test@example.com"
   - Mot de passe : "password123"
4. **Cliquer "Se connecter"**

**Résultat attendu :**
- ✅ Connexion réussie
- ✅ Redirection vers `/app`

### Test 3 : Protection des routes

1. **Se déconnecter**
2. **Essayer d'accéder directement à** : http://localhost:5174/app
3. **Vérifier la redirection vers** : http://localhost:5174/login

**Résultat attendu :**
- ✅ Redirection automatique vers login
- ✅ Message d'erreur si non connecté

### Test 4 : Génération TTS avec authentification

1. **Être connecté sur** : http://localhost:5174/app
2. **Saisir du texte** : "Hello, this is a test"
3. **Sélectionner une voix** : "Heart"
4. **Cliquer "Générer l'audio"**

**Résultat attendu :**
- ✅ Génération réussie (si backend + TTS API fonctionnent)
- ✅ Audio jouable
- ✅ Historique sauvegardé

### Test 5 : API Backend directement

**Test avec curl :**

```bash
# Test inscription
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test2@example.com","password":"password123"}' \
  -c cookies.txt

# Test connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test2@example.com","password":"password123"}' \
  -c cookies.txt

# Test route protégée
curl -X GET http://localhost:3000/api/auth/me \
  -b cookies.txt
```

## 🔧 Dépannage

### Problème : "Cannot connect to MongoDB"
**Solution :**
- Vérifier que MongoDB est démarré
- Vérifier l'URL de connexion dans `.env`
- Vérifier les credentials MongoDB Atlas

### Problème : "CORS error"
**Solution :**
- Vérifier `CORS_ORIGINS` dans le backend
- S'assurer que le frontend tourne sur le bon port

### Problème : "Authentication failed"
**Solution :**
- Vérifier que les cookies sont activés
- Vérifier la configuration JWT
- Vérifier les logs du backend

### Problème : "API not responding"
**Solution :**
- Vérifier que le backend tourne sur le port 3000
- Vérifier les logs d'erreur
- Tester l'API directement avec curl

## ✅ Checklist de Validation

- [ ] Backend démarre sans erreur (port 3000)
- [ ] Connexion MongoDB réussie
- [ ] Frontend démarre sans erreur (port 5174)
- [ ] Inscription utilisateur fonctionne
- [ ] Connexion utilisateur fonctionne
- [ ] Routes protégées fonctionnent
- [ ] Déconnexion fonctionne
- [ ] Cookies d'authentification fonctionnent
- [ ] Interface TTS accessible aux utilisateurs connectés
- [ ] Historique utilisateur fonctionne

## 🎉 Prochaines Étapes

Une fois tous les tests validés, vous pouvez passer à l'**Étape 14 : Sauvegarde des fichiers audio et prompts** !

**Félicitations !** Votre système d'authentification est opérationnel ! 🚀

