import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './PremiumUpgrade.css';

const PremiumUpgrade = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const handleUpgrade = async () => {
    if (!user) {
      setError('Vous devez être connecté pour passer Premium');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Appeler le backend pour créer une session Stripe
      const response = await axios.post(
        `${API_BASE_URL}/stripe/create-checkout-session`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // Rediriger vers Stripe Checkout
        window.location.href = response.data.checkout_url;
      }
    } catch (err) {
      console.error('Erreur lors de la création de la session:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la création de la session de paiement');
    } finally {
      setLoading(false);
    }
  };

  const handleTestActivation = async () => {
    if (!user) {
      setError('Vous devez être connecté');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Activer Premium en mode test
      const response = await axios.post(
        `${API_BASE_URL}/stripe/activate-premium-test`,
        {},
        { withCredentials: true }
      );

      if (response.data.success) {
        // Rafraîchir les données utilisateur
        await refreshUser();
        // Rediriger vers l'app
        window.location.href = '/app';
      }
    } catch (err) {
      console.error('Erreur lors de l\'activation test:', err);
      setError(err.response?.data?.detail || 'Erreur lors de l\'activation Premium');
    } finally {
      setLoading(false);
    }
  };

  if (user?.is_premium) {
    return (
      <div className="premium-status">
        <div className="premium-badge">
          <span className="badge-icon">✨</span>
          <span className="badge-text">Compte Premium</span>
        </div>
        <p>Vous profitez déjà de tous les avantages Premium !</p>
      </div>
    );
  }

  return (
    <div className="premium-upgrade">
      <div className="premium-card">
        <div className="premium-header">
          <h2>✨ Passez Premium</h2>
          <p className="premium-subtitle">Débloquez toutes les fonctionnalités</p>
        </div>

        <div className="premium-features">
          <h3>Inclus dans Premium :</h3>
          <ul>
            <li>✅ <strong>Générations illimitées</strong> jusqu'à 2000 caractères</li>
            <li>✅ <strong>Téléchargement</strong> de tous vos fichiers audio</li>
            <li>✅ <strong>Historique complet</strong> de vos générations</li>
            <li>✅ <strong>Accès prioritaire</strong> aux nouvelles voix</li>
            <li>✅ <strong>Support premium</strong></li>
          </ul>
        </div>

        <div className="premium-pricing">
          <div className="price">
            <span className="price-amount">9,99 €</span>
            <span className="price-period">paiement unique</span>
          </div>
        </div>

        {error && (
          <div className="premium-error">
            ⚠️ {error}
          </div>
        )}

        <button
          className="premium-button"
          onClick={handleUpgrade}
          disabled={loading || !user}
        >
          {loading ? (
            <>
              <span className="spinner">⟳</span>
              Chargement...
            </>
          ) : (
            <>
              <span>🔒</span>
              Passer Premium avec Stripe
            </>
          )}
        </button>

        <button
          className="premium-button test-button"
          onClick={handleTestActivation}
          disabled={loading || !user}
          style={{ marginTop: '1rem', background: '#10b981' }}
        >
          {loading ? (
            <>
              <span className="spinner">⟳</span>
              Chargement...
            </>
          ) : (
            <>
              <span>🧪</span>
              Activer Premium (TEST - Sans paiement)
            </>
          )}
        </button>

        <p className="premium-secure">
          🔒 Paiement sécurisé par Stripe
        </p>
      </div>
    </div>
  );
};

export default PremiumUpgrade;