# 🎓 Guide React pour Débutants - Application Kokoro TTS

Ce document explique en détail tout le code React de votre application TTS (Text-to-Speech) utilisant le modèle Kokoro.

## 📁 Structure du Projet React

```
frontend/
├── src/
│   ├── main.jsx              # Point d'entrée de l'application
│   ├── App.jsx               # Composant principal
│   ├── App.css               # Styles du composant App
│   ├── index.css             # Styles globaux
│   └── components/
│       ├── TTSInterface.jsx  # Interface principale TTS
│       ├── VoiceSelector.jsx # Sélecteur de voix
│       └── AudioPlayer.jsx   # Lecteur audio
├── package.json              # Dépendances et scripts
└── vite.config.js           # Configuration Vite
```

## 🔧 Technologies Utilisées

### Dépendances Principales
- **React 19.1.1** : Bibliothèque pour construire l'interface utilisateur
- **ReactDOM 19.1.1** : Pour rendre React dans le navigateur
- **Axios 1.11.0** : Client HTTP pour les appels API
- **Vite 7.1.2** : Outil de build moderne et rapide

### Concepts React Utilisés
- **Hooks** : useState, useEffect, useRef
- **Props** : Communication entre composants
- **JSX** : Syntaxe JavaScript étendue pour écrire du HTML dans JS
- **Components** : Composants fonctionnels

---

## 📄 Analyse Détaillée des Fichiers

### 1. `main.jsx` - Point d'entrée
**Emplacement** : `frontend/src/main.jsx:1`

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

#### 🎯 Explications pour débutants :

**Ligne 1-4** : **Imports**
- `StrictMode` : Mode strict de React qui aide à détecter les problèmes
- `createRoot` : Nouvelle API React 18+ pour monter l'app dans le DOM
- `./index.css` : Import des styles CSS globaux
- `App` : Import du composant principal

**Ligne 6-10** : **Rendu de l'application**
- `document.getElementById('root')` : Trouve l'élément HTML avec id="root"
- `createRoot()` : Crée une racine React dans cet élément
- `.render()` : Rend le composant App entouré de StrictMode
- `<StrictMode>` : Active les vérifications supplémentaires en développement

---

### 2. `App.jsx` - Composant Principal
**Emplacement** : `frontend/src/App.jsx:1`

```jsx
import { useState } from 'react'
import './App.css'
import TTSInterface from './components/TTSInterface'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>🎵 Kokoro TTS</h1>
        <p>Synthèse vocale de qualité avec Kokoro v0.19</p>
      </header>
      
      <main className="App-main">
        <TTSInterface />
      </main>
      
      <footer className="App-footer">
        <p>Propulsé par <strong>Kokoro-82M</strong> • Étape 5 du projet TTS</p>
      </footer>
    </div>
  )
}

export default App
```

#### 🎯 Explications pour débutants :

**Structure du composant** :
- C'est un **composant fonctionnel** (fonction JavaScript qui retourne du JSX)
- `function App()` : Déclare le composant
- `return (...)` : Retourne le JSX à afficher
- `export default App` : Exporte le composant pour l'utiliser ailleurs

**JSX** :
- Mélange de HTML et JavaScript
- `className` au lieu de `class` (mot-clé réservé JS)
- Les éléments doivent être fermés (`<div>...</div>`)

**Structure de la page** :
- `<header>` : En-tête avec titre et description
- `<main>` : Contenu principal avec le composant TTSInterface
- `<footer>` : Pied de page avec informations

---

### 3. `TTSInterface.jsx` - Interface Principale
**Emplacement** : `frontend/src/components/TTSInterface.jsx:1`

Ce composant est le cœur de l'application. Analysons-le section par section :

#### 📦 Imports et Configuration
```jsx
import { useState, useRef } from 'react';
import axios from 'axios';
import VoiceSelector from './VoiceSelector';
import AudioPlayer from './AudioPlayer';
import './TTSInterface.css';
```

**Explications** :
- `useState` : Hook pour gérer l'état local du composant
- `useRef` : Hook pour référencer des éléments DOM
- `axios` : Librairie pour faire des requêtes HTTP
- Import des composants enfants et styles

#### 🔄 État du Composant (State)
```jsx
const [text, setText] = useState('');
const [selectedVoice, setSelectedVoice] = useState('af_heart');
const [speed, setSpeed] = useState(1.0);
const [isLoading, setIsLoading] = useState(false);
const [audioUrl, setAudioUrl] = useState(null);
const [lastGeneration, setLastGeneration] = useState(null);
const [error, setError] = useState(null);
```

#### 🎯 Explications useState pour débutants :

`useState` est un **Hook** React qui permet de :
- **Lire** une valeur d'état
- **Modifier** cette valeur

**Syntaxe** : `const [valeur, setValeur] = useState(valeurInitiale)`

