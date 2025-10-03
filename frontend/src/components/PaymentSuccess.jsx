import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('Session invalide');
        setVerifying(false);
        return;
      }

      try {
        // Vérifier le paiement côté serveur
        const response = await axios.get(
          `${API_BASE_URL}/stripe/verify-payment/${sessionId}`,
          { withCredentials: true }
        );

        if (response.data.success) {
          // Rafraîchir les données utilisateur pour obtenir le statut premium
          await refreshUser();
          setTimeout(() => setVerifying(false), 1500);
        }
      } catch (err) {
        console.error('Erreur lors de la vérification:', err);
        setError('Impossible de vérifier le paiement');
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, refreshUser]);

  const handleContinue = () => {
    navigate('/app');
  };

  if (verifying) {
    return (
      <div className="payment-result">
        <div className="payment-card verifying">
          <div className="spinner-large">⟳</div>
          <h2>Vérification du paiement...</h2>
          <p>Veuillez patienter</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-result">
        <div className="payment-card error">
          <div className="icon-large">❌</div>
          <h2>Erreur</h2>
          <p>{error}</p>
          <button className="result-button" onClick={() => navigate('/app')}>
            Retour à l'application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result">
      <div className="payment-card success">
        <div className="icon-large">🎉</div>
        <h2>Paiement réussi !</h2>
        <p className="success-message">
          Félicitations ! Vous êtes maintenant membre <strong>Premium</strong>
        </p>

        <div className="benefits-box">
          <h3>✨ Vos nouveaux avantages :</h3>
          <ul>
            <li>✅ Générations illimitées jusqu'à 2000 caractères</li>
            <li>✅ Téléchargement de tous vos fichiers audio</li>
            <li>✅ Historique complet de vos générations</li>
            <li>✅ Accès prioritaire aux nouvelles voix</li>
            <li>✅ Support premium</li>
          </ul>
        </div>

        <button className="result-button" onClick={handleContinue}>
          Commencer à utiliser Premium
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
