import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './UserHistory.css';

const UserHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const TTS_API_URL = import.meta.env.VITE_TTS_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (user) {
      fetchHistory();
    }

    // Écouter l'événement de mise à jour de l'historique
    const handleHistoryUpdate = () => {
      if (user) {
        fetchHistory();
      }
    };

    window.addEventListener('historyUpdated', handleHistoryUpdate);

    return () => {
      window.removeEventListener('historyUpdated', handleHistoryUpdate);
    };
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/generations`, {
        withCredentials: true
      });

      if (response.data.success) {
        setHistory(response.data.generations);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      setError('Impossible de charger l\'historique');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds) => {
    // Gérer le cas null/undefined
    if (seconds === null || seconds === undefined) {
      return 'N/A';
    }
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(1);
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="loading-spinner">⟳</div>
        <p>Chargement de l'historique...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-error">
        <span>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <div className="empty-icon">📝</div>
        <h3>Aucune génération</h3>
        <p>Vos générations audio apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="user-history">
      <div className="history-header">
        <h2>📚 Historique</h2>
        <span className="history-count">{history.length} génération{history.length > 1 ? 's' : ''}</span>
      </div>

      <div className="history-list">
        {history.map((generation) => (
          <div key={generation.id} className="history-item">
            <div className="item-header">
              <div className="item-info">
                <span className="item-voice">🎭 {generation.voice}</span>
                <span className="item-date">{formatDate(generation.created_at)}</span>
              </div>
              <div className="item-stats">
                <span className="item-duration">⏱️ {formatDuration(generation.audio_duration)}</span>
                <span className="item-speed">⚡ {generation.speed}x</span>
              </div>
            </div>

            <div className="item-text">
              <p>{generation.text.length > 150 ? generation.text.substring(0, 150) + '...' : generation.text}</p>
            </div>

            <div className="item-actions">
              {generation.audio_url && (
                <>
                  <button
                    className="action-btn play"
                    onClick={() => {
                      // Détecter si c'est une voix clonée (commence par "cloned-")
                      const isClonedVoice = generation.voice.startsWith('cloned-');
                      const baseUrl = isClonedVoice
                        ? (API_BASE_URL?.replace('/api', '') || 'http://localhost:3000')
                        : TTS_API_URL;
                      const audioFullUrl = `${baseUrl}${generation.audio_url}`;
                      const audio = new Audio(audioFullUrl);
                      audio.play();
                    }}
                    title="Écouter l'audio"
                  >
                    ▶️ Écouter
                  </button>
                  <button
                    className="action-btn download"
                    onClick={() => {
                      // Détecter si c'est une voix clonée (commence par "cloned-")
                      const isClonedVoice = generation.voice.startsWith('cloned-');
                      const baseUrl = isClonedVoice
                        ? (API_BASE_URL?.replace('/api', '') || 'http://localhost:3000')
                        : TTS_API_URL;
                      const audioFullUrl = `${baseUrl}${generation.audio_url}`;
                      const link = document.createElement('a');
                      link.href = audioFullUrl;
                      link.download = `voiceai-${generation.id}.wav`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    title="Télécharger l'audio"
                  >
                    💾 Télécharger
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {history.length >= 10 && (
        <div className="history-footer">
          <button className="load-more-btn" onClick={fetchHistory}>
            Charger plus
          </button>
        </div>
      )}
    </div>
  );
};

export default UserHistory;