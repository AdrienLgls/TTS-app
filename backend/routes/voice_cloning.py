import os
import shutil
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from datetime import datetime
from bson import ObjectId
from typing import Optional
import asyncio
from concurrent.futures import ThreadPoolExecutor

from auth.security import verify_current_user
from database import get_database
from models.cloned_voice import ClonedVoiceCreate, ClonedVoiceResponse

# Importer TTS uniquement si disponible (Python 3.11 requis)
TTS_AVAILABLE = False
try:
    from TTS.api import TTS
    TTS_AVAILABLE = True
    print("✅ TTS disponible - Clonage vocal activé")
except ImportError:
    print("⚠️  TTS non disponible - Mode échantillon uniquement")
    print("   Installer avec Python 3.11: pip install TTS")

router = APIRouter(prefix="/voice-cloning", tags=["voice-cloning"])

# Dossiers pour stocker les fichiers
UPLOAD_DIR = "uploaded_voices"
MODELS_DIR = "cloned_models"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# Pool de threads pour l'exécution asynchrone du clonage
executor = ThreadPoolExecutor(max_workers=2)

# Instance TTS globale (chargée une seule fois)
_tts_instance = None

def get_tts_instance():
    """
    Obtenir l'instance TTS (singleton pattern)
    """
    global _tts_instance
    if not TTS_AVAILABLE:
        return None

    if _tts_instance is None:
        print("🔄 Chargement du modèle XTTS-v2...")

        # Désactiver weights_only pour PyTorch 2.4+
        import torch
        original_load = torch.load
        def patched_load(*args, **kwargs):
            kwargs['weights_only'] = False
            return original_load(*args, **kwargs)
        torch.load = patched_load

        try:
            _tts_instance = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
            print("✅ Modèle XTTS-v2 chargé")
        finally:
            torch.load = original_load

    return _tts_instance

def get_cloned_voices_collection():
    """Obtenir la collection des voix clonées"""
    db = get_database()
    return db.cloned_voices

async def process_voice_cloning(voice_id: str, audio_path: str, voice_name: str):
    """
    Traiter le clonage vocal en arrière-plan

    Pour XTTS-v2, le "clonage" consiste simplement à vérifier que l'échantillon
    est valide. Le vrai clonage se fait à la génération en utilisant speaker_wav.
    """
    try:
        cloned_voices_collection = get_cloned_voices_collection()

        print(f"🎤 Début du clonage vocal: {voice_name}")

        # Vérifier que le fichier existe
        if not os.path.exists(audio_path):
            raise Exception(f"Fichier audio introuvable: {audio_path}")

        # XTTS-v2 utilise directement le WAV comme référence
        # Pas besoin de créer un modèle séparé
        # On marque simplement comme "ready"

        await cloned_voices_collection.update_one(
            {"_id": ObjectId(voice_id)},
            {
                "$set": {
                    "status": "ready",
                    "updated_at": datetime.utcnow()
                }
            }
        )

        print(f"✅ Clonage terminé: {voice_name}")

    except Exception as e:
        print(f"❌ Erreur clonage vocal {voice_name}: {e}")

        # Marquer comme échoué
        cloned_voices_collection = get_cloned_voices_collection()
        await cloned_voices_collection.update_one(
            {"_id": ObjectId(voice_id)},
            {
                "$set": {
                    "status": "failed",
                    "updated_at": datetime.utcnow()
                }
            }
        )

