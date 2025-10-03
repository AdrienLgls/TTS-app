import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './VoiceCloning.css';

const VoiceCloning = () => {
  const { user } = useAuth();
  const [clonedVoices, setClonedVoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Formulaire d'upload
  const [voiceName, setVoiceName] = useState('');
  const [voiceDescription, setVoiceDescription] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [audioPreview, setAudioPreview] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (user?.is_premium) {
      fetchClonedVoices();
    }
  }, [user]);

  const fetchClonedVoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/voice-cloning/my-voices`, {
        withCredentials: true
      });

      if (response.data.success) {
        setClonedVoices(response.data.voices);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des voix:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setError('Veuillez sélectionner un fichier audio');
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10 MB max
        setError('Le fichier est trop volumineux (max 10 MB)');
        return;
      }

      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!audioFile || !voiceName.trim()) {
      setError('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('name', voiceName);
      formData.append('description', voiceDescription);
      formData.append('audio_file', audioFile);

      const response = await axios.post(
        `${API_BASE_URL}/voice-cloning/upload`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccess('Voix clonée avec succès !');
        setVoiceName('');
        setVoiceDescription('');
        setAudioFile(null);
        setAudioPreview(null);
        await fetchClonedVoices();

        // Réinitialiser le formulaire après 2 secondes
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err) {
      console.error('Erreur lors de l\'upload:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'upload de la voix');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (voiceId) => {
    if (!confirm('Voulez-vous vraiment supprimer cette voix clonée ?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/voice-cloning/${voiceId}`,
        { withCredentials: true }
      );

      if (response.data.success) {
        setSuccess('Voix supprimée avec succès');
        await fetchClonedVoices();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError('Erreur lors de la suppression de la voix');
    }
  };

  if (!user) {
    return (
      <div className="voice-cloning-container">
        <div className="cloning-message">
          <h3>🔒 Connexion requise</h3>
          <p>Connectez-vous pour accéder au clonage vocal</p>
        </div>
      </div>
    );
  }

  if (!user.is_premium) {
    return (
      <div className="voice-cloning-container">
        <div className="cloning-premium-required">
          <div className="premium-icon">✨</div>
          <h3>Fonctionnalité Premium</h3>
          <p>Le clonage vocal est réservé aux membres Premium</p>
          <a href="/premium" className="btn-upgrade">
            Passer Premium
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-cloning-container">
      <div className="cloning-header">
        <h2>🎤 Clonage Vocal</h2>
        <p>Créez votre propre voix synthétique à partir d'un échantillon audio</p>
      </div>

      {/* Formulaire d'upload */}
      <div className="cloning-upload glass-card">
        <h3>Créer une nouvelle voix</h3>
        <form onSubmit={handleUpload} className="upload-form">
          <div className="form-group">
            <label htmlFor="voiceName">Nom de la voix *</label>
            <input
              type="text"
              id="voiceName"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="Ma voix personnalisée"
              required
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="voiceDescription">Description (optionnel)</label>
            <textarea
              id="voiceDescription"
              value={voiceDescription}
              onChange={(e) => setVoiceDescription(e.target.value)}
              placeholder="Description de la voix..."
              rows={3}
              disabled={uploading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="audioFile">Échantillon audio (5-30 secondes) *</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="audioFile"
                accept="audio/*"
                onChange={handleFileChange}
                required
                disabled={uploading}
              />
              <label htmlFor="audioFile" className="file-input-label">
                {audioFile ? audioFile.name : '📁 Choisir un fichier audio'}
              </label>
            </div>
            {audioPreview && (
              <div className="audio-preview">
                <p>Aperçu :</p>
                <audio controls src={audioPreview} />
              </div>
            )}
          </div>

          {error && (
            <div className="message error-message">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="message success-message">
              ✅ {success}
            </div>
          )}

          <button type="submit" className="btn-upload" disabled={uploading}>
            {uploading ? (
              <>
                <span className="spinner">⟳</span>
                Clonage en cours...
              </>
            ) : (
              <>
                <span>🎤</span>
                Cloner la voix
              </>
            )}
          </button>
        </form>

        <div className="upload-tips">
          <h4>💡 Conseils pour un meilleur clonage :</h4>
          <ul>
            <li>Enregistrez 5 à 30 secondes d'audio clair</li>
            <li>Utilisez un environnement calme sans bruit de fond</li>
            <li>Parlez naturellement avec des intonations variées</li>
            <li>Évitez les formats audio compressés (privilégiez WAV ou FLAC)</li>
          </ul>
        </div>
      </div>

      {/* Liste des voix clonées */}
      <div className="cloned-voices-list">
        <h3>Mes voix clonées ({clonedVoices.length})</h3>

        {loading ? (
          <div className="loading-message">
            <span className="spinner">⟳</span>
            Chargement...
          </div>
        ) : clonedVoices.length === 0 ? (
          <div className="empty-message">
            <p>Vous n'avez pas encore de voix clonée</p>
            <p>Créez votre première voix personnalisée ci-dessus !</p>
          </div>
        ) : (
          <div className="voices-grid">
            {clonedVoices.map((voice) => (
              <div key={voice.id} className="voice-card glass-card">
                <div className="voice-card-header">
                  <h4>{voice.name}</h4>
                  <span className={`status-badge ${voice.status}`}>
                    {voice.status === 'ready' ? '✅ Prêt' : '⏳ En cours'}
                  </span>
                </div>

                {voice.description && (
                  <p className="voice-description">{voice.description}</p>
                )}

                <div className="voice-card-actions">
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(voice.id)}
                  >
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceCloning;
