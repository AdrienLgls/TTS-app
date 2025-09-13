# Guide Manuel - Test de Kokoro TTS

Ce guide vous permettra de comprendre étape par étape comment fonctionne Kokoro v0.19.

## 📁 Structure créée

```
kokoro-api/
├── kokoro/                    # Dépôt GitHub officiel cloné
├── requirements_officiel.txt  # Dépendances selon le projet officiel
├── test_kokoro_manuel.py     # Script de test basé sur les exemples officiels
└── GUIDE_MANUEL.md           # Ce guide
```

## 🔧 Installation étape par étape

### 1. Installer les dépendances officielles

```bash
cd kokoro-api
pip install -r requirements_officiel.txt
```

**Que fait cette commande :**
- Installe `kokoro>=0.9.4` - La bibliothèque principale
- Installe `soundfile` - Pour sauvegarder les fichiers audio
- Installe `misaki[en]` - Système de conversion Graphème-vers-Phonème 
- Installe `torch`, `transformers` - Framework de deep learning

### 2. (Windows) Installer espeak-ng

Espeak est nécessaire pour certaines fonctionnalités de phonétique :

1. Allez sur https://github.com/espeak-ng/espeak-ng/releases
2. Téléchargez le fichier `.msi` pour Windows
3. Installez-le

**Pourquoi espeak :** Kokoro utilise espeak pour convertir le texte en phonèmes, notamment pour les mots non-standards.

## 🧪 Tests manuels étape par étape

### Test 1 - Lancement du script principal

```bash
python test_kokoro_manuel.py
```

**Ce qui va se passer :**

1. **Chargement du modèle** : Kokoro va télécharger automatiquement le modèle depuis Hugging Face (~82M paramètres)
2. **Test basique** : Génération d'un audio simple
3. **Test des voix** : Test de différentes voix (af_heart, af_bella, af_sarah)
4. **Test de performance** : Mesure des temps CPU vs GPU
5. **Test texte long** : Génération avec un texte de plusieurs phrases
6. **Test multilingue** : Tentative avec différentes langues

### Test 2 - Comprendre le fonctionnement interne

Regardons le code du dépôt officiel :

```bash
cd kokoro
ls -la kokoro/  # Voir le code source
```

**Architecture de Kokoro :**
- `KPipeline` : Interface principale
- Modèle basé sur StyleTTS2 avec 82M paramètres
- Utilise `misaki` pour la conversion G2P (Graphème-to-Phonème)

### Test 3 - Test manuel simple

Créez un fichier `simple_test.py` :

```python
from kokoro import KPipeline
import soundfile as sf

# Initialisation
pipeline = KPipeline(lang_code='a')  # 'a' = American English

# Génération
text = "Hello, this is a manual test."
generator = pipeline(text, voice='af_heart')

# Sauvegarde
for i, (graphemes, phonemes, audio) in enumerate(generator):
    print(f"Graphemes: {graphemes}")
    print(f"Phonemes: {phonemes}")
    print(f"Audio samples: {len(audio)}")
    
    sf.write(f'manual_test_{i}.wav', audio, 24000)
    print(f"Saved: manual_test_{i}.wav")
```

## 🔍 Compréhension technique

### Comment fonctionne Kokoro :

1. **Input Text** → `"Hello world"`
2. **Graphemes** → Caractères du texte
3. **Phonemes** → `"/həˈloʊ wɜrld/"` (conversion G2P via misaki)
4. **Neural Network** → Modèle StyleTTS2 (82M paramètres)
5. **Audio Output** → Fichier .wav à 24kHz

### Paramètres importants :

```python
pipeline = KPipeline(
    lang_code='a',      # 'a'=English, 'f'=French, etc.
    device='cpu',       # 'cpu', 'cuda', ou None (auto)
    model=None          # Modèle personnalisé (optionnel)
)

generator = pipeline(
    text,
    voice='af_heart',   # Voix à utiliser
    speed=1.0,          # Vitesse (0.5 = lent, 2.0 = rapide)
    split_pattern=r'\n+' # Pattern pour diviser le texte
)
```

### Voix disponibles :
- `af_heart` - Voix féminine, chaleureuse
- `af_bella` - Voix féminine, claire
- `af_sarah` - Voix féminine, douce

## 📊 Points d'évaluation

Après vos tests, évaluez :

### ✅ Qualité technique
- [ ] Le modèle se charge sans erreur
- [ ] Les fichiers audio sont générés
- [ ] Pas d'erreurs dans les logs

### 🎵 Qualité audio
- [ ] La prononciation est naturelle
- [ ] Les pauses sont respectées
- [ ] Les différentes voix sont distinctes

### ⚡ Performance
- [ ] Temps de génération acceptable (<5s pour une phrase)
- [ ] Usage mémoire raisonnable
- [ ] Fonctionne sur votre matériel

## 🚨 Problèmes fréquents

### 1. Erreur "No module named 'kokoro'"
```bash
pip install kokoro>=0.9.4
```

### 2. Erreur avec espeak
```bash
# Sur Windows, installer espeak-ng.msi
# Sur Linux/Mac:
sudo apt-get install espeak-ng
```

### 3. Erreur de mémoire
```python
# Forcer l'usage CPU
pipeline = KPipeline(lang_code='a', device='cpu')
```

### 4. Pas d'audio généré
- Vérifiez que soundfile est installé : `pip install soundfile`
- Testez avec un texte simple d'abord

## 📈 Prochaines étapes

Une fois vos tests manuels concluants :

1. **Créer l'API FastAPI** pour exposer Kokoro
2. **Optimiser les performances** selon vos besoins
3. **Intégrer dans votre application** TTS

## 🔗 Resources utiles

- **Dépôt officiel** : https://github.com/hexgrad/kokoro
- **Modèle HuggingFace** : https://huggingface.co/hexgrad/Kokoro-82M
- **Exemples audio** : https://huggingface.co/hexgrad/Kokoro-82M/blob/main/SAMPLES.md
- **Discord communauté** : https://discord.gg/QuGxSWBfQy

---

**Conseil :** Prenez le temps d'écouter les fichiers audio générés. La qualité de Kokoro est impressionnante pour un modèle de seulement 82M paramètres !