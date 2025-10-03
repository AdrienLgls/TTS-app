from datetime import datetime
from typing import Dict, Optional
from bson import ObjectId
from database import get_users_collection

class LimitsService:
    """Service pour gérer les limites de génération"""

    # Limites de caractères
    CHAR_LIMIT_NOT_LOGGED = 300
    CHAR_LIMIT_FREE = 2000
    CHAR_LIMIT_PREMIUM = 100000

    # Limites de génération quotidienne
    DAILY_LIMIT_NOT_LOGGED = 1
    DAILY_LIMIT_FREE = 10
    DAILY_LIMIT_PREMIUM = None  # Illimité

    @staticmethod
    async def check_generation_limits(user_id: Optional[str], text_length: int, session_id: Optional[str] = None) -> Dict:
        """
        Vérifie si l'utilisateur peut générer un audio

        Args:
            user_id: ID de l'utilisateur (None si non connecté)
            text_length: Longueur du texte à générer
            session_id: ID de session pour les utilisateurs non connectés

        Returns:
            Dict avec:
                - allowed: bool - Si la génération est autorisée
                - reason: str - Raison du refus si not allowed
                - remaining: int - Nombre de générations restantes
                - char_limit: int - Limite de caractères
        """

        # Utilisateur non connecté
        if not user_id:
            return {
                "allowed": text_length <= LimitsService.CHAR_LIMIT_NOT_LOGGED,
                "reason": f"Limite de {LimitsService.CHAR_LIMIT_NOT_LOGGED} caractères pour les utilisateurs non connectés" if text_length > LimitsService.CHAR_LIMIT_NOT_LOGGED else None,
                "remaining": LimitsService.DAILY_LIMIT_NOT_LOGGED,
                "char_limit": LimitsService.CHAR_LIMIT_NOT_LOGGED,
                "daily_limit": LimitsService.DAILY_LIMIT_NOT_LOGGED,
                "is_premium": False
            }

        # Utilisateur connecté - récupérer ses infos
        users_collection = get_users_collection()
        user = await users_collection.find_one({"_id": ObjectId(user_id)})

        if not user:
            return {
                "allowed": False,
                "reason": "Utilisateur non trouvé",
                "remaining": 0,
                "char_limit": 0,
                "daily_limit": 0,
                "is_premium": False
            }

        is_premium = user.get("is_premium", False)
        daily_generations = user.get("daily_generations", 0)
        last_generation_date = user.get("last_generation_date")

        # Réinitialiser le compteur si on est un nouveau jour
        now = datetime.utcnow()
        if last_generation_date and last_generation_date.date() < now.date():
            daily_generations = 0

        # Utilisateur Premium
        if is_premium:
            return {
                "allowed": text_length <= LimitsService.CHAR_LIMIT_PREMIUM,
                "reason": f"Limite de {LimitsService.CHAR_LIMIT_PREMIUM} caractères" if text_length > LimitsService.CHAR_LIMIT_PREMIUM else None,
                "remaining": None,  # Illimité
                "char_limit": LimitsService.CHAR_LIMIT_PREMIUM,
                "daily_limit": None,  # Illimité
                "is_premium": True
            }

        # Utilisateur gratuit connecté
        char_limit = LimitsService.CHAR_LIMIT_FREE
        daily_limit = LimitsService.DAILY_LIMIT_FREE
        remaining = daily_limit - daily_generations

        # Vérifier les limites
        if text_length > char_limit:
            return {
                "allowed": False,
                "reason": f"Limite de {char_limit} caractères pour les utilisateurs gratuits. Passez Premium pour 100 000 caractères.",
                "remaining": remaining,
                "char_limit": char_limit,
                "daily_limit": daily_limit,
                "is_premium": False
            }

        if daily_generations >= daily_limit:
            return {
                "allowed": False,
                "reason": f"Limite quotidienne atteinte ({daily_limit} générations par jour). Revenez demain ou passez Premium pour un accès illimité.",
                "remaining": 0,
                "char_limit": char_limit,
                "daily_limit": daily_limit,
                "is_premium": False
            }

        return {
            "allowed": True,
            "reason": None,
            "remaining": remaining,
            "char_limit": char_limit,
            "daily_limit": daily_limit,
            "is_premium": False
        }

    @staticmethod
    async def get_user_limits(user_id: Optional[str]) -> Dict:
        """
        Récupère les limites actuelles de l'utilisateur

        Args:
            user_id: ID de l'utilisateur (None si non connecté)

        Returns:
            Dict avec les limites et usage actuel
        """

        # Utilisateur non connecté
        if not user_id:
            return {
                "char_limit": LimitsService.CHAR_LIMIT_NOT_LOGGED,
                "daily_limit": LimitsService.DAILY_LIMIT_NOT_LOGGED,
                "daily_used": 0,
                "daily_remaining": LimitsService.DAILY_LIMIT_NOT_LOGGED,
                "is_premium": False
            }

        # Utilisateur connecté
        users_collection = get_users_collection()
        user = await users_collection.find_one({"_id": ObjectId(user_id)})

        if not user:
            return {
                "char_limit": 0,
                "daily_limit": 0,
                "daily_used": 0,
                "daily_remaining": 0,
                "is_premium": False
            }

        is_premium = user.get("is_premium", False)
        daily_generations = user.get("daily_generations", 0)
        last_generation_date = user.get("last_generation_date")

        # Réinitialiser le compteur si on est un nouveau jour
        now = datetime.utcnow()
        if last_generation_date and last_generation_date.date() < now.date():
            daily_generations = 0

        # Utilisateur Premium
        if is_premium:
            return {
                "char_limit": LimitsService.CHAR_LIMIT_PREMIUM,
                "daily_limit": None,  # Illimité
                "daily_used": daily_generations,
                "daily_remaining": None,  # Illimité
                "is_premium": True
            }

        # Utilisateur gratuit
        daily_limit = LimitsService.DAILY_LIMIT_FREE
        return {
            "char_limit": LimitsService.CHAR_LIMIT_FREE,
            "daily_limit": daily_limit,
            "daily_used": daily_generations,
            "daily_remaining": daily_limit - daily_generations,
            "is_premium": False
        }
