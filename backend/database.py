import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Configuration MongoDB
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = "voiceai_db"

# Client MongoDB pour les opérations asynchrones
client = None
database = None

def connect_to_mongo():
    """Se connecter à MongoDB"""
    global client, database
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        database = client[DATABASE_NAME]
        print(f"✅ Connexion à MongoDB réussie: {DATABASE_NAME}")
        return True
    except Exception as e:
        print(f"❌ Erreur de connexion MongoDB: {e}")
        return False

def close_mongo_connection():
    """Fermer la connexion MongoDB"""
    global client
    if client:
        client.close()
        print("🔌 Connexion MongoDB fermée")

def get_database():
    """Obtenir la base de données"""
    return database

# Collections
def get_users_collection():
    """Obtenir la collection des utilisateurs"""
    return database.users

def get_generations_collection():
    """Obtenir la collection des générations audio"""
    return database.audio_generations

async def init_db():
    """Initialiser la base de données avec les index nécessaires"""
    try:
        users_collection = get_users_collection()
        generations_collection = get_generations_collection()

        # Index pour les utilisateurs
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("created_at")

        # Index pour les générations
        await generations_collection.create_index("user_id")
        await generations_collection.create_index("created_at")
        await generations_collection.create_index([("user_id", 1), ("created_at", -1)])

        print("✅ Index de base de données créés")
    except Exception as e:
        print(f"❌ Erreur lors de la création des index: {e}")

# Test de connexion
def test_connection():
    """Tester la connexion à MongoDB"""
    try:
        sync_client = MongoClient(MONGODB_URL)
        sync_client.admin.command('ping')
        sync_client.close()
        print("✅ Test de connexion MongoDB réussi")
        return True
    except Exception as e:
        print(f"❌ Test de connexion MongoDB échoué: {e}")
        return False