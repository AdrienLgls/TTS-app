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
import './AudioPlayer.css';

const AudioPlayer = ({ audioUrl, onDownload, generationInfo }) => {
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
    <div className="audio-player">
      <h3>Lecteur Audio</h3>
      
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

      {/* Interface du lecteur */}
      <div className="player-interface">
        
        {/* État de chargement */}
        {isLoading && (
          <div className="loading-state">
            <span className="loading-spinner">⟳</span>
            Chargement de l'audio...
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="error-state">
            {error}
          </div>
        )}

        {/* Contrôles principaux */}
        {!isLoading && !error && (
          <>
            <div className="main-controls">
              {/* Bouton Play/Pause */}
              <button
                className={`play-button ${isPlaying ? 'playing' : ''}`}
                onClick={togglePlay}
                disabled={isLoading || error}
              >
                {isPlaying ? 'Pause' : 'Lire'}
              </button>

              {/* Informations temporelles */}
              <div className="time-info">
                <span className="current-time">{formatTime(currentTime)}</span>
                <span className="time-separator">/</span>
                <span className="total-time">{formatTime(duration)}</span>
              </div>

              {/* Bouton de téléchargement */}
              <button
                className="download-button"
                onClick={onDownload}
                title="Télécharger l'audio"
              >
                Télécharger
              </button>
            </div>

            {/* Barre de progression */}
            <div className="progress-section">
              <div
                className="progress-bar"
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
              <label className="volume-label">
                Volume: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                className="volume-slider"
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
            <div className="summary-item">
              <span>Voix: <strong>{generationInfo.voice}</strong></span>
            </div>
            <div className="summary-item">
              <span>Vitesse: <strong>{generationInfo.speed}x</strong></span>
            </div>
            <div className="summary-item">
              <span>Généré en: <strong>{generationInfo.generationTime?.toFixed(2)}s</strong></span>
            </div>
            <div className="summary-item">
              <span>Segments: <strong>{generationInfo.segments}</strong></span>
            </div>
          </div>
        )}

        {/* Actions supplémentaires */}
        <div className="player-actions">
          <button
            className="action-button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                setCurrentTime(0);
              }
            }}
            disabled={isLoading || error}
            title="Revenir au début"
          >
            Début
          </button>
          
          <button
            className="action-button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
              }
            }}
            disabled={isLoading || error}
            title="Reculer de 10 secondes"
          >
            -10s
          </button>
          
          <button
            className="action-button"
            onClick={() => {
              if (audioRef.current && duration) {
                audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10);
              }
            }}
            disabled={isLoading || error}
            title="Avancer de 10 secondes"
          >
            +10s
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;