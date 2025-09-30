from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from fastapi.responses import JSONResponse
from models.user import UserCreate, UserLogin, UserResponse
from services.user_service import UserService
from auth.security import create_access_token, verify_current_user, create_secure_cookie_config

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=dict)
async def register(user_data: UserCreate, response: Response):
    """Inscription d'un nouvel utilisateur"""
    try:
        # Créer l'utilisateur
        user = await UserService.create_user(user_data)

        # Créer le token JWT
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email}
        )

        # Configurer le cookie sécurisé
        cookie_config = create_secure_cookie_config()
        response.set_cookie(
            key="access_token",
            value=access_token,
            **cookie_config
        )

        # Retourner les données utilisateur (sans mot de passe)
        user_response = UserService._convert_to_response(user)

        return {
            "success": True,
            "message": "Compte créé avec succès",
            "user": user_response.dict()
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la création du compte"
        )

@router.post("/login", response_model=dict)
async def login(user_data: UserLogin, response: Response):
    """Connexion d'un utilisateur"""
    try:
        # Authentifier l'utilisateur
        user = await UserService.authenticate_user(user_data.email, user_data.password)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Compte désactivé"
            )

        # Créer le token JWT
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email}
        )

        # Configurer le cookie sécurisé
        cookie_config = create_secure_cookie_config()
        response.set_cookie(
            key="access_token",
            value=access_token,
            **cookie_config
        )

        # Retourner les données utilisateur
        user_response = UserService._convert_to_response(user)

        return {
            "success": True,
            "message": "Connexion réussie",
            "user": user_response.dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la connexion"
        )

@router.post("/logout")
async def logout(response: Response):
    """Déconnexion d'un utilisateur"""
    try:
        # Supprimer le cookie
        response.delete_cookie(
            key="access_token",
            httponly=True,
            samesite="lax"
        )

        return {
            "success": True,
            "message": "Déconnexion réussie"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la déconnexion"
        )

@router.get("/me", response_model=dict)
async def get_current_user_info(request: Request, current_user: dict = Depends(verify_current_user)):
    """Obtenir les informations de l'utilisateur connecté"""
    try:
        user = await UserService.get_user_by_id(current_user["user_id"])

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Utilisateur non trouvé"
            )

        user_response = UserService._convert_to_response(user)

        return {
            "success": True,
            "user": user_response.dict()
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération des informations utilisateur"
        )

@router.get("/history")
async def get_user_history(
    request: Request,
    limit: int = 10,
    skip: int = 0,
    current_user: dict = Depends(verify_current_user)
):
    """Obtenir l'historique des générations de l'utilisateur"""
    try:
        generations = await UserService.get_user_generations(
            current_user["user_id"],
            limit=limit,
            skip=skip
        )

        return {
            "success": True,
            "generations": [gen.dict() for gen in generations],
            "total": len(generations)
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la récupération de l'historique"
        )

@router.put("/settings")
async def update_user_settings(
    request: Request,
    default_voice: str = None,
    default_speed: float = None,
    current_user: dict = Depends(verify_current_user)
):
    """Mettre à jour les paramètres utilisateur"""
    try:
        await UserService.update_default_settings(
            current_user["user_id"],
            default_voice=default_voice,
            default_speed=default_speed
        )

        return {
            "success": True,
            "message": "Paramètres mis à jour"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de la mise à jour des paramètres"
        )

@router.post("/favorite-voice")
async def add_favorite_voice(
    request: Request,
    voice: str,
    current_user: dict = Depends(verify_current_user)
):
    """Ajouter une voix aux favoris"""
    try:
        await UserService.add_favorite_voice(current_user["user_id"], voice)

        return {
            "success": True,
            "message": "Voix ajoutée aux favoris"
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur lors de l'ajout aux favoris"
        )