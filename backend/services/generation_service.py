from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from database import get_generations_collection, get_users_collection
from models.generation import GenerationCreate, GenerationInDB, GenerationResponse

class GenerationService:
    """Service pour gérer les générations audio"""

    @staticmethod
    async def create_generation(user_id: str, generation_data: GenerationCreate) -> GenerationInDB:
        """
        Crée une nouvelle génération dans la base de données

        Args:
            user_id: ID de l'utilisateur
            generation_data: Données de la génération

        Returns:
            GenerationInDB: La génération créée
        """
        generations_collection = get_generations_collection()
        users_collection = get_users_collection()

        # Créer le document de génération
        generation_doc = {
            "user_id": user_id,
            "text": generation_data.text,
            "voice": generation_data.voice,
            "speed": generation_data.speed,
            "audio_url": generation_data.audio_url,
            "audio_duration": generation_data.audio_duration,
            "generation_time": generation_data.generation_time,
            "created_at": datetime.utcnow()
        }

        # Insérer dans la base de données
        result = await generations_collection.insert_one(generation_doc)

        # Mettre à jour les statistiques utilisateur
        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$inc": {
                    "total_generations": 1,
                    "monthly_generations": 1,
                    "total_audio_duration": generation_data.audio_duration or 0
                },
                "$set": {
                    "last_generation": datetime.utcnow()
                }
            }
        )

        # Retourner la génération créée
        generation_doc["id"] = str(result.inserted_id)
        return GenerationInDB(**generation_doc)

    @staticmethod
    async def get_user_generations(user_id: str, limit: int = 10, skip: int = 0) -> List[GenerationResponse]:
        """
        Récupère l'historique des générations d'un utilisateur

        Args:
            user_id: ID de l'utilisateur
            limit: Nombre maximum de générations à retourner
            skip: Nombre de générations à sauter

        Returns:
            List[GenerationResponse]: Liste des générations
        """
        generations_collection = get_generations_collection()

        # Récupérer les générations triées par date (plus récentes en premier)
        cursor = generations_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(skip).limit(limit)

        generations = []
        async for gen_doc in cursor:
            gen_doc["id"] = str(gen_doc["_id"])
            del gen_doc["_id"]
            del gen_doc["user_id"]
            generations.append(GenerationResponse(**gen_doc))

        return generations

    @staticmethod
    async def get_generation_by_id(generation_id: str, user_id: str) -> Optional[GenerationResponse]:
        """
        Récupère une génération spécifique

        Args:
            generation_id: ID de la génération
            user_id: ID de l'utilisateur (pour vérifier l'appartenance)

        Returns:
            Optional[GenerationResponse]: La génération ou None
        """
        generations_collection = get_generations_collection()

        gen_doc = await generations_collection.find_one({
            "_id": ObjectId(generation_id),
            "user_id": user_id
        })

        if not gen_doc:
            return None

        gen_doc["id"] = str(gen_doc["_id"])
        del gen_doc["_id"]
        del gen_doc["user_id"]

        return GenerationResponse(**gen_doc)