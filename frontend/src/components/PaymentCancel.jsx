import { useNavigate } from 'react-router-dom';
import './PaymentCancel.css';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-result">
      <div className="payment-card cancel">
        <div className="icon-large">💳</div>
        <h2>Paiement annulé</h2>
        <p className="cancel-message">
          Vous avez annulé le processus de paiement.
        </p>
        <p className="cancel-info">
          Aucun montant n'a été débité de votre compte.
        </p>

        <div className="cancel-options">
          <button
            className="result-button primary"
            onClick={() => navigate('/premium')}
          >
            Réessayer le paiement
          </button>
          <button
            className="result-button secondary"
            onClick={() => navigate('/app')}
          >
            Retour à l'application
          </button>
        </div>

        <div className="help-box">
          <p>
            Des questions ? Besoin d'aide ?<br />
            Contactez notre support premium.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
