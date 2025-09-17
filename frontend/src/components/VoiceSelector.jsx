/**
 * Composant de sélection de voix pour la synthèse vocale
 * 
 * Interface utilisateur avancée pour le choix de voix :
 * - Récupération dynamique depuis l'API Kokoro
 * - Fallback sur voix locales en cas d'échec API
 * - Affichage enrichi avec métadonnées (descriptions, recommandations)
 * - Interface intuitive avec prévisualisation
 * - Gestion robuste des états d'erreur
 * 
 * Intégré avec l'API Kokoro optimisée pour performances maximales.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import './VoiceSelector.css';

const VoiceSelector = ({ selectedVoice, onVoiceChange }) => {
  // ===============================
  // ÉTATS DU COMPOSANT
  // ===============================
  
  // Liste des voix disponibles avec métadonnées enrichies
  const [voices, setVoices] = useState([]);
  
  // État de chargement des voix depuis l'API
  const [loading, setLoading] = useState(true);
  
  // Gestion des erreurs de récupération
  const [error, setError] = useState(null);

  // Configuration API (coherte avec TTSInterface)
  const API_BASE_URL = '/api';

  // ===============================
  // CHARGEMENT DES DONNÉES
  // ===============================
  
  /**
   * Récupération des voix depuis l'API avec fallback
   * 
   * Stratégie robuste :
   * 1. Tentative de récupération depuis l'API
   * 2. Fallback sur configuration locale si échec
   * 3. Gestion d'état et logging des erreurs
   */
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/voices`);
        setVoices(response.data);
        console.log('✅ Voix chargées:', response.data);
      } catch (error) {
        console.error('❌ Erreur chargement voix:', error);
        
        // Configuration de fallback basée sur les tests validés
        // Garantit le fonctionnement même en cas de problème API
        setVoices([
          {
            id: "af_heart",
            name: "Heart",
            description: "Voix féminine chaleureuse et expressive",
            language: "en-US",
            gender: "female",
            recommended: true
          },
          {
            id: "af_bella",
            name: "Bella",
            description: "Voix féminine claire et articulée",
            language: "en-US", 
            gender: "female",
            recommended: false
          },
          {
            id: "af_sarah",
            name: "Sarah",
            description: "Voix féminine douce et naturelle",
            language: "en-US",
            gender: "female", 
            recommended: false
          }
        ]);
        setError('API non accessible, utilisation des voix par défaut');
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  /**
   * Gestionnaire de changement de voix
   * 
   * Propage la sélection au composant parent et log pour debugging.
   * 
   * @param {string} voiceId - Identifiant de la voix sélectionnée
   */
  const handleVoiceChange = (voiceId) => {
    onVoiceChange(voiceId);
    console.log('🎤 Voix sélectionnée:', voiceId);
  };

  if (loading) {
    return (
      <div className="voice-selector">
        <label className="control-label">Voix</label>
        <div className="voice-loading">
          <span>Chargement des voix...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-selector">
      <label className="control-label">
        Voix {error && <span className="error-indicator">⚠</span>}
      </label>
      
      {error && (
        <div className="voice-error">
          {error}
        </div>
      )}

      <div className="voice-options">
        {voices.map((voice) => (
          <div
            key={voice.id}
            className={`voice-option ${selectedVoice === voice.id ? 'selected' : ''} ${voice.recommended ? 'recommended' : ''}`}
            onClick={() => handleVoiceChange(voice.id)}
          >
            <div className="voice-header">
              <span className="voice-name">
                {voice.name}
                {voice.recommended && <span className="recommended-badge">Recommandé</span>}
              </span>
              <span className="voice-gender">{voice.gender}</span>
            </div>
            
            <div className="voice-description">
              {voice.description}
            </div>
            
            <div className="voice-meta">
              <span className="voice-language">{voice.language}</span>
              <span className="voice-id">({voice.id})</span>
            </div>

            {selectedVoice === voice.id && (
              <div className="selection-indicator">
                Sélectionnée
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Preview section - pour futurs tests rapides */}
      <div className="voice-preview">
        <span className="preview-label">Sélection actuelle :</span>
        <span className="preview-voice">
          {voices.find(v => v.id === selectedVoice)?.name || selectedVoice}
        </span>
      </div>
    </div>
  );
};

export default VoiceSelector;