**Chaque état dans l'app** :
- `text` : Texte saisi par l'utilisateur (initial : chaîne vide)
- `selectedVoice` : Voix sélectionnée (initial : 'af_heart')
- `speed` : Vitesse de lecture (initial : 1.0)
- `isLoading` : État de chargement (initial : false)
- `audioUrl` : URL du fichier audio généré (initial : null)
- `lastGeneration` : Infos de la dernière génération (initial : null)
- `error` : Message d'erreur (initial : null)

#### 📍 useRef - Référence DOM
```jsx
const textareaRef = useRef(null);
```

**useRef** permet de :
- Accéder directement à un élément du DOM
- Ici : référencer la zone de texte pour lui donner le focus

#### 🌐 Fonction de Génération Audio
```jsx
const handleGenerate = async () => {
  // Validation
  if (!text.trim()) {
    setError('Veuillez saisir du texte à synthétiser');
    return;
  }

  if (text.length > 2000) {
    setError('Le texte ne peut pas dépasser 2000 caractères');
    return;
  }

  // États de chargement
  setIsLoading(true);
  setError(null);
  setAudioUrl(null);

  try {
    // Appel API
    const response = await axios.post(`${API_BASE_URL}/tts`, {
      text: text,
      voice: selectedVoice,
      speed: speed,
      format: 'wav'
    });

    if (response.data.success) {
      const audioFullUrl = `${API_BASE_URL}${response.data.audio_url}`;
      setAudioUrl(audioFullUrl);
      
      // Sauvegarde des infos
      setLastGeneration({
        text: text,
        voice: selectedVoice,
        speed: speed,
        duration: response.data.audio_duration,
        generationTime: response.data.generation_time,
        segments: response.data.segments_count,
        timestamp: new Date().toLocaleTimeString()
      });
    }
  } catch (error) {
    // Gestion des erreurs
    if (error.response) {
      setError(`Erreur API: ${error.response.data.detail || error.response.status}`);
    } else if (error.request) {
      setError('Impossible de contacter l\'API...');
    } else {
      setError(`Erreur: ${error.message}`);
    }
  } finally {
    setIsLoading(false);
  }
};
```

#### 🎯 Explications de cette fonction complexe :

**`async/await`** : 
- Permet de faire des opérations asynchrones (appels réseau)
- `async` devant la fonction, `await` devant l'opération longue

**Structure try/catch/finally** :
- `try` : Code qui peut échouer
- `catch` : Gère les erreurs
- `finally` : S'exécute toujours (succès ou erreur)

**Validation des données** :
- Vérifie que le texte n'est pas vide
- Vérifie la longueur maximale (2000 caractères)

**États de l'interface** :
- `setIsLoading(true)` : Affiche le chargement
- `setError(null)` : Efface les erreurs précédentes
- `setAudioUrl(null)` : Efface l'audio précédent

**Appel API avec Axios** :
- `axios.post()` : Envoie une requête POST
- Données envoyées : texte, voix, vitesse, format
- Réponse : contient l'URL de l'audio généré

#### 📱 Interface Utilisateur (JSX)
Le composant retourne du JSX complexe avec plusieurs sections :

**Zone de saisie** :
```jsx
<textarea
  ref={textareaRef}
  id="text-input"
  className="text-input"
  placeholder="Saisissez le texte à convertir en audio..."
  value={text}
  onChange={(e) => setText(e.target.value)}
  rows={6}
  maxLength={2000}
/>
```

**Explications** :
- `ref={textareaRef}` : Attache la référence pour le focus
- `value={text}` : Valeur contrôlée par React (état)
- `onChange` : Fonction appelée à chaque changement
- `(e) => setText(e.target.value)` : Met à jour l'état avec la nouvelle valeur

**Boutons d'exemple** :
```jsx
{examples.map((example, index) => (
  <button
    key={index}
    className="example-button"
    onClick={() => handleExampleText(example)}
    title={example}
  >
    Exemple {index + 1}
  </button>
))}
```

**Explications** :
- `.map()` : Transforme chaque élément du tableau en composant JSX
- `key={index}` : Clé unique requise par React pour les listes
- `onClick={() => handleExampleText(example)}` : Fonction appelée au clic

---

### 4. `VoiceSelector.jsx` - Sélecteur de Voix
**Emplacement** : `frontend/src/components/VoiceSelector.jsx:1`

#### 🎛️ Props du composant
```jsx
const VoiceSelector = ({ selectedVoice, onVoiceChange }) => {
```

**Props** = Propriétés passées par le composant parent :
- `selectedVoice` : Voix actuellement sélectionnée
- `onVoiceChange` : Fonction à appeler quand l'utilisateur change de voix

