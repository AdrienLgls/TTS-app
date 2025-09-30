import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    const result = await register(formData.email, formData.password, formData.name);

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
            <h1>Créer un compte</h1>
            <p>Rejoignez VoiceAI et découvrez la synthèse vocale avancée</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Nom complet</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="auth-input"
                placeholder="Votre nom complet"
              />
            </div>

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
                placeholder="Au moins 6 caractères"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="auth-input"
                placeholder="Répétez votre mot de passe"
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
                  Création...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Déjà un compte ?{' '}
              <Link to="/login" className="auth-link">
                Se connecter
              </Link>
            </p>
          </div>
        </div>

        <div className="auth-side">
          <div className="auth-side-content">
            <h2>Rejoignez VoiceAI</h2>
            <p>
              Créez votre compte gratuitement et bénéficiez de toutes nos fonctionnalités.
            </p>
            <ul className="feature-list">
              <li>🆓 Compte gratuit avec 100 générations/mois</li>
              <li>🎭 Accès à toutes les voix de base</li>
              <li>💾 Sauvegarde de vos créations</li>
              <li>📈 Suivi de votre utilisation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;