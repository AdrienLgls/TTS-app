#!/usr/bin/env python3
"""
Script de test manuel pour Kokoro v0.19
Basé sur les exemples officiels du dépôt GitHub
"""

import os
import time
import soundfile as sf
from pathlib import Path

def test_basic_usage():
    """Test basique selon l'exemple du README officiel"""
    print("🔄 Test 1: Usage basique de Kokoro")
    
    try:
        from kokoro import KPipeline
        
        # Initialisation avec l'anglais américain
        print("   📥 Chargement du pipeline (lang_code='a' = American English)...")
        pipeline = KPipeline(lang_code='a')
        
        # Texte de test simple
        text = "Bonjour, ceci est un test de synthèse vocale avec Kokoro."
        print(f"   📝 Texte: '{text}'")
        
        # Génération
        print("   🎵 Génération de l'audio...")
        start_time = time.time()
        
        generator = pipeline(text, voice='af_heart')
        
        # Sauvegarde des fichiers
        audio_files = []
        for i, (gs, ps, audio) in enumerate(generator):
            filename = f'test_basic_{i}.wav'
            sf.write(filename, audio, 24000)
            audio_files.append(filename)
            print(f"      ✅ Segment {i}: {len(audio)} samples -> {filename}")
            print(f"         📝 Graphèmes: {gs}")
            print(f"         🔤 Phonèmes: {ps}")
        
        end_time = time.time()
        print(f"   ⏱️  Temps total: {end_time - start_time:.2f}s")
        print(f"   📁 {len(audio_files)} fichier(s) généré(s): {audio_files}")
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False

def test_different_voices():
    """Test avec différentes voix disponibles"""
    print("\n🔄 Test 2: Test de différentes voix")
    
    try:
        from kokoro import KPipeline
        
        pipeline = KPipeline(lang_code='a')
        text = "Testing different voices with Kokoro TTS."
        
        # Voix à tester (selon la documentation)
        voices_to_test = ['af_heart', 'af_bella', 'af_sarah']
        
        for voice in voices_to_test:
            print(f"   🎤 Test de la voix: {voice}")
            try:
                generator = pipeline(text, voice=voice)
                
                for i, (gs, ps, audio) in enumerate(generator):
                    filename = f'test_voice_{voice}_{i}.wav'
                    sf.write(filename, audio, 24000)
                    print(f"      ✅ {filename} ({len(audio)} samples)")
                    
            except Exception as e:
                print(f"      ❌ Erreur avec {voice}: {e}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur générale: {e}")
        return False

def test_performance():
    """Test de performance selon l'exemple device_examples.py"""
    print("\n🔄 Test 3: Test de performance")
    
    try:
        from kokoro import KPipeline
        
        text = "The quick brown fox jumps over the lazy dog."
        
        # Test avec différents devices
        devices_to_test = [None, 'cpu']  # On évite 'cuda' pour l'instant
        
        for device in devices_to_test:
            device_name = device or 'auto'
            print(f"   🖥️  Test avec device: {device_name}")
            
            try:
                start_time = time.perf_counter()
                pipeline = KPipeline(lang_code='a', device=device)
                
                for _, _, audio in pipeline(text, voice='af_heart'):
                    samples = audio.shape[0] if audio is not None else 0
                    break  # Prendre seulement le premier segment
                
                end_time = time.perf_counter()
                ms = (end_time - start_time) * 1000
                
                print(f"      ✅ {device_name:<6} | {ms:>5.1f}ms total | {samples:>6,d} samples")
                
            except Exception as e:
                print(f"      ❌ {device_name:<6} | {str(e)}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur générale: {e}")
        return False