#### 🔄 États locaux
```jsx
const [voices, setVoices] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

#### 🌐 useEffect - Chargement des données
```jsx
useEffect(() => {
  const fetchVoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/voices`);
      setVoices(response.data);
    } catch (error) {
      // Fallback sur des voix par défaut
      setVoices([
        {
          id: "af_heart",
          name: "Heart",
          description: "Voix féminine chaleureuse et expressive",
          language: "en-US",
          gender: "female",
          recommended: true
        },
        // ...autres voix
      ]);
      setError('API non accessible, utilisation des voix par défaut');
    } finally {
      setLoading(false);
    }
  };

  fetchVoices();
}, []); // [] = s'exécute une seule fois au montage
```

#### 🎯 Explications useEffect pour débutants :

**useEffect** permet d'exécuter du code à certains moments :
- **Au montage** du composant (quand il apparaît)
- **Quand certaines valeurs changent**
- **Au démontage** (quand il disparaît)

**Syntaxe** : `useEffect(() => { /* code */ }, [dépendances])`

**Tableau de dépendances** :
- `[]` (vide) : Une seule fois au montage
- `[variable]` : Quand 'variable' change
- Pas de tableau : À chaque rendu (rarement utilisé)

---

### 5. `AudioPlayer.jsx` - Lecteur Audio
**Emplacement** : `frontend/src/components/AudioPlayer.jsx:1`

#### 🎵 Props reçues
```jsx
const AudioPlayer = ({ audioUrl, onDownload, generationInfo }) => {
```

- `audioUrl` : URL du fichier audio à lire
- `onDownload` : Fonction de téléchargement
- `generationInfo` : Informations sur la génération

#### 🎛️ États du lecteur
```jsx
const [isPlaying, setIsPlaying] = useState(false);
const [duration, setDuration] = useState(0);
const [currentTime, setCurrentTime] = useState(0);
const [volume, setVolume] = useState(1);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState(null);
```

#### 📍 Référence à l'élément audio
```jsx
const audioRef = useRef(null);
```

Cette référence permet de contrôler directement l'élément `<audio>` HTML.

#### 🎮 Fonctions de contrôle
```jsx
const togglePlay = () => {
  if (audioRef.current) {
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          setError('Impossible de lire l\'audio');
        });
    }
  }
};
```

**Explications** :
- `audioRef.current` : Accès à l'élément DOM `<audio>`
- `.play()` et `.pause()` : Méthodes HTML5 Audio
- `.then()/.catch()` : Gestion des promesses (play() est asynchrone)

#### 🎚️ Gestion des événements audio
```jsx
const handleTimeUpdate = () => {
  if (audioRef.current) {
    setCurrentTime(audioRef.current.currentTime);
  }
};

const handleLoadedMetadata = () => {
  if (audioRef.current) {
    setDuration(audioRef.current.duration);
    setIsLoading(false);
  }
};
```

Ces fonctions sont appelées automatiquement par l'élément `<audio>` :
- `onTimeUpdate` : Mise à jour du temps de lecture
- `onLoadedMetadata` : Quand les métadonnées (durée) sont chargées

---

## 🔗 Communication Entre Composants

### Pattern Props Down, Events Up

```
App
└── TTSInterface
    ├── VoiceSelector
    │   ├── selectedVoice (prop down)
    │   └── onVoiceChange (event up)
    └── AudioPlayer
        ├── audioUrl (prop down)
        ├── onDownload (event up)
        └── generationInfo (prop down)
```

#### 🎯 Explications pour débutants :

**Props Down** : Les données descendent du parent vers l'enfant
```jsx
// Parent (TTSInterface)
<VoiceSelector 
  selectedVoice={selectedVoice}
  onVoiceChange={setSelectedVoice}
/>

// Enfant (VoiceSelector)
const VoiceSelector = ({ selectedVoice, onVoiceChange }) => {
  // Utilise selectedVoice pour afficher la sélection
  // Appelle onVoiceChange(newVoice) pour notifier le parent
};
```

**Events Up** : Les événements remontent de l'enfant vers le parent
- L'enfant appelle la fonction reçue en prop
- Le parent met à jour son état
- React re-rend les composants nécessaires

---

## 🎨 Hooks React Utilisés

### 1. useState - Gestion d'État
```jsx
const [value, setValue] = useState(initialValue);
```
**Usage** : Stocker et modifier des données qui changent

### 2. useEffect - Effets de Bord
```jsx
useEffect(() => {
  // Code à exécuter
  return () => {
    // Nettoyage (optionnel)
  };
}, [dependencies]);
```
**Usage** : Appels API, abonnements, timers

### 3. useRef - Références DOM
```jsx
const ref = useRef(null);
<element ref={ref} />
// Accès : ref.current
```
**Usage** : Manipuler directement le DOM, stocker des valeurs mutables

---

## 🌐 Appels API avec Axios

### Configuration
```jsx
const API_BASE_URL = 'http://localhost:8000';
```

### GET - Récupération des voix
```jsx
const response = await axios.get(`${API_BASE_URL}/voices`);
const voices = response.data;
```

### POST - Génération audio
```jsx
const response = await axios.post(`${API_BASE_URL}/tts`, {
  text: text,
  voice: selectedVoice,
  speed: speed,
  format: 'wav'
});
```

#### 🎯 Structure d'un appel API :
1. **Préparation** : Définir l'URL et les données
2. **Requête** : `await axios.method(url, data)`
3. **Traitement** : Vérifier `response.data`
4. **Mise à jour** : Mettre à jour les états React
5. **Erreurs** : try/catch pour gérer les échecs

---

## 🔄 Cycle de Vie d'une Génération Audio

1. **Utilisateur saisit du texte** → `setText(newText)`
2. **Utilisateur clique "Générer"** → `handleGenerate()`
3. **Validation** → Vérification texte non vide
4. **États UI** → `setIsLoading(true)`, `setError(null)`
5. **Appel API** → `axios.post('/tts', data)`
6. **Succès** → `setAudioUrl(url)`, `setLastGeneration(info)`
7. **Rendu AudioPlayer** → Nouveau composant avec l'URL
8. **Lecture** → Utilisateur peut écouter/télécharger

---

## 🎯 Concepts React Importants

### 1. Composants Fonctionnels
```jsx
function MonComposant(props) {
  return <div>{props.message}</div>;
}
// ou
const MonComposant = (props) => {
  return <div>{props.message}</div>;
};
```

### 2. JSX - JavaScript XML
```jsx
const element = (
  <div className="container">
    <h1>Titre</h1>
    <p>Paragraphe avec {variable}</p>
  </div>
);
```

### 3. Événements
```jsx
<button onClick={handleClick}>Cliquer</button>
<input onChange={(e) => setValue(e.target.value)} />
```

### 4. Rendu Conditionnel
```jsx
{isLoading && <div>Chargement...</div>}
{error && <div className="error">{error}</div>}
{audioUrl ? <AudioPlayer /> : <div>Pas d'audio</div>}
```

### 5. Listes et Clés
```jsx
{items.map((item, index) => (
  <div key={item.id}>{item.name}</div>
))}
```

---

## 🚀 Bonnes Pratiques Utilisées

### 1. **Séparation des Responsabilités**
- Chaque composant a une fonction claire
- TTSInterface : Logique principale
- VoiceSelector : Sélection de voix
- AudioPlayer : Lecture audio

### 2. **Gestion d'État Appropriée**
- États locaux pour les données spécifiques au composant
- Props pour la communication parent-enfant

### 3. **Gestion des Erreurs**
- try/catch pour les appels API
- États d'erreur pour l'affichage utilisateur
- Fallbacks quand l'API n'est pas disponible

### 4. **UX/UI Réactive**
- États de chargement
- Validation en temps réel
- Feedback visuel sur les actions

### 5. **Code Lisible**
- Noms de variables explicites
- Commentaires pour les parties complexes
- Structure cohérente

---

## 🔧 Pour Aller Plus Loin

### Améliorations Possibles
1. **Context API** : Pour partager l'état entre composants distants
2. **Custom Hooks** : Extraire la logique réutilisable
3. **Memoization** : Optimiser les performances (React.memo, useMemo)
4. **Testing** : Tests unitaires avec Jest/React Testing Library
5. **TypeScript** : Typage statique pour plus de sécurité

### Architecture Alternative
```jsx
// Custom Hook pour la logique TTS
const useTTS = () => {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const generateAudio = async () => {
    // Logique de génération
  };
  
  return { text, setText, isLoading, generateAudio };
};

// Composant simplifié
const TTSInterface = () => {
  const { text, setText, isLoading, generateAudio } = useTTS();
  
  return (
    // JSX simplifié
  );
};
```

---

## 🎓 Résumé pour Débutant

**React** est une bibliothèque pour créer des interfaces utilisateur interactives :

1. **Composants** : Blocs de construction réutilisables
2. **JSX** : HTML dans JavaScript
3. **Props** : Communication entre composants
4. **State** : Données qui changent
5. **Hooks** : Fonctionnalités spéciales (useState, useEffect, useRef)
6. **Événements** : Réactions aux actions utilisateur

**Votre application TTS** utilise ces concepts pour :
- Saisir du texte
- Sélectionner une voix
- Générer de l'audio via une API
- Lire et télécharger le résultat

**Flow de données** :
```
Utilisateur → Interface → État React → API → Réponse → Interface → Utilisateur
```

Cette architecture rend l'application **réactive**, **maintenable** et **extensible**.

---

*🎉 Félicitations ! Vous comprenez maintenant l'architecture React de votre application TTS.*