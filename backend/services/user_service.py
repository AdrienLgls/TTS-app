from datetime import datetime
from typing import Optional
from bson import ObjectId
from models.user import UserCreate, UserInDB, UserResponse, AudioGeneration
from auth.security import get_password_hash, verify_password
from database import get_users_collection, get_generations_collection

class UserService:
    """Service pour la gestion des utilisateurs"""

    @staticmethod
    async def create_user(user_data: UserCreate) -> UserInDB:
        """Créer un nouvel utilisateur"""
        users_collection = get_users_collection()

        # Vérifier si l'email existe déjà
        existing_user = await users_collection.find_one({"email": user_data.email})
        if existing_user:
            raise ValueError("Un utilisateur avec cet email existe déjà")

        # Hasher le mot de passe
        hashed_password = get_password_hash(user_data.password)

        # Créer l'utilisateur
        user_dict = {
            "email": user_data.email,
            "name": user_data.name,
            "hashed_password": hashed_password,
            "is_active": True,
            "is_premium": False,
            "premium_since": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "total_generations": 0,
            "total_audio_duration": 0.0,
            "monthly_generations": 0,
            "last_generation": None,
            "daily_generations": 0,
            "last_generation_date": None,
            "favorite_voices": [],
            "default_voice": "af_heart",
            "default_speed": 1.0
        }

        result = await users_collection.insert_one(user_dict)
        user_dict["_id"] = result.inserted_id

        return UserService._convert_user_doc(user_dict)

    @staticmethod
    async def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
        """Authentifier un utilisateur"""
        users_collection = get_users_collection()

        user_doc = await users_collection.find_one({"email": email})
        if not user_doc:
            return None

        user = UserService._convert_user_doc(user_doc)
        if not verify_password(password, user.hashed_password):
            return None

        return user

    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[UserInDB]:
        """Obtenir un utilisateur par son ID"""
        users_collection = get_users_collection()

        try:
            user_doc = await users_collection.find_one({"_id": ObjectId(user_id)})
            if not user_doc:
                return None

            return UserService._convert_user_doc(user_doc)
        except:
            return None

    @staticmethod
    async def get_user_by_email(email: str) -> Optional[UserInDB]:
        """Obtenir un utilisateur par son email"""
        users_collection = get_users_collection()

        user_doc = await users_collection.find_one({"email": email})
        if not user_doc:
            return None

        return UserService._convert_user_doc(user_doc)

    @staticmethod
    async def update_user_stats(user_id: str, audio_duration: float):
        """Mettre à jour les statistiques utilisateur après une génération"""
        users_collection = get_users_collection()

        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$inc": {
                    "total_generations": 1,
                    "total_audio_duration": audio_duration,
                    "monthly_generations": 1
                },
                "$set": {
                    "last_generation": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )

    @staticmethod
    async def add_favorite_voice(user_id: str, voice: str):
        """Ajouter une voix aux favoris"""
        users_collection = get_users_collection()

        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$addToSet": {"favorite_voices": voice},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )

    @staticmethod
    async def update_default_settings(user_id: str, default_voice: str = None, default_speed: float = None):
        """Mettre à jour les paramètres par défaut de l'utilisateur"""
        users_collection = get_users_collection()

        update_data = {"updated_at": datetime.utcnow()}
        if default_voice:
            update_data["default_voice"] = default_voice
        if default_speed:
            update_data["default_speed"] = default_speed

        await users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

    @staticmethod
    async def save_audio_generation(user_id: str, text: str, voice: str, speed: float,
                                   audio_url: str, audio_duration: float, generation_time: float) -> str:
        """Sauvegarder une génération audio"""
        generations_collection = get_generations_collection()

        generation_data = {
            "user_id": user_id,
            "text": text,
            "voice": voice,
            "speed": speed,
            "audio_url": audio_url,
            "audio_duration": audio_duration,
            "generation_time": generation_time,
            "created_at": datetime.utcnow()
        }

        result = await generations_collection.insert_one(generation_data)

        # Mettre à jour les stats utilisateur
        await UserService.update_user_stats(user_id, audio_duration)

        return str(result.inserted_id)

    @staticmethod
    async def get_user_generations(user_id: str, limit: int = 10, skip: int = 0):
        """Obtenir l'historique des générations d'un utilisateur"""
        generations_collection = get_generations_collection()

        cursor = generations_collection.find(
            {"user_id": user_id}
        ).sort("created_at", -1).skip(skip).limit(limit)

        generations = []
        async for doc in cursor:
            generation = AudioGeneration(
                id=str(doc["_id"]),
                user_id=doc["user_id"],
                text=doc["text"],
                voice=doc["voice"],
                speed=doc["speed"],
                audio_url=doc["audio_url"],
                audio_duration=doc["audio_duration"],
                generation_time=doc["generation_time"],
                created_at=doc["created_at"]
            )
            generations.append(generation)

        return generations

    @staticmethod
    def _convert_user_doc(user_doc: dict) -> UserInDB:
        """Convertir un document MongoDB en modèle UserInDB"""
        return UserInDB(
            id=str(user_doc["_id"]),
            email=user_doc["email"],
            name=user_doc["name"],
            hashed_password=user_doc["hashed_password"],
            is_active=user_doc.get("is_active", True),
            is_premium=user_doc.get("is_premium", False),
            premium_since=user_doc.get("premium_since"),
            created_at=user_doc["created_at"],
            updated_at=user_doc["updated_at"],
            total_generations=user_doc.get("total_generations", 0),
            total_audio_duration=user_doc.get("total_audio_duration", 0.0),
            monthly_generations=user_doc.get("monthly_generations", 0),
            last_generation=user_doc.get("last_generation"),
            daily_generations=user_doc.get("daily_generations", 0),
            last_generation_date=user_doc.get("last_generation_date"),
            favorite_voices=user_doc.get("favorite_voices", []),
            default_voice=user_doc.get("default_voice", "af_heart"),
            default_speed=user_doc.get("default_speed", 1.0)
        )

    @staticmethod
    def _convert_to_response(user: UserInDB) -> UserResponse:
        """Convertir UserInDB en UserResponse (sans password)"""
        return UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_active=user.is_active,
            is_premium=user.is_premium,
            created_at=user.created_at,
            total_generations=user.total_generations,
            monthly_generations=user.monthly_generations,
            daily_generations=user.daily_generations,
            favorite_voices=user.favorite_voices,
            default_voice=user.default_voice,
            default_speed=user.default_speed
        )