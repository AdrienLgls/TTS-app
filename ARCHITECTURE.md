# Architecture Technique - Projet TTS

## Vue d'ensemble

Ce projet implémente une solution complète de synthèse vocale (Text-to-Speech) basée sur le modèle Kokoro v0.19, avec une architecture découplée optimisée pour les performances et la scalabilité.

## Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    ARCHITECTURE TTS                         │
├─────────────────┬─────────────────┬─────────────────────────┤
│   FRONTEND      │    BACKEND      │       MODÈLE IA         │
│   (React/Vite)  │   (Express.js)  │    (Kokoro FastAPI)     │
│                 │                 │                         │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────────┐ │
│ │ Interface   │ │ │ Authentif.  │ │ │ API FastAPI         │ │
│ │ Utilisateur │◄├─┤ Gestion     │◄├─┤ Pipeline Kokoro     │ │
│ │             │ │ │ Utilisateurs│ │ │ Synthèse Vocale     │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────────────┘ │
│                 │                 │                         │
│ ┌─────────────┐ │ ┌─────────────┐ │ ┌─────────────────────┐ │
│ │ Composants  │ │ │ Base de     │ │ │ Gestion Fichiers    │ │
│ │ React       │ │ │ Données     │ │ │ Audio Temporaires   │ │
│ │ Modulaires  │ │ │ MongoDB     │ │ │                     │ │
│ └─────────────┘ │ └─────────────┘ │ └─────────────────────┘ │
├─────────────────┼─────────────────┼─────────────────────────┤
│   Port 5174     │   Port 3000     │      Port 8000          │
└─────────────────┴─────────────────┴─────────────────────────┘
```

## Composants Principaux

### 1. Frontend React (Port 5174)

**Responsabilités :**
- Interface utilisateur moderne et responsive
- Validation des entrées côté client
- Communication avec l'API via Axios
- Gestion des états d'application (loading, erreurs)
- Lecteur audio intégré avec contrôles avancés

**Technologies :**
- React 19.1.1 + Hooks
- Vite 7.1.2 (build et dev server)
- Axios pour requêtes HTTP
- CSS modules pour styling

**Composants Clés :**
- `TTSInterface.jsx` : Orchestrateur principal
- `VoiceSelector.jsx` : Sélection de voix avec métadonnées
- `AudioPlayer.jsx` : Lecteur audio professionnel

### 2. Backend Express.js (Port 3000) [Futur]

**Responsabilités :**
- Authentification et gestion des utilisateurs
- Gestion des quotas et abonnements
- Interface avec MongoDB
- Intégration Stripe pour paiements
- Middleware de sécurité

### 3. API Kokoro FastAPI (Port 8000)

**Responsabilités :**
- Synthèse vocale haute performance
- Gestion du modèle Kokoro v0.19
- Optimisation mémoire (singleton pattern)
- Nettoyage automatique des fichiers
- Monitoring et métriques

**Optimisations Clés :**
- Chargement unique du modèle au démarrage
- Concaténation intelligente des segments audio
- Cache HTTP et streaming optimisé
- Validation stricte des paramètres

## Flux de Données

### Génération Audio Standard

```
1. Utilisateur saisit texte + sélectionne voix
   │
2. Frontend valide (1-2000 chars, voix valide)
   │
3. Requête POST /tts vers API Kokoro
   │
4. API charge texte dans pipeline optimisé
   │
5. Génération audio + sauvegarde temporaire
   │
6. Retour URL + métadonnées au frontend
   │
7. Lecture immédiate + option téléchargement
   │
8. Nettoyage automatique après 1h
```

### Gestion des Erreurs

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Validation    │    │   Réseau/API    │    │   Génération    │
│   Côté Client   │    │   Communication │    │   Audio         │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Texte vide    │    │ • Timeout       │    │ • Modèle crash  │
│ • Trop long     │    │ • API offline   │    │ • Voix invalide │
│ • Chars spéciaux│    │ • CORS          │    │ • Mémoire       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Affichage     │
                    │   Erreur        │
                    │   Utilisateur   │
                    └─────────────────┘
```

## Performance et Scalabilité

### Métriques Actuelles
- **Temps de génération** : ~1.3s moyenne (validé par tests)
- **Ratio temps réel** : 3.5x (génération plus rapide que lecture)
- **Chargement modèle** : ~8s (une seule fois au démarrage)
- **Mémoire API** : Optimisée via singleton pattern

### Optimisations Implémentées

**Frontend :**
- Code splitting automatique (vendor, http chunks)
- Cache navigateur pour assets statiques
- Lazy loading des composants
- Debouncing des requêtes

**API :**
- Instance unique du modèle Kokoro
- Nettoyage automatique des fichiers
- Headers de cache HTTP
- Compression gzip/brotli

**Réseau :**
- CORS optimisé pour cross-origin
- Accept-Ranges pour streaming audio
- Timeout configurables

## Sécurité

### Mesures Implémentées

**Validation des Entrées :**
- Pydantic models pour validation stricte
- Limite de caractères (2000 max)
- Sanitisation des noms de fichiers
- Rate limiting (futur)

**Sécurité Fichiers :**
- Suppression automatique (1h timeout)
- Noms de fichiers UUID (pas de collision)
- Validation d'extension (.wav uniquement)
- Isolation dans dossier temporaire

## Environnements

### Développement
```
Frontend: http://localhost:5174
API:      http://localhost:8000
Hot reload: Activé
Source maps: Activé
Debug: Activé
```

### Production (Futur)
```
Frontend: CDN + domaine custom
API:      Serveur dédié avec GPU
HTTPS:    Let's Encrypt
Monitoring: Logs centralisés
```

## Configuration

### Variables d'Environnement

**Frontend (.env.local) :**
```
VITE_API_URL=http://localhost:8000
VITE_DEBUG_MODE=true
VITE_HTTP_TIMEOUT=30000
```

**API (environnement système) :**
```
KOKORO_MODEL_PATH=/models/kokoro
TEMP_AUDIO_PATH=/tmp/audio
LOG_LEVEL=INFO
```

## Extensibilité

### Points d'Extension Prévus

1. **Nouvelles Voix** : Ajout simple via configuration API
2. **Langues** : Support multilingue via modèles additionnels  
3. **Formats Audio** : Extension MP3, OGG via conversion
4. **Clonage Vocal** : Intégration Coqui TTS (Étape 16)
5. **Streaming Temps Réel** : WebSocket pour génération live
6. **API Publique** : Rate limiting et authentification par clé

### Architecture Modulaire

Le design découplé permet l'évolution indépendante de chaque composant :
- Frontend peut être remplacé (Vue.js, Angular, mobile)
- Backend peut évoluer (Node.js, Django, Go)
- Modèle peut être changé (autre TTS, fine-tuning)

Cette architecture garantit la maintenabilité et l'évolution du projet selon les besoins futurs.