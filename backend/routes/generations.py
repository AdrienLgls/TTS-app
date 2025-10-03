from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import Optional
from models.generation import GenerationCreate, GenerationResponse
from services.generation_service import GenerationService
from services.limits_service import LimitsService
from auth.security import verify_current_user, get_current_user_optional

router = APIRouter(prefix="/generations", tags=["generations"])

@router.get("/limits", response_model=dict)
async def get_limits(
    request: Request,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Récupérer les limites de l'utilisateur"""
    try:
        user_id = current_user["user_id"] if current_user else None
        limits = await LimitsService.get_user_limits(user_id)

        return {
            "success": True,
            "limits": limits
        }

    except Exception as e:
        print(f"Erreur lors de la récupération des limites: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des limites"
        )

@router.post("/check-limits", response_model=dict)
async def check_limits(
    request: Request,
    text_length: int,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Vérifier si l'utilisateur peut générer un audio"""
    try:
        user_id = current_user["user_id"] if current_user else None
        limits = await LimitsService.check_generation_limits(user_id, text_length)

        return {
            "success": True,
            **limits
        }

    except Exception as e:
        print(f"Erreur lors de la vérification des limites: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la vérification des limites"
        )

@router.post("/", response_model=dict)
async def create_generation(
    generation_data: GenerationCreate,
    request: Request,
    current_user: dict = Depends(verify_current_user)
):
    """Créer une nouvelle génération dans l'historique"""
    try:
        generation = await GenerationService.create_generation(
            user_id=current_user["user_id"],
            generation_data=generation_data
        )

        return {
            "success": True,
            "message": "Génération sauvegardée",
            "generation_id": generation.id
        }

    except Exception as e:
        print(f"Erreur lors de la sauvegarde de la génération: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la sauvegarde de la génération"
        )

@router.get("/", response_model=dict)
async def get_generations(
    request: Request,
    limit: int = 10,
    skip: int = 0,
    current_user: dict = Depends(verify_current_user)
):
    """Récupérer l'historique des générations de l'utilisateur"""
    try:
        generations = await GenerationService.get_user_generations(
            user_id=current_user["user_id"],
            limit=limit,
            skip=skip
        )

        return {
            "success": True,
            "generations": [gen.dict() for gen in generations],
            "total": len(generations)
        }

    except Exception as e:
        print(f"Erreur lors de la récupération des générations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération de l'historique"
        )

@router.get("/{generation_id}", response_model=dict)
async def get_generation(
    generation_id: str,
    request: Request,
    current_user: dict = Depends(verify_current_user)
):
    """Récupérer une génération spécifique"""
    try:
        generation = await GenerationService.get_generation_by_id(
            generation_id=generation_id,
            user_id=current_user["user_id"]
        )

        if not generation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Génération non trouvée"
            )

        return {
            "success": True,
            "generation": generation.dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur lors de la récupération de la génération: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération de la génération"
        )