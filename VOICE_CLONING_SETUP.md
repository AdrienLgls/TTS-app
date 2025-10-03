# Guide d'installation du clonage vocal - Coqui TTS XTTS-v2

## ⚠️ Prérequis : Python 3.11

Coqui TTS nécessite **Python 3.9 à 3.11**. Votre système utilise actuellement Python 3.12, qui n'est pas compatible.

## 🔧 Prérequis Windows : Microsoft Visual C++ Build Tools

**IMPORTANT** : Avant d'installer Python 3.11, vous devez installer les outils de compilation C++ :

1. **Télécharger Build Tools** :
   - Aller sur : https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - Cliquer sur "Download Build Tools"

2. **Installer** :
   - Lancer l'installateur téléchargé
   - Cocher "Desktop development with C++"
   - Cliquer sur "Install" (environ 6-7 GB)

3. **Redémarrer** votre ordinateur après l'installation

## 📥 Installation de Python 3.11

### Option 1 : Installer Python 3.11 en parallèle (Recommandé)

1. **Télécharger Python 3.11**
   - Aller sur https://www.python.org/downloads/
   - Télécharger Python 3.11.x (la dernière version 3.11)
   - **IMPORTANT** : Cocher "Add Python 3.11 to PATH" pendant l'installation

2. **Vérifier l'installation**
   ```bash
   py -3.11 --version
   ```
   Devrait afficher : `Python 3.11.x`

### Option 2 : Utiliser un environnement virtuel avec Python 3.11

```bash
# Créer un environnement virtuel avec Python 3.11
py -3.11 -m venv venv_tts

# Activer l'environnement (Windows)
.\venv_tts\Scripts\activate

# Vérifier la version
python --version  # Devrait afficher Python 3.11.x
```

## 🎤 Installation de Coqui TTS

Une fois Python 3.11 installé :

```bash
# Activer l'environnement virtuel (si utilisé)
.\venv_tts\Scripts\activate

# Installer Coqui TTS et ses dépendances
pip install TTS==0.22.0

# Installer les dépendances audio
pip install pydub soundfile librosa scipy

# Installer PyTorch (CPU version)
pip install torch==2.1.0 torchaudio==2.1.0 --index-url https://download.pytorch.org/whl/cpu
```

## 🧪 Tester l'installation

```bash
# Activer l'environnement (si utilisé)
.\venv_tts\Scripts\activate

# Aller dans le dossier backend
cd backend

# Lancer le script de test
python test_voice_cloning.py
```

Si tout fonctionne, vous devriez voir :
```
✅ TTS importé avec succès
📥 Chargement du modèle XTTS-v2...
✅ Modèle chargé avec succès
```

## 🚀 Démarrer le backend avec clonage vocal

```bash
# Activer l'environnement Python 3.11
.\venv_tts\Scripts\activate

# Installer les dépendances du backend
cd backend
pip install -r requirements.txt

# Démarrer le serveur
python main.py
```

Au démarrage, vous devriez voir :
```
✅ TTS disponible - Clonage vocal activé
```

Si TTS n'est pas disponible :
```
⚠️  TTS non disponible - Mode échantillon uniquement
   Installer avec Python 3.11: pip install TTS
```

## 📋 Utilisation du clonage vocal

### 1. Upload d'un échantillon vocal (Premium uniquement)

**Endpoint** : `POST /api/voice-cloning/upload`

**Paramètres** :
- `name` : Nom de la voix (ex: "Ma voix")
- `description` : Description optionnelle
- `audio_file` : Fichier audio WAV (min 6 secondes recommandé)

**Exemple avec curl** :
```bash
curl -X POST http://localhost:3000/api/voice-cloning/upload \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -F "name=Ma voix personnalisée" \
  -F "description=Clone de ma voix" \
  -F "audio_file=@sample.wav"
```

**Réponse** :
```json
{
  "success": true,
  "message": "Clonage vocal en cours... Cela peut prendre quelques minutes.",
  "voice": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ma voix personnalisée",
    "status": "processing"
  }
}
```

### 2. Lister mes voix clonées

**Endpoint** : `GET /api/voice-cloning/my-voices`

