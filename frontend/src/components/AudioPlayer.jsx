/**
 * Lecteur audio professionnel pour fichiers générés par TTS
 * 
 * Composant React avancé offrant une expérience d'écoute complète :
 * - Contrôles audio standard (lecture, pause, volume, recherche)
 * - Barre de progression interactive
 * - Contrôles temporels avancés (+/-10s, début)
 * - Affichage des métadonnées de génération
 * - Gestion robuste des erreurs de lecture
 * - Interface responsive et accessible
 * 
 * Optimisé pour les fichiers WAV de haute qualité générés par Kokoro.
 */

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './AudioPlayer.css';

const AudioPlayer = ({ audioUrl, onDownload, generationInfo }) => {
  const { user } = useAuth();
  // ===============================
  // ÉTATS DU LECTEUR AUDIO
  // ===============================
  
  // État de lecture actuel (lecture/pause)
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Durée totale du fichier audio (en secondes)
  const [duration, setDuration] = useState(0);
  
  // Position actuelle de lecture (en secondes)
  const [currentTime, setCurrentTime] = useState(0);
  
  // Niveau de volume (0.0 à 1.0)
  const [volume, setVolume] = useState(1);
  
  // État de chargement du fichier audio
  const [isLoading, setIsLoading] = useState(true);
  
  // Gestion des erreurs de lecture
  const [error, setError] = useState(null);

  // Référence vers l'élément HTML audio natif
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      setIsLoading(true);
      setError(null);
      
      // Reset du lecteur
      audioRef.current.load();
    }
  }, [audioUrl]);

  // ===============================
  // GESTIONNAIRES D'ÉVÉNEMENTS AUDIO
  // ===============================
  
  /**
   * Gestionnaire de métadonnées audio chargées
   * Exécuté quand le navigateur a les informations de base du fichier.
   */
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleError = (e) => {
    console.error('❌ Erreur lecture audio:', e);
    setError('Impossible de lire le fichier audio');
    setIsLoading(false);
  };

  const handleLoadStart = () => {
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
  };

  // ===============================
  // CONTRÔLES UTILISATEUR
  // ===============================
  
  /**
   * Bascule entre lecture et pause
   * Gère les promesses de lecture et les erreurs navigateur.
   */
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error('❌ Erreur lecture:', error);
            setError('Impossible de lire l\'audio');
          });
      }
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && duration) {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const newTime = percent * duration;
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // ===============================
  // UTILITAIRES DE FORMATAGE
  // ===============================
  
  /**
   * Formate le temps en format MM:SS
   * Gère les valeurs NaN et les seconds avec zéro préfixe.
   * 
   * @param {number} time - Temps en secondes
   * @returns {string} Temps formaté (ex: "3:45")
   */
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  /**
   * Calcule le pourcentage de progression de lecture
   * Utilisé pour la barre de progression et le thumb.
   * 
   * @returns {number} Pourcentage de 0 à 100
   */
  const getProgressPercentage = () => {
    return duration ? (currentTime / duration) * 100 : 0;
  };

  return (
    <div className="audio-player modern">
      {/* Élément audio */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        preload="metadata"
      />

      {/* Header du lecteur */}
      <div className="player-header">
        <h3 className="player-title">🎵 Lecteur Audio</h3>
        {generationInfo && (
          <div className="player-badge">
            <span className="voice-badge">{generationInfo.voice}</span>
          </div>
        )}
      </div>

      {/* Interface du lecteur */}
      <div className="player-interface">
        
        {/* État de chargement */}
        {isLoading && (
          <div className="loading-state modern-loading">
            <div className="loading-content">
              <span className="loading-spinner">⟳</span>
              <span>Chargement de l'audio...</span>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="error-state modern-alert">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Contrôles principaux */}
        {!isLoading && !error && (
          <>
            <div className="main-controls">
              {/* Bouton Play/Pause */}
              <button
                className={`play-button modern-btn ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                disabled={isLoading || error}
              >
                <span className="btn-icon">{isPlaying ? '⏸️' : '▶️'}</span>
                <span className="btn-text">{isPlaying ? 'Pause' : 'Lire'}</span>
              </button>

              {/* Informations temporelles */}
              <div className="time-info">
                <div className="time-display">
                  <span className="current-time">{formatTime(currentTime)}</span>
                  <span className="time-separator">/</span>
                  <span className="total-time">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Bouton de téléchargement - Seulement pour utilisateurs connectés */}
              {user && (
                <button
                  className="download-button modern-btn secondary"
                  onClick={onDownload}
                  title="Télécharger l'audio"
                >
                  <span className="btn-icon">⬇️</span>
                  <span className="btn-text">Télécharger</span>
                </button>
              )}
            </div>

            {/* Barre de progression */}
            <div className="progress-section">
              <div
                className="progress-bar modern-progress"
                onClick={handleSeek}
              >
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                  <div
                    className="progress-thumb"
                    style={{ left: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Contrôle du volume */}
            <div className="volume-control">
              <div className="volume-header">
                <span className="volume-icon">🔊</span>
                <label className="volume-label">
                  Volume: <span className="volume-value">{Math.round(volume * 100)}%</span>
                </label>
              </div>
              <input
                type="range"
                className="volume-slider modern-slider"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>
          </>
        )}

        {/* Informations sur la génération */}
        {generationInfo && !isLoading && (
          <div className="generation-summary">
            <div className="summary-grid">
              <div className="summary-item">
                <div className="summary-icon">🎭</div>
                <div className="summary-content">
                  <span className="summary-label">Voix</span>
                  <span className="summary-value">{generationInfo.voice}</span>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">⚡</div>
                <div className="summary-content">
                  <span className="summary-label">Vitesse</span>
                  <span className="summary-value">{generationInfo.speed}x</span>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">⏱️</div>
                <div className="summary-content">
                  <span className="summary-label">Génération</span>
                  <span className="summary-value">{generationInfo.generationTime?.toFixed(2)}s</span>
                </div>
              </div>
              <div className="summary-item">
                <div className="summary-icon">📊</div>
                <div className="summary-content">
                  <span className="summary-label">Segments</span>
                  <span className="summary-value">{generationInfo.segments}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions supplémentaires */}
        <div className="player-actions">
          <button
            className="action-button modern-btn tertiary"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            disabled={isLoading || error}
            title="Revenir au début"
          >
            <span className="btn-icon">⏮️</span>
            <span className="btn-text">Début</span>
          </button>

          <button
            className="action-button modern-btn tertiary"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
              }
            }}
            disabled={isLoading || error}
            title="Reculer de 10 secondes"
          >
            <span className="btn-icon">⏪</span>
            <span className="btn-text">-10s</span>
          </button>

          <button
            className="action-button modern-btn tertiary"
            onClick={() => {
              if (audioRef.current && duration) {
                audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
              }
            }}
            disabled={isLoading || error}
            title="Avancer de 10 secondes"
          >
            <span className="btn-icon">⏩</span>
            <span className="btn-text">+10s</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;