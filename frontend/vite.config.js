/**
 * Configuration Vite pour le projet TTS Frontend
 * 
 * Configuration optimisée pour le développement et la production :
 * - Hot Module Replacement pour développement rapide
 * - Optimisations de build pour production
 * - Configuration du serveur de développement
 * - Gestion des variables d'environnement
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite avec optimisations pour TTS
export default defineConfig({
  plugins: [react()],
  
  // Configuration du serveur de développement
  server: {
    port: 5174,           // Port fixe pour cohérence avec API
    strictPort: true,     // Échouer si le port n'est pas disponible
    host: true,           // Accessible depuis le réseau local
    cors: true,           // CORS activé pour l'API
  },
  
  // Optimisations de build pour production
  build: {
    outDir: 'dist',       // Dossier de sortie standard
    sourcemap: true,      // Source maps pour débogage production
    minify: 'terser',     // Minification optimale
    
    // Optimisations de splitting pour cache navigateur
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          http: ['axios']
        }
      }
    }
  },
  
  // Variables d'environnement publiques
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000')
  }
})