**Exemple** :
```bash
curl http://localhost:3000/api/voice-cloning/my-voices \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

**Réponse** :
```json
{
  "success": true,
  "voices": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "Ma voix personnalisée",
      "description": "Clone de ma voix",
      "status": "ready",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 3. Générer avec une voix clonée

**Endpoint** : `POST /api/voice-cloning/generate/{voice_id}`

**Paramètres** :
- `text` : Texte à synthétiser
- `language` : Code langue (ex: "en", "fr", "es", etc.)

**Exemple** :
```bash
curl -X POST http://localhost:3000/api/voice-cloning/generate/507f1f77bcf86cd799439011 \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -F "text=Hello, this is my cloned voice speaking!" \
  -F "language=en"
```

**Réponse** :
```json
{
  "success": true,
  "message": "Audio généré avec succès",
  "audio_url": "/cloned_models/cloned_123_1234567890.wav",
  "voice_name": "Ma voix personnalisée"
}
```

### 4. Supprimer une voix clonée

**Endpoint** : `DELETE /api/voice-cloning/{voice_id}`

**Exemple** :
```bash
curl -X DELETE http://localhost:3000/api/voice-cloning/507f1f77bcf86cd799439011 \
  -H "Cookie: auth_token=YOUR_TOKEN"
```

## 🎯 Langues supportées par XTTS-v2

Le modèle XTTS-v2 supporte **17 langues** :

- `en` - Anglais
- `es` - Espagnol
- `fr` - Français
- `de` - Allemand
- `it` - Italien
- `pt` - Portugais
- `pl` - Polonais
- `tr` - Turc
- `ru` - Russe
- `nl` - Néerlandais
- `cs` - Tchèque
- `ar` - Arabe
- `zh-cn` - Chinois (simplifié)
- `ja` - Japonais
- `hu` - Hongrois
- `ko` - Coréen
- `hi` - Hindi

## 💡 Conseils pour de meilleurs résultats

1. **Qualité de l'échantillon audio** :
   - Minimum 6 secondes (recommandé : 10-15 secondes)
   - Format WAV de préférence
   - Bonne qualité audio, peu de bruit de fond
   - Voix claire et expressive

2. **Génération** :
   - Textes courts (< 500 caractères) pour de meilleurs résultats
   - Utiliser la langue correcte de l'échantillon
   - Le modèle clone aussi les émotions et le style

3. **Performance** :
   - Première génération plus lente (chargement du modèle)
   - Générations suivantes plus rapides
   - Mode CPU : ~2-5 secondes par phrase
   - Mode GPU (si disponible) : ~0.5-1 seconde par phrase

## 🔧 Dépannage

### TTS ne s'installe pas

**Problème** : `ERROR: Could not find a version that satisfies the requirement TTS`

**Solution** : Vérifier la version Python
```bash
python --version  # Doit être 3.9, 3.10 ou 3.11
```

### Erreur "TTS non disponible" au démarrage

**Problème** : Le backend démarre mais affiche "TTS non disponible"

**Solutions** :
1. Vérifier que vous utilisez le bon environnement Python 3.11
2. Réinstaller TTS : `pip install TTS==0.22.0`
3. Vérifier les logs d'erreur dans la console

### Génération trop lente

**Solutions** :
1. Utiliser des textes plus courts
2. Installer PyTorch avec support GPU (si carte graphique NVIDIA disponible)
3. Augmenter la RAM allouée

### Voix clonée de mauvaise qualité

**Solutions** :
1. Utiliser un échantillon audio plus long (15+ secondes)
2. Améliorer la qualité de l'enregistrement (réduire le bruit)
3. Parler de manière claire et expressive dans l'échantillon

## 📚 Ressources

- Documentation Coqui TTS : https://github.com/coqui-ai/TTS
- Modèle XTTS-v2 : https://huggingface.co/coqui/XTTS-v2
- Guide du projet : `PROJECT_GUIDE.md`

## ✅ Checklist de déploiement

### Étape 1 : Prérequis système
- [ ] Visual C++ Build Tools installé
- [ ] Ordinateur redémarré après installation Build Tools
- [ ] Python 3.11 installé

### Étape 2 : Installation TTS
- [ ] Environnement virtuel Python 3.11 créé (`py -3.11 -m venv venv_tts`)
- [ ] Environnement activé (`.\venv_tts\Scripts\activate`)
- [ ] Coqui TTS installé (`pip install TTS==0.22.0`)
- [ ] Script de test exécuté avec succès (`python backend/test_voice_cloning.py`)

### Étape 3 : Backend
- [ ] Backend démarré avec "✅ TTS disponible"
- [ ] MongoDB connecté
- [ ] Dossiers créés (uploaded_voices, cloned_models)

### Étape 4 : Tests fonctionnels
- [ ] Test d'upload d'échantillon fonctionnel
- [ ] Test de génération avec voix clonée fonctionnel
- [ ] Frontend affiche les voix clonées dans VoiceSelector

### Étape 5 : Interface utilisateur (APRÈS installation TTS)
- [ ] Intégrer le bouton "Générer avec voix clonée" dans TTSInterface
- [ ] Tester le workflow complet end-to-end

---

## 🎯 Que faire APRÈS le #5 ?

Une fois que tu as suivi les 5 étapes du guide et que le backend démarre avec "✅ TTS disponible", il reste **une dernière chose** :

### Intégrer la génération avec voix clonée dans l'interface

Actuellement :
- ✅ L'upload de voix fonctionne (page `/voice-cloning`)
- ✅ Les voix clonées s'affichent dans le VoiceSelector
- ✅ Le backend peut générer avec une voix clonée
- ❌ **MAIS** : Le bouton "Générer" dans TTSInterface n'utilise pas encore les voix clonées

**Ce qu'il faut faire** :

Modifier `TTSInterface.jsx` pour :
1. Détecter si la voix sélectionnée est une voix clonée (commence par `cloned-`)
2. Si oui, appeler `/api/voice-cloning/generate/{voice_id}` au lieu de l'API Kokoro
3. Afficher le résultat audio comme d'habitude

**Tu veux que je fasse cette intégration maintenant ?**

---

**Note** : Le clonage vocal est une fonctionnalité Premium. Seuls les utilisateurs avec `is_premium: true` peuvent uploader et utiliser des voix clonées.