@router.post("/upload", response_model=dict)
async def upload_voice_sample(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    audio_file: UploadFile = File(...),
    current_user: dict = Depends(verify_current_user)
):
    """
    Uploader un échantillon vocal pour clonage (Premium uniquement)
    """
    try:
        # Vérifier que l'utilisateur est Premium
        from database import get_users_collection
        users_collection = get_users_collection()
        user_doc = await users_collection.find_one({"_id": ObjectId(current_user["user_id"])})

        if not user_doc or not user_doc.get("is_premium", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Le clonage vocal est réservé aux membres Premium"
            )

        # Vérifier le format du fichier
        if not audio_file.content_type.startswith("audio/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Le fichier doit être un fichier audio"
            )

        # Générer un nom de fichier unique
        file_extension = audio_file.filename.split(".")[-1]
        unique_filename = f"{current_user['user_id']}_{datetime.now().timestamp()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        # Sauvegarder le fichier
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        # Créer l'entrée dans la base de données
        cloned_voices_collection = get_cloned_voices_collection()

        # Créer l'entrée dans la base de données
        voice_doc = {
            "user_id": current_user["user_id"],
            "name": name,
            "description": description,
            "audio_sample_url": f"/uploaded_voices/{unique_filename}",
            "voice_model_path": file_path,  # Chemin vers l'échantillon audio
            "status": "processing" if TTS_AVAILABLE else "ready",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }

        result = await cloned_voices_collection.insert_one(voice_doc)
        voice_id = str(result.inserted_id)

        # Si TTS disponible, lancer le processus de clonage en arrière-plan
        if TTS_AVAILABLE:
            asyncio.create_task(
                process_voice_cloning(voice_id, file_path, name)
            )
            message = "Clonage vocal en cours... Cela peut prendre quelques minutes."
        else:
            message = "Échantillon vocal uploadé. Clonage non disponible (TTS requis)."

        return {
            "success": True,
            "message": message,
            "voice": {
                "id": voice_id,
                "name": name,
                "description": description,
                "audio_sample_url": voice_doc["audio_sample_url"],
                "status": voice_doc["status"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur lors de l'upload de l'échantillon vocal: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'upload de l'échantillon vocal"
        )

@router.get("/my-voices", response_model=dict)
async def get_my_cloned_voices(
    current_user: dict = Depends(verify_current_user)
):
    """
    Récupérer les voix clonées de l'utilisateur
    """
    try:
        cloned_voices_collection = get_cloned_voices_collection()

        cursor = cloned_voices_collection.find(
            {"user_id": current_user["user_id"]}
        ).sort("created_at", -1)

        voices = []
        async for voice_doc in cursor:
            voices.append({
                "id": str(voice_doc["_id"]),
                "name": voice_doc["name"],
                "description": voice_doc.get("description"),
                "audio_sample_url": voice_doc["audio_sample_url"],
                "status": voice_doc["status"],
                "created_at": voice_doc["created_at"].isoformat()
            })

        return {
            "success": True,
            "voices": voices
        }

    except Exception as e:
        print(f"Erreur lors de la récupération des voix clonées: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des voix clonées"
        )

@router.delete("/{voice_id}", response_model=dict)
async def delete_cloned_voice(
    voice_id: str,
    current_user: dict = Depends(verify_current_user)
):
    """
    Supprimer une voix clonée
    """
    try:
        cloned_voices_collection = get_cloned_voices_collection()

        # Vérifier que la voix appartient à l'utilisateur
        voice_doc = await cloned_voices_collection.find_one({
            "_id": ObjectId(voice_id),
            "user_id": current_user["user_id"]
        })

        if not voice_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Voix clonée non trouvée"
            )

        # Supprimer le fichier audio
        if voice_doc.get("audio_sample_url"):
            file_path = voice_doc["audio_sample_url"].replace("/", os.sep).lstrip(os.sep)
            if os.path.exists(file_path):
                os.remove(file_path)

        # Supprimer de la base de données
        await cloned_voices_collection.delete_one({"_id": ObjectId(voice_id)})

        return {
            "success": True,
            "message": "Voix clonée supprimée avec succès"
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur lors de la suppression de la voix clonée: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la suppression"
        )

@router.post("/generate/{voice_id}", response_model=dict)
async def generate_with_cloned_voice(
    voice_id: str,
    text: str = Form(...),
    language: str = Form("en"),
    current_user: dict = Depends(verify_current_user)
):
    """
    Générer de l'audio avec une voix clonée (Premium uniquement)

    Utilise XTTS-v2 pour cloner la voix à partir de l'échantillon audio.
    """
    try:
        # Vérifier que TTS est disponible
        if not TTS_AVAILABLE:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service de clonage non disponible. TTS requis (Python 3.11)."
            )

        # Vérifier que l'utilisateur est Premium
        from database import get_users_collection
        users_collection = get_users_collection()
        user_doc = await users_collection.find_one({"_id": ObjectId(current_user["user_id"])})

        if not user_doc or not user_doc.get("is_premium", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La génération avec voix clonée est réservée aux membres Premium"
            )

        # Récupérer la voix clonée
        cloned_voices_collection = get_cloned_voices_collection()
        voice_doc = await cloned_voices_collection.find_one({
            "_id": ObjectId(voice_id),
            "user_id": current_user["user_id"]
        })

        if not voice_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Voix clonée non trouvée"
            )

        if voice_doc["status"] != "ready":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Voix non prête (statut: {voice_doc['status']})"
            )

        # Générer un nom de fichier unique pour la sortie
        output_filename = f"cloned_{current_user['user_id']}_{datetime.now().timestamp()}.wav"
        output_path = os.path.join(MODELS_DIR, output_filename)

        # Générer l'audio avec la voix clonée
        print(f"🎤 Génération avec voix clonée: {voice_doc['name']}")
        print(f"📝 Texte: {text[:50]}...")

        def generate_audio():
            """Fonction synchrone pour la génération"""
            tts = get_tts_instance()
            speaker_wav = voice_doc["voice_model_path"]

            tts.tts_to_file(
                text=text,
                file_path=output_path,
                speaker_wav=speaker_wav,
                language=language
            )

        # Exécuter la génération dans un thread séparé
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(executor, generate_audio)

        print(f"✅ Audio généré: {output_path}")

        # Retourner l'URL du fichier audio
        audio_url = f"/cloned_models/{output_filename}"

        return {
            "success": True,
            "message": "Audio généré avec succès",
            "audio_url": audio_url,
            "voice_name": voice_doc["name"]
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur génération voix clonée: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération: {str(e)}"
        )
