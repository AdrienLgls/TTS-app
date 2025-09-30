# VoiceAI Backend - API d'Authentification

## 🚀 Installation et Configuration

### 1. Prérequis

- Python 3.8+
- MongoDB (local ou MongoDB Atlas)
- pip (gestionnaire de paquets Python)

### 2. Installation des dépendances

```bash
cd backend
pip install -r requirements.txt
```

### 3. Configuration de l'environnement

1. Copiez le fichier d'exemple :
```bash
cp .env.example .env
```

2. Configurez votre `.env` :
```env
# MongoDB Atlas (recommandé) ou local
MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/voiceai_db?retryWrites=true&w=majority

# Clé secrète forte (générez-en une unique)
SECRET_KEY=votre_cle_secrete_super_forte_et_unique_ici

# Configuration JWT
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_DAYS=30

# CORS pour le frontend
CORS_ORIGINS=http://localhost:5174,http://127.0.0.1:5174
```

### 4. Configuration MongoDB Atlas (recommandé)

1. Créez un compte sur [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Créez un cluster gratuit
3. Créez un utilisateur de base de données
4. Whitelist votre IP ou utilisez 0.0.0.0/0 pour le développement
5. Récupérez votre connection string et mettez-la dans `MONGODB_URL`

### 5. Lancement du serveur

```bash
python main.py
```

Le serveur démarre sur `http://localhost:8000`

## 📚 API Endpoints

### Authentification

- **POST /auth/register** - Inscription
- **POST /auth/login** - Connexion
- **POST /auth/logout** - Déconnexion
- **GET /auth/me** - Informations utilisateur
- **GET /auth/history** - Historique des générations

### TTS (Protégé)

- **POST /tts** - Génération audio (authentification requise)
- **GET /voices** - Liste des voix disponibles

### Utilitaires

- **GET /** - Information API
- **GET /health** - Santé de l'API
- **GET /protected** - Route de test protégée

## 🔒 Sécurité

### Tokens JWT

- Stockés dans des cookies `HttpOnly` pour la sécurité
- Expiration configurable (30 jours par défaut)
- Algorithme HS256

### Mots de passe

- Hashés avec bcrypt
- Minimum 6 caractères requis
- Vérification automatique

### CORS

- Configuré pour le frontend en développement
- Ajustable via la variable `CORS_ORIGINS`

## 🗄️ Structure de la base de données

### Collection `users`

```json
{
  "_id": "ObjectId",
  "email": "user@example.com",
  "name": "John Doe",
  "hashed_password": "bcrypt_hash",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "total_generations": 42,
  "total_audio_duration": 120.5,
  "monthly_generations": 15,
  "last_generation": "2024-01-01T00:00:00Z",
  "favorite_voices": ["af_heart", "af_bella"],
  "default_voice": "af_heart",
  "default_speed": 1.0
}
```

### Collection `audio_generations`

```json
{
  "_id": "ObjectId",
  "user_id": "user_object_id",
  "text": "Hello world",
  "voice": "af_heart",
  "speed": 1.0,
  "audio_url": "/audio/file.wav",
  "audio_duration": 2.5,
  "generation_time": 1.2,
  "created_at": "2024-01-01T00:00:00Z"
}
```

## 🛠️ Développement

### Tests de l'API

1. Test de santé :
```bash
curl http://localhost:8000/health
```

2. Test d'inscription :
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### Logs

Le serveur affiche des logs colorés pour faciliter le debug :
- ✅ Succès
- ❌ Erreurs
- 🚀 Démarrage
- 🛑 Arrêt

## 🔧 Intégration avec Kokoro TTS

Pour intégrer avec votre API Kokoro existante, modifiez la route `/tts` dans `main.py` :

```python
@app.post("/tts")
async def generate_tts(
    request: Request,
    current_user: dict = Depends(verify_current_user)
):
    # Votre logique Kokoro ici
    # Sauvegardez ensuite dans l'historique :
    await UserService.save_audio_generation(
        user_id=current_user["user_id"],
        text=text,
        voice=voice,
        speed=speed,
        audio_url=audio_url,
        audio_duration=duration,
        generation_time=gen_time
    )
```

## 🚨 Troubleshooting

### Erreur de connexion MongoDB

1. Vérifiez votre `MONGODB_URL`
2. Assurez-vous que votre IP est autorisée
3. Vérifiez les identifiants de connexion

### Erreur CORS

1. Vérifiez `CORS_ORIGINS` dans `.env`
2. Redémarrez le serveur après modification

### Erreur JWT

1. Vérifiez `SECRET_KEY` dans `.env`
2. Assurez-vous qu'elle est suffisamment complexe