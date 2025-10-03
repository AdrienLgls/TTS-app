"""
Script de test pour le clonage vocal avec Coqui TTS XTTS-v2

IMPORTANT: Ce script nécessite Python 3.11 ou inférieur
Installation requise: pip install TTS

Usage:
    python test_voice_cloning.py
"""

import os
import sys

# Vérifier la version Python
if sys.version_info >= (3, 12):
    print("❌ ERREUR: Python 3.12+ détecté")
    print("📌 Coqui TTS nécessite Python 3.9-3.11")
    print("\n💡 Solutions:")
    print("1. Installer Python 3.11: https://www.python.org/downloads/")
    print("2. Créer un environnement virtuel avec Python 3.11:")
    print("   py -3.11 -m venv venv_tts")
    print("   .\\venv_tts\\Scripts\\activate")
    print("   pip install TTS torch torchaudio")
    sys.exit(1)

try:
    from TTS.api import TTS
    print("✅ TTS importé avec succès")
except ImportError:
    print("❌ TTS non installé")
    print("📌 Installer avec: pip install TTS")
    sys.exit(1)

def test_voice_cloning():
    """
    Test du clonage vocal avec XTTS-v2
    """
    print("\n🎤 Test de clonage vocal XTTS-v2")
    print("=" * 50)

    # Initialiser le modèle XTTS-v2
    print("\n📥 Chargement du modèle XTTS-v2...")
    try:
        tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=False)
        print("✅ Modèle chargé avec succès")
    except Exception as e:
        print(f"❌ Erreur chargement modèle: {e}")
        return

    # Texte de test
    text = "Hello, this is a test of voice cloning using XTTS version two."

    # Fichier de sortie
    output_path = "test_cloned_output.wav"

    # NOTE: Pour tester avec un échantillon réel, remplacer par le chemin
    # d'un fichier audio de 6+ secondes
    sample_wav = "path/to/sample.wav"

    print(f"\n📝 Texte: {text}")
    print(f"🎵 Échantillon: {sample_wav}")
    print(f"💾 Sortie: {output_path}")

    if not os.path.exists(sample_wav):
        print(f"\n⚠️  Fichier échantillon non trouvé: {sample_wav}")
        print("📌 Pour tester le clonage:")
        print("   1. Placer un fichier audio WAV de 6+ secondes")
        print("   2. Modifier 'sample_wav' dans ce script")
        print("   3. Relancer le test")
        return

    # Générer l'audio avec la voix clonée
    print("\n🔄 Génération en cours...")
    try:
        tts.tts_to_file(
            text=text,
            file_path=output_path,
            speaker_wav=sample_wav,
            language="en"
        )
        print(f"✅ Audio généré: {output_path}")
    except Exception as e:
        print(f"❌ Erreur génération: {e}")
        return

def list_available_models():
    """
    Liste tous les modèles TTS disponibles
    """
    print("\n📋 Modèles TTS disponibles:")
    print("=" * 50)

    try:
        models = TTS().list_models()
        for i, model in enumerate(models, 1):
            if "xtts" in model.lower():
                print(f"  {i}. ⭐ {model}")
            else:
                print(f"  {i}. {model}")
    except Exception as e:
        print(f"❌ Erreur: {e}")

if __name__ == "__main__":
    print("\n" + "=" * 50)
    print("🎭 TEST CLONAGE VOCAL - COQUI TTS XTTS-v2")
    print("=" * 50)

    # Lister les modèles disponibles
    list_available_models()

    # Tester le clonage
    print("\n")
    test_voice_cloning()

    print("\n" + "=" * 50)
    print("✨ Test terminé")
    print("=" * 50)
