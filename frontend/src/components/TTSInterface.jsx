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

import { useState, useRef } from 'react';
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

    // Limite dynamique selon l'authentification
    const maxLength = user ? 2000 : 300;
    if (text.length > maxLength) {
      setError(`Le texte ne peut pas dépasser ${maxLength} caractères${!user ? ' (connectez-vous pour 2000 caractères)' : ''}`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      console.log('🎤 Génération audio avec:', { text: text.substring(0, 50) + '...', voice: selectedVoice, speed });

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
          } catch (saveError) {
            console.error('⚠️ Erreur lors de la sauvegarde dans l\'historique:', saveError);
            // On ne bloque pas l'utilisateur si la sauvegarde échoue
          }
        }
      } else {
        throw new Error(response.data.message || 'Erreur lors de la génération');
      }

    } catch (error) {
      console.error('❌ Erreur génération:', error);
      
      if (error.response) {
        // Erreur de l'API
        setError(`Erreur API: ${error.response.data.detail || error.response.status}`);
      } else if (error.request) {
        // Erreur réseau
        setError('Impossible de contacter l\'API. Vérifiez qu\'elle est démarrée sur localhost:8000');
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
            <div className="user-info">
              {user ? (
                <>
                  <span className="user-greeting">Bonjour, {user.name}</span>
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
              <span className="char-counter">{text.length}/{user ? '2000' : '300'} caractères</span>
            </div>

            <textarea
              ref={textareaRef}
              id="text-input"
              className="text-input modern-input"
              placeholder={user ? "Saisissez le texte à convertir en audio..." : "Saisissez un texte court (max 300 caractères) - Connectez-vous pour plus !"}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              maxLength={user ? 2000 : 300}
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

          {/* Historique utilisateur */}
          {user && <UserHistory />}
        </div>
      </div>
    </div>
  );
};

export default TTSInterface;