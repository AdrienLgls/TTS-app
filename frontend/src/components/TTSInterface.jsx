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
import axios from 'axios';
import VoiceSelector from './VoiceSelector';
import AudioPlayer from './AudioPlayer';
import './TTSInterface.css';

const TTSInterface = () => {
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

  // URL de l'API Kokoro optimisée (environnement de développement)
  // Production : remplacer par l'URL du serveur déployé
  const API_BASE_URL = 'http://localhost:8000';

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

    if (text.length > 2000) {
      setError('Le texte ne peut pas dépasser 2000 caractères');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      console.log('🎤 Génération audio avec:', { text: text.substring(0, 50) + '...', voice: selectedVoice, speed });

      const response = await axios.post(`${API_BASE_URL}/tts`, {
        text: text,
        voice: selectedVoice,
        speed: speed,
        format: 'wav'
      });

      if (response.data.success) {
        const audioFullUrl = `${API_BASE_URL}${response.data.audio_url}`;
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
      <div className="tts-container">
        
        {/* Section de saisie de texte */}
        <div className="text-input-section">
          <label htmlFor="text-input" className="input-label">
            Texte à synthétiser ({text.length}/2000)
          </label>
          
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

          {/* Exemples de texte */}
          <div className="examples-section">
            <span className="examples-label">Exemples :</span>
            <div className="examples-buttons">
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
            </div>
          </div>
        </div>

        {/* Section de configuration */}
        <div className="config-section">
          <div className="config-row">
            {/* Sélecteur de voix */}
            <VoiceSelector
              selectedVoice={selectedVoice}
              onVoiceChange={setSelectedVoice}
            />

            {/* Contrôle de vitesse */}
            <div className="speed-control">
              <label htmlFor="speed-slider" className="control-label">
                Vitesse: {speed}x
              </label>
              <input
                type="range"
                id="speed-slider"
                className="speed-slider"
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

        {/* Bouton de génération */}
        <div className="generate-section">
          <button
            className={`generate-button ${isLoading ? 'loading' : ''}`}
            onClick={handleGenerate}
            disabled={isLoading || !text.trim()}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner">⟳</span>
                Génération en cours...
              </>
            ) : (
              'Générer l\'audio'
            )}
          </button>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Lecteur audio et téléchargement */}
        {audioUrl && (
          <div className="audio-section">
            <AudioPlayer
              audioUrl={audioUrl}
              onDownload={handleDownload}
              generationInfo={lastGeneration}
            />
          </div>
        )}

        {/* Informations de la dernière génération */}
        {lastGeneration && (
          <div className="generation-info">
            <h4>Dernière génération</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Voix:</span>
                <span className="info-value">{lastGeneration.voice}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Durée:</span>
                <span className="info-value">{lastGeneration.duration?.toFixed(2)}s</span>
              </div>
              <div className="info-item">
                <span className="info-label">Génération:</span>
                <span className="info-value">{lastGeneration.generationTime?.toFixed(2)}s</span>
              </div>
              <div className="info-item">
                <span className="info-label">Segments:</span>
                <span className="info-value">{lastGeneration.segments}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Heure:</span>
                <span className="info-value">{lastGeneration.timestamp}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TTSInterface;