def test_long_text():
    """Test avec un texte plus long"""
    print("\n🔄 Test 4: Test avec texte long")
    
    try:
        from kokoro import KPipeline
        
        pipeline = KPipeline(lang_code='a')
        
        # Texte plus long avec plusieurs phrases
        long_text = '''
        Kokoro is an open-weight TTS model with 82 million parameters. 
        Despite its lightweight architecture, it delivers comparable quality to larger models 
        while being significantly faster and more cost-efficient. 
        With Apache-licensed weights, Kokoro can be deployed anywhere 
        from production environments to personal projects.
        '''
        
        print(f"   📝 Texte ({len(long_text)} caractères)")
        print(f"      {long_text[:100]}...")
        
        start_time = time.time()
        generator = pipeline(long_text.strip(), voice='af_heart', speed=1)
        
        total_samples = 0
        for i, (gs, ps, audio) in enumerate(generator):
            filename = f'test_long_{i}.wav'
            sf.write(filename, audio, 24000)
            total_samples += len(audio)
            print(f"      ✅ Segment {i}: {len(audio)} samples -> {filename}")
        
        end_time = time.time()
        duration_seconds = total_samples / 24000
        
        print(f"   ⏱️  Temps de génération: {end_time - start_time:.2f}s")
        print(f"   🎵 Durée audio totale: {duration_seconds:.2f}s")
        print(f"   📊 Ratio temps réel: {duration_seconds / (end_time - start_time):.2f}x")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Erreur: {e}")
        return False

def test_multilingual():
    """Test des capacités multilingues"""
    print("\n🔄 Test 5: Test multilingue (si disponible)")
    
    # Tests pour différentes langues selon la documentation
    language_tests = [
        ('a', 'af_heart', "Hello, this is a test in American English."),
        ('f', 'af_heart', "Bonjour, ceci est un test en français."),  # Si disponible
    ]
    
    for lang_code, voice, text in language_tests:
        try:
            print(f"   🌍 Test langue: {lang_code} - {text[:30]}...")
            
            from kokoro import KPipeline
            pipeline = KPipeline(lang_code=lang_code)
            
            generator = pipeline(text, voice=voice)
            
            for i, (gs, ps, audio) in enumerate(generator):
                filename = f'test_lang_{lang_code}_{i}.wav'
                sf.write(filename, audio, 24000)
                print(f"      ✅ {filename} ({len(audio)} samples)")
                break  # Premier segment seulement
            
        except Exception as e:
            print(f"      ❌ Erreur pour {lang_code}: {e}")
    
    return True

def main():
    """Lance tous les tests manuels"""
    print("=" * 60)
    print("🎯 TESTS MANUELS KOKORO TTS - Basé sur les exemples officiels")
    print("=" * 60)
    
    # Créer le dossier de sortie
    output_dir = Path("test_outputs")
    output_dir.mkdir(exist_ok=True)
    os.chdir(output_dir)
    
    print(f"📁 Répertoire de travail: {os.getcwd()}")
    
    # Tests à exécuter
    tests = [
        test_basic_usage,
        test_different_voices,
        test_performance,
        test_long_text,
        test_multilingual,
    ]
    
    results = []
    for test_func in tests:
        try:
            result = test_func()
            results.append(result)
        except KeyboardInterrupt:
            print("\n⚠️  Test interrompu par l'utilisateur")
            break
        except Exception as e:
            print(f"\n❌ Erreur inattendue dans {test_func.__name__}: {e}")
            results.append(False)
    
    # Résultats finaux
    print("\n" + "=" * 60)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"✅ Tests réussis: {passed}/{total}")
    
    if passed == total:
        print("🎉 Tous les tests sont passés !")
        print("\n📋 Points à vérifier manuellement:")
        print("   1. Écoutez les fichiers .wav générés")
        print("   2. Vérifiez la qualité de la synthèse vocale")
        print("   3. Notez les temps de réponse")
        print("   4. Comparez les différentes voix")
        
        print(f"\n📁 Fichiers générés dans: {os.getcwd()}")
        
        # Lister les fichiers générés
        wav_files = list(Path('.').glob('*.wav'))
        print(f"   🎵 {len(wav_files)} fichier(s) audio créé(s):")
        for wav_file in sorted(wav_files):
            size_kb = wav_file.stat().st_size // 1024
            print(f"      - {wav_file} ({size_kb} KB)")
    else:
        print(f"⚠️  {total - passed} test(s) ont échoué")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    
    print("\n" + "=" * 60)
    if success:
        print("🚀 Prochaines étapes:")
        print("   1. Vérifiez manuellement la qualité audio")
        print("   2. Si satisfait, passez à la création de l'API FastAPI")
        print("   3. Sinon, ajustez les paramètres ou testez d'autres voix")
    else:
        print("🔧 Actions correctives:")
        print("   1. Vérifiez l'installation: pip install kokoro>=0.9.4 soundfile")
        print("   2. Installez espeak-ng si nécessaire")
        print("   3. Consultez la documentation: https://github.com/hexgrad/kokoro")
    
    print("=" * 60)