from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ClonedVoiceCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ClonedVoiceInDB(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str]
    audio_sample_url: str
    voice_model_path: Optional[str]  # Chemin vers le modèle cloné
    status: str  # 'processing', 'ready', 'failed'
    created_at: datetime
    updated_at: datetime

class ClonedVoiceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    audio_sample_url: str
    status: str
    created_at: datetime
