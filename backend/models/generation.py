from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class GenerationCreate(BaseModel):
    """Modèle pour créer une nouvelle génération"""
    text: str
    voice: str
    speed: float
    audio_url: Optional[str] = None
    audio_duration: Optional[float] = None
    generation_time: Optional[float] = None

class GenerationInDB(BaseModel):
    """Modèle de génération en base de données"""
    id: str
    user_id: str
    text: str
    voice: str
    speed: float
    audio_url: Optional[str]
    audio_duration: Optional[float]
    generation_time: Optional[float]
    created_at: datetime

class GenerationResponse(BaseModel):
    """Modèle de réponse pour une génération"""
    id: str
    text: str
    voice: str
    speed: float
    audio_url: Optional[str]
    audio_duration: Optional[float]
    generation_time: Optional[float]
    created_at: datetime