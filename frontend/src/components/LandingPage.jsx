import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './LandingPage.css';

function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe all feature cards and sections
    const elementsToObserve = document.querySelectorAll('.feature-card, .pricing-card, .section-header');
    elementsToObserve.forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.6s ease';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    const target = document.querySelector(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="landing-page">
      {/* Background Decoration */}
      <div className="bg-decoration">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      {/* Header */}
      <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
        <nav className="nav">
          <div className="logo">VoiceAI</div>
          <div className={`nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')}>Fonctionnalités</a>
            <a href="#pricing" onClick={(e) => handleSmoothScroll(e, '#pricing')}>Tarifs</a>
            <a href="#demo" onClick={(e) => handleSmoothScroll(e, '#demo')}>Démo</a>
            {isAuthenticated ? (
              <Link to="/app" className="btn btn-primary">Dashboard →</Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-glass">Connexion</Link>
                <Link to="/register" className="btn btn-primary">S'inscrire</Link>
              </>
            )}
          </div>
          <button
            className="mobile-menu"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <h1>Donnez une voix à vos idées</h1>
            <p>Transformez instantanément vos textes en voix naturelles et expressives grâce à notre IA de dernière génération. Simple, rapide, et incroyablement réaliste.</p>
            <div className="hero-buttons">
              {isAuthenticated ? (
                <Link to="/app" className="btn btn-primary btn-large">Accéder au Dashboard</Link>
              ) : (
                <Link to="/register" className="btn btn-primary btn-large">Commencer gratuitement</Link>
              )}
              <a href="#demo" className="btn btn-glass btn-large" onClick={(e) => handleSmoothScroll(e, '#demo')}>Voir la démo</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card">
              <div className="demo-interface">
                <div className="demo-header">
                  <span className="demo-dot"></span>
                  <span className="demo-dot"></span>
                  <span className="demo-dot"></span>
                </div>
                <div className="demo-content">
                  <div className="demo-wave"></div>
                  <p style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-light)' }}>
                    Synthèse vocale en cours...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section" id="features">
        <div className="section-container">
          <div className="section-header">
            <h2>Une technologie qui fait la différence</h2>
            <p>Découvrez pourquoi des milliers d'utilisateurs nous font confiance</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🚀</div>
              <h3>Rapidité éclair</h3>
              <p>Génération audio en temps réel, même pour les textes les plus longs. Aucune attente, juste de l'efficacité pure.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎯</div>
              <h3>Précision maximale</h3>
              <p>Notre IA reproduit fidèlement les nuances, les émotions et les intonations pour un rendu ultra-réaliste.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Personnalisation totale</h3>
              <p>Ajustez la vitesse, le ton, et même créez votre propre voix unique avec notre technologie de clonage vocal.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>Multi-langues</h3>
              <p>Support de plus de 50 langues et accents pour toucher une audience mondiale sans barrière.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Sécurité garantie</h3>
              <p>Vos données sont chiffrées et protégées. Confidentialité totale et respect du RGPD.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💡</div>
              <h3>Interface intuitive</h3>
              <p>Conçue pour être utilisée par tous, sans courbe d'apprentissage. Simple, belle et efficace.</p>
            </div>
          </div>
        </div>
      </section>


      {/* Pricing Section */}
      <section className="section" id="pricing">
        <div className="section-container">
          <div className="section-header">
            <h2>Des tarifs adaptés à vos besoins</h2>
            <p>Commencez gratuitement, évoluez à votre rythme</p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <h3>Découverte</h3>
              <div className="price">
                0€
                <span className="price-period">/mois</span>
              </div>
              <ul className="pricing-features">
                <li>10 minutes audio/mois</li>
                <li>Voix standards</li>
                <li>Téléchargement MP3</li>
                <li>Support communautaire</li>
              </ul>
              <Link to="/app" className="btn btn-glass">Commencer</Link>
            </div>
            <div className="pricing-card featured">
              <h3>Professionnel</h3>
              <div className="price">
                19€
                <span className="price-period">/mois</span>
              </div>
              <ul className="pricing-features">
                <li>Audio illimité</li>
                <li>Toutes les voix premium</li>
                <li>Clonage vocal personnalisé</li>
                <li>Export haute qualité</li>
                <li>API développeur</li>
                <li>Support prioritaire</li>
              </ul>
              <Link to="/app" className="btn btn-primary">Essai gratuit 7 jours</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta" id="demo">
        <h2>Prêt à transformer vos mots en voix ?</h2>
        <p>Rejoignez des milliers d'utilisateurs satisfaits et donnez vie à vos contenus.</p>
        <Link to="/app" className="btn btn-large">Démarrer maintenant →</Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>VoiceAI</h3>
            <p>La synthèse vocale nouvelle génération, propulsée par l'intelligence artificielle.</p>
          </div>
          <div className="footer-links">
            <h4>Produit</h4>
            <a href="#features" onClick={(e) => handleSmoothScroll(e, '#features')}>Fonctionnalités</a>
            <a href="#pricing" onClick={(e) => handleSmoothScroll(e, '#pricing')}>Tarifs</a>
            <Link to="/app">Application</Link>
          </div>
          <div className="footer-links">
            <h4>Entreprise</h4>
            <a href="#about">À propos</a>
            <a href="#blog">Blog</a>
            <a href="#careers">Carrières</a>
          </div>
          <div className="footer-links">
            <h4>Support</h4>
            <a href="#help">Documentation</a>
            <a href="#contact">Contact</a>
            <a href="#faq">FAQ</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 VoiceAI. Tous droits réservés. Propulsé par Kokoro v0.19</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;