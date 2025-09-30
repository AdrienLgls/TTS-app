import os
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Import des modules locaux
from database import connect_to_mongo, close_mongo_connection, init_db, test_connection
from routes.auth import router as auth_router
from routes.generations import router as generations_router
from auth.security import verify_current_user

# Charger les variables d'environnement
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire de cycle de vie de l'application"""
    # Startup
    print("🚀 Démarrage du serveur VoiceAI Backend...")

    # Test de connexion MongoDB
    if not test_connection():
        print("❌ Impossible de se connecter à MongoDB")
        raise Exception("Échec de connexion à MongoDB")

    # Connexion à MongoDB
    if not connect_to_mongo():
        print("❌ Échec de connexion à MongoDB")
        raise Exception("Échec de connexion à MongoDB")

    # Initialiser la base de données
    await init_db()

    print("✅ Serveur VoiceAI Backend démarré avec succès!")

    yield

    # Shutdown
    print("🛑 Arrêt du serveur...")
    close_mongo_connection()
    print("✅ Serveur arrêté proprement")

# Créer l'application FastAPI
app = FastAPI(
    title="VoiceAI Backend",
    description="API Backend pour l'application de synthèse vocale VoiceAI",
    version="1.0.0",
    lifespan=lifespan
)

# Configuration CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes d'authentification
app.include_router(auth_router, prefix="/api")

# Routes des générations
app.include_router(generations_router, prefix="/api")

# Route de test
@app.get("/")
async def root():
    """Route racine pour tester l'API"""
    return {
        "message": "VoiceAI Backend API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Vérification de santé de l'API"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z"
    }

# Route protégée pour tester l'authentification
@app.get("/protected")
async def protected_route(current_user: dict = Depends(verify_current_user)):
    """Route protégée pour tester l'authentification"""
    return {
        "message": "Accès autorisé",
        "user_id": current_user["user_id"],
        "email": current_user["email"]
    }

# Routes TTS (intégration avec kokoro-api)
@app.post("/tts")
async def generate_tts(
    request: Request,
    current_user: dict = Depends(verify_current_user)
):
    """
    Génération TTS protégée par authentification
    Cette route sera intégrée avec votre API Kokoro existante
    """
    try:
        # Ici vous pouvez intégrer votre logique TTS existante
        # et sauvegarder la génération dans l'historique utilisateur

        # Pour l'instant, on retourne une réponse de test
        return {
            "success": True,
            "message": "TTS généré avec succès",
            "user_id": current_user["user_id"],
            "audio_url": "/audio/test.wav",
            "audio_duration": 5.2,
            "generation_time": 1.8,
            "segments_count": 3
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/voices")
async def get_voices():
    """Obtenir la liste des voix disponibles"""
    # Retourner les voix disponibles (peut être étendu plus tard)
    voices = [
        {
            "id": "af_heart",
            "name": "Heart",
            "description": "Voix féminine chaleureuse et expressive",
            "language": "en-US",
            "gender": "female",
            "recommended": True
        },
        {
            "id": "af_bella",
            "name": "Bella",
            "description": "Voix féminine claire et articulée",
            "language": "en-US",
            "gender": "female",
            "recommended": False
        },
        {
            "id": "af_sarah",
            "name": "Sarah",
            "description": "Voix féminine douce et naturelle",
            "language": "en-US",
            "gender": "female",
            "recommended": False
        }
    ]

    return voices

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 3000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )