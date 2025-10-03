/**
 * Interface principale de synthèse vocale TTS
 * 
 * Composant React principal qui orchestre toute l'expérience utilisateur :
 * - Saisie et validation du texte
 * - Configuration des paramètres de synthèse (voix, vitesse)
 * - Communication avec l'API Kokoro optimisée
 * - Gestion des états de chargement et d'erreurs
 * - Intégration du lecteur audio
 * 
 * Optimisé pour l'API Kokoro v0.19 avec gestion avancée des performances.
 */

import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import VoiceSelector from './VoiceSelector';
import AudioPlayer from './AudioPlayer';
import UserHistory from './UserHistory';
import './TTSInterface.css';

const TTSInterface = () => {
  // ===============================
  // AUTHENTIFICATION
  // ===============================

  const { user, logout } = useAuth();

  // ===============================
  // ÉTATS DE L'APPLICATION
  // ===============================
  
  // État du texte à synthétiser (validé 1-2000 caractères)
  const [text, setText] = useState('');
  
  // Voix sélectionnée (par défaut : af_heart basé sur les tests)
  const [selectedVoice, setSelectedVoice] = useState('af_heart');
  
  // Vitesse de lecture (plage validée : 0.5x à 2.0x)
  const [speed, setSpeed] = useState(1.0);
  
  // État de chargement pendant la génération
  const [isLoading, setIsLoading] = useState(false);
  
  // URL de l'audio généré pour lecture et téléchargement
  const [audioUrl, setAudioUrl] = useState(null);
  
  // Métadonnées de la dernière génération réussie
  const [lastGeneration, setLastGeneration] = useState(null);
  
  // Gestion des erreurs utilisateur
  const [error, setError] = useState(null);

  // Limites de l'utilisateur
  const [limits, setLimits] = useState({
    char_limit: 300,
    daily_limit: 1,
    daily_used: 0,
    daily_remaining: 1,
    is_premium: false
  });

  // ===============================
  // RÉFÉRENCES ET CONFIGURATION
  // ===============================
  
  // Référence pour la zone de texte (focus automatique)
  const textareaRef = useRef(null);

  // URL de l'API backend authentifiée
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  // URL de l'API TTS Kokoro
  const TTS_API_URL = import.meta.env.VITE_TTS_API_URL || 'http://localhost:8000';

  // ===============================
  // EFFETS
  // ===============================

  // Charger les limites de l'utilisateur au chargement
  useEffect(() => {
    fetchUserLimits();
  }, [user]);

  const fetchUserLimits = async () => {
    try {
      // Pour les utilisateurs non connectés, gérer les limites localement
      if (!user) {
        const today = new Date().toDateString();
        const stored = localStorage.getItem('guest_usage');
        let guestUsage = stored ? JSON.parse(stored) : { date: today, count: 0 };

        // Réinitialiser si c'est un nouveau jour
        if (guestUsage.date !== today) {
          guestUsage = { date: today, count: 0 };
          localStorage.setItem('guest_usage', JSON.stringify(guestUsage));
        }

        setLimits({
          char_limit: 300,
          daily_limit: 1,
          daily_used: guestUsage.count,
          daily_remaining: Math.max(0, 1 - guestUsage.count),
          is_premium: false
        });
        return;
      }

      // Pour les utilisateurs connectés
      const response = await axios.get(`${API_BASE_URL}/generations/limits`, {
        withCredentials: true
      });
      if (response.data.success) {
        setLimits(response.data.limits);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des limites:', error);
    }
  };

  // ===============================
  // FONCTIONS MÉTIERS
  // ===============================
  
  /**
   * Fonction principale de génération audio
   * 
   * Orchestre tout le processus de synthèse vocale :
   * 1. Validation des entrées utilisateur
   * 2. Appel API avec gestion d'erreurs robuste
   * 3. Traitement de la réponse et métadonnées
   * 4. Mise à jour de l'état de l'application
   */
  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Veuillez saisir du texte à synthétiser');
      return;
    }

    // Vérifier les limites avant de générer
    if (text.length > limits.char_limit) {
      if (limits.is_premium) {
        setError(`Le texte ne peut pas dépasser ${limits.char_limit.toLocaleString()} caractères`);
      } else if (user) {
        setError(`Le texte ne peut pas dépasser ${limits.char_limit} caractères (connecté). Passez Premium pour 100 000 caractères !`);
      } else {
        setError(`Le texte ne peut pas dépasser ${limits.char_limit} caractères (non connecté). Connectez-vous pour 2 000 caractères !`);
      }
      return;
    }

    // Vérifier la limite quotidienne (sauf pour Premium)
    if (limits.daily_limit !== null && limits.daily_remaining <= 0) {
      if (user) {
        setError(`Limite quotidienne atteinte (${limits.daily_limit} générations/jour). Passez Premium pour un accès illimité !`);
      } else {
        setError(`Vous avez atteint votre limite quotidienne. Connectez-vous pour plus de générations !`);
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      // Détecter si c'est une voix clonée (commence par "cloned-")
      const isClonedVoice = selectedVoice.startsWith('cloned-');

      if (isClonedVoice) {
        // Génération avec voix clonée via le backend principal
        console.log('🎤 Génération avec voix clonée:', { text: text.substring(0, 50) + '...', voice: selectedVoice });

        const voiceId = selectedVoice.replace('cloned-', '');
        const formData = new FormData();
        formData.append('text', text);
        formData.append('language', 'en'); // TODO: Détecter la langue automatiquement

        const response = await axios.post(
          `${API_BASE_URL}/voice-cloning/generate/${voiceId}`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
          }
        );

        if (response.data.success) {
          // Pour les voix clonées, l'URL est déjà complète (commence par /)
          // On utilise juste le domaine sans /api
          const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';
          const audioFullUrl = `${baseUrl}${response.data.audio_url}`;
          setAudioUrl(audioFullUrl);

          setLastGeneration({
            text: text,
            voice: response.data.voice_name,
            speed: 1.0,
            audio_url: audioFullUrl
          });

          console.log('✅ Audio généré avec voix clonée:', audioFullUrl);
        }
      } else {
        // Génération normale avec Kokoro
        console.log('🎤 Génération audio avec Kokoro:', { text: text.substring(0, 50) + '...', voice: selectedVoice, speed });

        const response = await axios.post(`${TTS_API_URL}/tts`, {
          text: text,
          voice: selectedVoice,
          speed: speed,
          format: 'wav'
        });

        if (response.data.success) {
          const audioFullUrl = `${TTS_API_URL}${response.data.audio_url}`;
          setAudioUrl(audioFullUrl);

          // Sauvegarder les infos de la génération
          setLastGeneration({
            text: text,
            voice: selectedVoice,
            speed: speed,
            duration: response.data.audio_duration,
            generationTime: response.data.generation_time,
            segments: response.data.segments_count,
            timestamp: new Date().toLocaleTimeString()
          });

          console.log('✅ Audio généré:', response.data);

          // Sauvegarder dans l'historique si l'utilisateur est connecté
          if (user) {
            try {
              await axios.post(`${API_BASE_URL}/generations`, {
                text: text,
                voice: selectedVoice,
                speed: speed,
                audio_url: response.data.audio_url,
                audio_duration: response.data.audio_duration,
                generation_time: response.data.generation_time
              }, {
                withCredentials: true
              });
              console.log('✅ Génération sauvegardée dans l\'historique');

              // Déclencher un événement pour rafraîchir l'historique
              window.dispatchEvent(new Event('historyUpdated'));

              // Rafraîchir les limites après génération
              await fetchUserLimits();
            } catch (saveError) {
              console.error('⚠️ Erreur lors de la sauvegarde dans l\'historique:', saveError);
              // On ne bloque pas l'utilisateur si la sauvegarde échoue
            }
          } else {
            // Pour les utilisateurs non connectés, incrémenter le compteur local
            const today = new Date().toDateString();
            const stored = localStorage.getItem('guest_usage');
            let guestUsage = stored ? JSON.parse(stored) : { date: today, count: 0 };

          if (guestUsage.date !== today) {
            guestUsage = { date: today, count: 1 };
          } else {
            guestUsage.count += 1;
          }

          localStorage.setItem('guest_usage', JSON.stringify(guestUsage));

          // Rafraîchir les limites
          await fetchUserLimits();
        }
        } else {
          throw new Error(response.data.message || 'Erreur lors de la génération');
        }
      }

    } catch (error) {
      console.error('❌ Erreur génération:', error);

      if (error.response) {
        // Erreur de l'API
        const detail = error.response.data?.detail || error.response.data?.message || error.response.status;
        setError(`Erreur API: ${detail}`);
      } else if (error.request) {
        // Erreur réseau
        const apiName = selectedVoice.startsWith('cloned-') ? 'Backend (port 3000)' : 'Kokoro (port 8000)';
        setError(`Impossible de contacter ${apiName}. Vérifiez qu'il est démarré.`);
      } else {
        // Autre erreur
        setError(`Erreur: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Téléchargement programmatique de l'audio généré
   * 
   * Crée dynamiquement un lien de téléchargement et l'active.
   * Gère le nommage automatique avec timestamp pour unicité.
   */
  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `kokoro-tts-${Date.now()}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /**
   * Insertion d'un texte d'exemple dans la zone de saisie
   * 
   * Facilite l'utilisation en fournissant des textes pré-définis
   * optimisés pour démontrer les capacités de Kokoro.
   * 
   * @param {string} exampleText - Texte à insérer
   */
  const handleExampleText = (exampleText) => {
    setText(exampleText);
    textareaRef.current?.focus();
  };

  // ===============================
  // DONNÉES DE CONFIGURATION
  // ===============================
  
  // Textes d'exemple optimisés pour Kokoro (testés et validés)
  // Variété de longueurs et complexités pour démontrer les capacités
  const examples = [
    "Hello, this is a test of the Kokoro TTS system.",
    "Kokoro is an open-weight TTS model with 82 million parameters. Despite its lightweight architecture, it delivers comparable quality to larger models.",
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.",
    "Welcome to our text-to-speech application. You can choose from different voices and adjust the speed."
  ];

  return (
    <div className="tts-interface">

      {/* Header */}
      <header className="app-header">
        <nav className="nav">
          <Link to="/" className="logo">VoiceAI</Link>
          <div className="nav-links">
            <Link to="/" className="nav-link">Accueil</Link>
            {user?.is_premium && (
              <Link to="/voice-cloning" className="nav-link">🎤 Clonage Vocal</Link>
            )}
            <div className="user-info">
              {user ? (
                <>
                  <span className="user-greeting">Bonjour, {user.name}</span>
                  {!limits.is_premium && (
                    <Link to="/premium" className="premium-link">
                      ✨ Premium
                    </Link>
                  )}
                  {limits.is_premium && (
                    <span className="premium-badge-header">✨ Premium</span>
                  )}
                  <button onClick={logout} className="logout-btn">Déconnexion</button>
                </>
              ) : (
                <span className="user-greeting">Interface TTS</span>
              )}
            </div>
          </div>
        </nav>
      </header>

      <div className="tts-container">
        
        {/* Main Content */}
        <div className="main-content">
          <div className="content-header">
            <h1 className="page-title">Synthèse Vocale</h1>
            <p className="page-subtitle">Transformez votre texte en voix naturelle avec l'IA Kokoro</p>
          </div>

          {/* Section de saisie de texte */}
          <div className="text-input-section glass-card">
            <div className="section-header">
              <h3 className="section-title">Votre texte</h3>
              <div className="limits-display">
                <span className="char-counter">{text.length}/{limits.char_limit.toLocaleString()} caractères</span>
                {limits.daily_limit !== null && (
                  <span className="daily-counter">
                    {limits.daily_remaining}/{limits.daily_limit} audio restants aujourd'hui
                  </span>
                )}
                {limits.is_premium && (
                  <span className="premium-badge-small">✨ Premium</span>
                )}
              </div>
            </div>

            <textarea
              ref={textareaRef}
              id="text-input"
              className="text-input modern-input"
              placeholder={
                limits.is_premium
                  ? "Saisissez le texte à convertir en audio (jusqu'à 100 000 caractères)..."
                  : user
                  ? "Saisissez le texte à convertir en audio (max 2 000 caractères)..."
                  : "Saisissez un texte court (max 300 caractères) - Connectez-vous pour plus !"
              }
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={limits.char_limit}
            />

            {/* Exemples de texte */}
            <div className="examples-section">
              <h4 className="examples-title">Textes d'exemple</h4>
              <div className="examples-grid">
                {examples.map((example, index) => (
                  <button
                    key={index}
                    className="example-card"
                    onClick={() => handleExampleText(example)}
                    title={example}
                  >
                    <div className="example-icon">📝</div>
                    <span className="example-label">Exemple {index + 1}</span>
                    <span className="example-preview">{example.substring(0, 40)}...</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section de configuration */}
          <div className="config-section">
            <div className="config-grid">
              {/* Sélecteur de voix */}
              <div className="config-card glass-card">
                <VoiceSelector
                  selectedVoice={selectedVoice}
                  onVoiceChange={setSelectedVoice}
                />
              </div>

              {/* Contrôle de vitesse */}
              <div className="config-card glass-card">
                <div className="speed-control">
                  <div className="control-header">
                    <h4 className="control-title">Vitesse de lecture</h4>
                    <span className="speed-value">{speed}x</span>
                  </div>
                  <input
                    type="range"
                    id="speed-slider"
                    className="speed-slider modern-slider"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  />
                  <div className="speed-marks">
                    <span>Lent</span>
                    <span>Normal</span>
                    <span>Rapide</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton de génération */}
          <div className="generate-section">
            <button
              className={`generate-button btn-gradient ${isLoading ? 'loading' : ''} ${!text.trim() ? 'disabled' : ''}`}
              onClick={handleGenerate}
              disabled={isLoading || !text.trim()}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner">⟳</span>
                  <span>Génération en cours...</span>
                </>
              ) : (
                <>
                  <span className="generate-icon">🎤</span>
                  <span>Générer l'audio</span>
                </>
              )}
            </button>
          </div>

          {/* Affichage des erreurs */}
          {error && (
            <div className="error-message modern-alert error">
              <div className="alert-icon">⚠️</div>
              <div className="alert-content">
                <h4>Erreur</h4>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Lecteur audio et téléchargement */}
          {audioUrl && (
            <div className="audio-section glass-card">
              <AudioPlayer
                audioUrl={audioUrl}
                onDownload={handleDownload}
                generationInfo={lastGeneration}
              />
            </div>
          )}


          {/* Message d'incitation pour les non-connectés */}
          {!user && audioUrl && (
            <div className="upgrade-banner glass-card">
              <div className="banner-content">
                <div className="banner-icon">🎉</div>
                <div className="banner-text">
                  <h3>Vous aimez VoiceAI ?</h3>
                  <p>Créez un compte gratuit pour débloquer toutes les fonctionnalités :</p>
                  <ul className="feature-list">
                    <li>✅ Générez jusqu'à <strong>2000 caractères</strong> au lieu de 300</li>
                    <li>✅ Téléchargez vos <strong>fichiers audio</strong></li>
                    <li>✅ Consultez votre <strong>historique complet</strong></li>
                    <li>✅ Sauvegardez vos <strong>préférences</strong></li>
                  </ul>
                </div>
              </div>
              <div className="banner-actions">
                <Link to="/register" className="btn-gradient">
                  Créer un compte gratuit
                </Link>
                <Link to="/login" className="btn-secondary">
                  Se connecter
                </Link>
              </div>
            </div>
          )}

          {/* Carte Premium pour utilisateurs gratuits */}
          {user && !limits.is_premium && (
            <div className="premium-upgrade-card glass-card">
              <div className="premium-card-content">
                <div className="premium-icon">✨</div>
                <div className="premium-text">
                  <h3>Passez Premium</h3>
                  <p>Débloquez toutes les fonctionnalités avancées :</p>
                  <ul className="premium-features-list">
                    <li>✅ <strong>100 000 caractères</strong> par génération (au lieu de 2 000)</li>
                    <li>✅ <strong>Générations illimitées</strong> par jour (au lieu de 10)</li>
                    <li>✅ <strong>Téléchargement</strong> de tous vos fichiers</li>
                    <li>✅ <strong>Historique complet</strong> sans limite</li>
                    <li>✅ <strong>Support prioritaire</strong></li>
                  </ul>
                  <div className="premium-price">
                    <span className="price-amount">9,99 €</span>
                    <span className="price-period">paiement unique</span>
                  </div>
                </div>
              </div>
              <div className="premium-card-action">
                <Link to="/premium" className="btn-premium">
                  <span>✨</span>
                  <span>Passer Premium</span>
                </Link>
              </div>
            </div>
          )}

          {/* Historique utilisateur */}
          {user && <UserHistory />}
        </div>
      </div>
    </div>
  );
};

export default TTSInterface;