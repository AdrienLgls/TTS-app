from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserBase):
    id: str
    hashed_password: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime

    # Statistiques utilisateur
    total_generations: int = 0
    total_audio_duration: float = 0.0
    monthly_generations: int = 0
    last_generation: Optional[datetime] = None

    # Configuration utilisateur
    favorite_voices: List[str] = []
    default_voice: str = "af_heart"
    default_speed: float = 1.0

class UserResponse(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    total_generations: int
    monthly_generations: int
    favorite_voices: List[str]
    default_voice: str
    default_speed: float

class AudioGeneration(BaseModel):
    id: str
    user_id: str
    text: str
    voice: str
    speed: float
    audio_url: str
    audio_duration: float
    generation_time: float
    created_at: datetime

class UserStats(BaseModel):
    total_generations: int
    total_audio_duration: float
    monthly_generations: int
    last_generation: Optional[datetime]
    favorite_voices: List[str]