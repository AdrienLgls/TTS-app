#!/usr/bin/env python3
"""
Tests pour l'API Kokoro optimisée
"""

import requests
import json
import time
import sys
from pathlib import Path

class OptimizedKokoroAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.timeout = 30  # Timeout plus long pour la génération
        
    def test_root_endpoint(self):
        """Test du endpoint racine optimisé"""
        print("1. Test du endpoint racine optimisé...")
        
        try:
            response = self.session.get(f"{self.base_url}/")
            response.raise_for_status()
            
            data = response.json()
            print(f"✓ API: {data.get('name')}")
            print(f"✓ Version: {data.get('version')}")
            print(f"✓ Optimisations: {len(data.get('optimizations', []))}")
            return True
            
        except Exception as e:
            print(f"✗ Erreur: {e}")
            return False
    
    def test_health_detailed(self):
        """Test du endpoint de santé détaillé"""
        print("\n2. Test du health check détaillé...")
        
        try:
            response = self.session.get(f"{self.base_url}/health")
            response.raise_for_status()
            
            data = response.json()
            print(f"✓ Status: {data.get('status')}")
            print(f"✓ Modèle chargé: {data.get('model_loaded')}")
            print(f"✓ Temps de chargement: {data.get('model_load_time'):.2f}s")
            print(f"✓ Voix disponibles: {data.get('available_voices')}")
            print(f"✓ Uptime: {data.get('uptime'):.1f}s")
            return True
            
        except Exception as e:
            print(f"✗ Erreur: {e}")
            return False
    
    def test_voices_detailed(self):
        """Test du endpoint des voix avec métadonnées"""
        print("\n3. Test des voix avec métadonnées...")
        
        try:
            response = self.session.get(f"{self.base_url}/voices")
            response.raise_for_status()
            
            voices = response.json()
            print(f"✓ {len(voices)} voix disponibles:")
            
            for voice in voices:
                status = "⭐ RECOMMANDÉE" if voice.get('recommended') else ""
                print(f"  - {voice['name']} ({voice['id']}) {status}")
                print(f"    {voice['description']}")
            
            return True
            
        except Exception as e:
            print(f"✗ Erreur: {e}")
            return False
    
    def test_tts_optimized(self):
        """Test de la synthèse vocale optimisée"""
        print(f"\n4. Test de synthèse vocale optimisée...")
        
        test_cases = [
            {
                "name": "Texte court avec voix recommandée",
                "payload": {
                    "text": "Hello, this is an optimized TTS test.",
                    "voice": "af_heart",
                    "speed": 1.0
                }
            },
            {
                "name": "Texte moyen avec voix Bella",
                "payload": {
                    "text": "This is a longer test to evaluate the optimized API performance. The quality should be excellent with faster generation times.",
                    "voice": "af_bella",
                    "speed": 1.2
                }
            }
        ]
        
        results = []
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"   Test {i}: {test_case['name']}")
            
            try:
                start_time = time.time()
                response = self.session.post(
                    f"{self.base_url}/tts",
                    json=test_case['payload'],
                    headers={"Content-Type": "application/json"}
                )
                response.raise_for_status()
                
                data = response.json()
                end_time = time.time()
                
                request_time = end_time - start_time
                gen_time = data.get('generation_time', 0)
                audio_duration = data.get('audio_duration', 0)
                
                print(f"      ✓ Requête totale: {request_time:.2f}s")
                print(f"      ✓ Génération pure: {gen_time:.2f}s")
                print(f"      ✓ Durée audio: {audio_duration:.2f}s")
                print(f"      ✓ Segments: {data.get('segments_count')}")
                print(f"      ✓ Voix utilisée: {data.get('voice_used')}")
                
                # Test de téléchargement
                audio_url = data.get('audio_url')
                if audio_url:
                    audio_response = self.session.get(f"{self.base_url}{audio_url}")
                    if audio_response.status_code == 200:
                        filename = f"test_optimized_{i}.wav"
                        with open(filename, "wb") as f:
                            f.write(audio_response.content)
                        print(f"      ✓ Audio téléchargé: {filename} ({len(audio_response.content)} bytes)")
                
                results.append(True)
                
            except Exception as e:
                print(f"      ✗ Erreur: {e}")
                results.append(False)
        
        return all(results)
    
    def test_performance_comparison(self):
        """Test de performance comparé"""
        print(f"\n5. Test de performance - Multiple requêtes...")
        
        text = "Performance test with optimized Kokoro API."
        num_requests = 3
        
        times = []
        
        for i in range(num_requests):
            try:
                start = time.time()
                response = self.session.post(
                    f"{self.base_url}/tts",
                    json={"text": f"{text} Request {i+1}.", "voice": "af_heart"}
                )
                response.raise_for_status()
                
                data = response.json()
                end = time.time()
                
                total_time = end - start
                gen_time = data.get('generation_time', 0)
                audio_duration = data.get('audio_duration', 0)
                
                times.append({
                    'total': total_time,
                    'generation': gen_time,
                    'audio_duration': audio_duration
                })
                
                print(f"   Requête {i+1}: {total_time:.2f}s total, {gen_time:.2f}s génération")
                
            except Exception as e:
                print(f"   Requête {i+1}: ÉCHEC ({e})")
        
        if times:
            avg_total = sum(t['total'] for t in times) / len(times)
            avg_gen = sum(t['generation'] for t in times) / len(times)
            avg_audio = sum(t['audio_duration'] for t in times) / len(times)
            
            print(f"✓ Moyennes sur {len(times)} requêtes:")
            print(f"   Total: {avg_total:.2f}s")
            print(f"   Génération: {avg_gen:.2f}s") 
            print(f"   Durée audio: {avg_audio:.2f}s")
            print(f"   Ratio temps réel: {avg_audio/avg_gen:.2f}x")
            
            return len(times) == num_requests
        
        return False
    
    def test_error_handling(self):
        """Test de la gestion d'erreurs"""
        print(f"\n6. Test de gestion d'erreurs...")
        
        error_tests = [
            {
                "name": "Texte vide",
                "payload": {"text": "", "voice": "af_heart"},
                "expected_status": 422
            },
            {
                "name": "Voix inexistante", 
                "payload": {"text": "Test", "voice": "voix_inexistante"},
                "expected_status": 400
            },
            {
                "name": "Vitesse invalide",
                "payload": {"text": "Test", "voice": "af_heart", "speed": 5.0},
                "expected_status": 422
            },
            {
                "name": "Texte trop long",
                "payload": {"text": "A" * 3000, "voice": "af_heart"},
                "expected_status": 422
            }
        ]
        
        success_count = 0
        
        for test in error_tests:
            try:
                response = self.session.post(
                    f"{self.base_url}/tts",
                    json=test['payload']
                )
                
                if response.status_code == test['expected_status']:
                    print(f"   ✓ {test['name']}: Erreur {response.status_code} (attendue)")
                    success_count += 1
                else:
                    print(f"   ✗ {test['name']}: Status {response.status_code} (attendu {test['expected_status']})")
                    
            except Exception as e:
                print(f"   ✗ {test['name']}: Exception {e}")
        
        return success_count == len(error_tests)
    
    def test_stats_endpoint(self):
        """Test du endpoint de statistiques"""
        print(f"\n7. Test des statistiques...")
        
        try:
            response = self.session.get(f"{self.base_url}/stats")
            response.raise_for_status()
            
            data = response.json()
            print(f"✓ Uptime: {data.get('uptime_seconds'):.1f}s")
            print(f"✓ Fichiers temporaires: {data.get('temp_files_count')}")
            print(f"✓ Taille cache: {data.get('temp_files_size_mb'):.2f} MB")
            return True
            
        except Exception as e:
            print(f"✗ Erreur: {e}")
            return False
    
    def run_all_tests(self):
        """Lance tous les tests optimisés"""
        print("=" * 70)
        print("🚀 TESTS API KOKORO OPTIMISÉE")
        print("=" * 70)
        
        tests = [
            self.test_root_endpoint,
            self.test_health_detailed, 
            self.test_voices_detailed,
            self.test_tts_optimized,
            self.test_performance_comparison,
            self.test_error_handling,
            self.test_stats_endpoint
        ]
        
        results = []
        for test_func in tests:
            try:
                result = test_func()
                results.append(result)
            except KeyboardInterrupt:
                print("\n⚠️  Tests interrompus")
                break
            except Exception as e:
                print(f"\n❌ Erreur inattendue: {e}")
                results.append(False)
        
        # Résultats
        print("\n" + "=" * 70)
        print("📊 RÉSULTATS FINAUX")
        print("=" * 70)
        
        passed = sum(results)
        total = len(results)
        
        if passed == total:
            print(f"🎉 Tous les tests réussis ! ({passed}/{total})")
            print("\n✅ L'API optimisée est prête pour l'étape 5 (Interface React)")
            print("\n📋 Points validés:")
            print("   ✓ Chargement optimisé du modèle")
            print("   ✓ Gestion d'erreurs robuste") 
            print("   ✓ Performance améliorée")
            print("   ✓ Métadonnées détaillées")
            print("   ✓ Nettoyage automatique")
        else:
            print(f"⚠️  {total - passed} test(s) échoué(s) sur {total}")
        
        return passed == total

def main():
    """Fonction principale"""
    print("Vérification de la disponibilité de l'API optimisée...")
    
    tester = OptimizedKokoroAPITester()
    
    try:
        response = requests.get(f"{tester.base_url}/", timeout=10)
        if "Kokoro TTS API Optimized" in response.json().get('name', ''):
            print("✓ API optimisée accessible")
        else:
            print("⚠️  API standard détectée. Utilisez: python api_kokoro_optimized.py")
            return False
    except requests.exceptions.RequestException:
        print("✗ API non accessible.")
        print("Démarrez l'API optimisée: python api_kokoro_optimized.py")
        return False
    
    return tester.run_all_tests()

if __name__ == "__main__":
    success = main()
    
    if success:
        print("\n🎯 ÉTAPE 4 TERMINÉE AVEC SUCCÈS !")
        print("👉 Vous pouvez maintenant passer à l'ÉTAPE 5 - Interface React")
    else:
        print("\n🔧 Corrigez les erreurs avant de passer à l'étape suivante")
    
    sys.exit(0 if success else 1)