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
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './VoiceSelector.css';

const VoiceSelector = ({ selectedVoice, onVoiceChange }) => {
  // ===============================
  // ÉTATS DU COMPOSANT
  // ===============================

  const { user } = useAuth();

  // Liste des voix disponibles avec métadonnées enrichies
  const [voices, setVoices] = useState([]);

  // Liste des voix clonées de l'utilisateur
  const [clonedVoices, setClonedVoices] = useState([]);

  // État de chargement des voix depuis l'API
  const [loading, setLoading] = useState(true);

  // Gestion des erreurs de récupération
  const [error, setError] = useState(null);

  // Configuration API (API Kokoro TTS)
  const TTS_API_URL = import.meta.env.VITE_TTS_API_URL || 'http://localhost:8000';
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        const response = await axios.get(`${TTS_API_URL}/voices`);

        // Vérifier que la réponse est bien un tableau JSON
        if (Array.isArray(response.data)) {
          setVoices(response.data);
          console.log('✅ Voix chargées:', response.data);
        } else {
          throw new Error('Réponse API invalide - format non reconnu');
        }
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

  // Charger les voix clonées si l'utilisateur est Premium
  useEffect(() => {
    const fetchClonedVoices = async () => {
      if (!user?.is_premium) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/voice-cloning/my-voices`, {
          withCredentials: true
        });

        if (response.data.success) {
          setClonedVoices(response.data.voices);
          console.log('✅ Voix clonées chargées:', response.data.voices);
        }
      } catch (error) {
        console.error('❌ Erreur chargement voix clonées:', error);
      }
    };

    fetchClonedVoices();
  }, [user]);

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
      <div className="voice-selector modern">
        <div className="selector-header">
          <h4 className="selector-title">💭 Sélection de voix</h4>
        </div>
        <div className="voice-loading">
          <div className="loading-spinner">⟳</div>
          <span>Chargement des voix disponibles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-selector modern">
      <div className="selector-header">
        <h4 className="selector-title">🎭 Sélection de voix</h4>
        {error && <span className="error-indicator">⚠️</span>}
      </div>

      {error && (
        <div className="voice-error modern-alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="voice-options-grid">
        {/* Voix pré-entraînées */}
        {Array.isArray(voices) && voices.map((voice) => (
          <div
            key={voice.id}
            className={`voice-card ${
              selectedVoice === voice.id ? 'selected' : ''
            } ${
              voice.recommended ? 'recommended' : ''
            }`}
            onClick={() => handleVoiceChange(voice.id)}
          >
            {voice.recommended && (
              <div className="recommended-badge">
                ⭐ Recommandée
              </div>
            )}

            <div className="voice-info">
              <div className="voice-avatar">
                {voice.gender === 'female' ? '👩' : '👨'}
              </div>

              <div className="voice-details">
                <h5 className="voice-name">{voice.name}</h5>
                <p className="voice-description">{voice.description}</p>

                <div className="voice-meta">
                  <span className="voice-tag gender">{voice.gender}</span>
                  <span className="voice-tag language">{voice.language}</span>
                </div>
              </div>
            </div>

            {selectedVoice === voice.id && (
              <div className="selection-indicator">
                <div className="check-icon">✓</div>
              </div>
            )}
          </div>
        ))}

        {/* Voix clonées (Premium uniquement) */}
        {clonedVoices.length > 0 && (
          <>
            <div className="voices-divider">
              <span>✨ Mes voix clonées</span>
            </div>
            {clonedVoices.map((voice) => (
              <div
                key={`cloned-${voice.id}`}
                className={`voice-card cloned ${
                  selectedVoice === `cloned-${voice.id}` ? 'selected' : ''
                }`}
                onClick={() => handleVoiceChange(`cloned-${voice.id}`)}
              >
                <div className="cloned-badge">
                  🎤 Clonée
                </div>

                <div className="voice-info">
                  <div className="voice-avatar">
                    ⭐
                  </div>

                  <div className="voice-details">
                    <h5 className="voice-name">{voice.name}</h5>
                    <p className="voice-description">
                      {voice.description || 'Voix personnalisée'}
                    </p>

                    <div className="voice-meta">
                      <span className="voice-tag cloned">Personnalisée</span>
                      <span className="voice-tag status">{voice.status === 'ready' ? '✅ Prêt' : '⏳ En cours'}</span>
                    </div>
                  </div>
                </div>

                {selectedVoice === `cloned-${voice.id}` && (
                  <div className="selection-indicator">
                    <div className="check-icon">✓</div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <div className="current-selection">
        <div className="selection-info">
          <span className="selection-label">Voix sélectionnée :</span>
          <span className="selection-value">
            {Array.isArray(voices) ? voices.find(v => v.id === selectedVoice)?.name || selectedVoice : selectedVoice}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelector;