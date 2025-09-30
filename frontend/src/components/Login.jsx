import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/app');
    } else {
      setError(result.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Connexion</h1>
            <p>Connectez-vous à votre compte VoiceAI</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="auth-input"
                placeholder="votre@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="auth-input"
                placeholder="Votre mot de passe"
              />
            </div>

            {error && (
              <div className="auth-error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`auth-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <span className="spinner">⟳</span>
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Pas encore de compte ?{' '}
              <Link to="/register" className="auth-link">
                Créer un compte
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-side">
          <div className="auth-side-content">
            <h2>Bienvenue sur VoiceAI</h2>
            <p>
              Accédez à toutes les fonctionnalités de notre plateforme de synthèse vocale.
            </p>
            <ul className="feature-list">
              <li>💾 Historique de vos générations</li>
              <li>🎭 Accès aux voix premium</li>
              <li>📊 Statistiques d'utilisation</li>
              <li>⚡ Génération prioritaire</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;