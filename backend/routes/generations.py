from fastapi import APIRouter, HTTPException, status, Depends, Request
from models.generation import GenerationCreate, GenerationResponse
from services.generation_service import GenerationService
from auth.security import verify_current_user

router = APIRouter(prefix="/generations", tags=["generations"])

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