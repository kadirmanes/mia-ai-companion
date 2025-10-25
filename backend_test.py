#!/usr/bin/env python3
"""
MIA AI Pet Backend API Testing Suite
Tests all backend endpoints for the MIA AI Pet application
"""

import requests
import json
import time
from datetime import datetime

# Backend URL from frontend/.env
BACKEND_URL = "https://smart-avatar-4.preview.emergentagent.com"

class MIABackendTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.pet_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_health_check(self):
        """Test GET /api/health"""
        try:
            response = requests.get(f"{self.base_url}/api/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, "Backend is healthy")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response: {data}", data)
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
        return False
    
    def test_get_personalities(self):
        """Test GET /api/personalities"""
        try:
            response = requests.get(f"{self.base_url}/api/personalities", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                personalities = data.get("personalities", [])
                
                if len(personalities) == 4:
                    # Check if all expected personalities exist
                    expected_ids = ["cheerful", "shy", "adventurous", "calm"]
                    found_ids = [p.get("id") for p in personalities]
                    
                    if all(pid in found_ids for pid in expected_ids):
                        self.log_test("Get Personalities", True, f"Found all 4 personalities: {found_ids}")
                        return True
                    else:
                        self.log_test("Get Personalities", False, f"Missing personalities. Found: {found_ids}", data)
                else:
                    self.log_test("Get Personalities", False, f"Expected 4 personalities, got {len(personalities)}", data)
            else:
                self.log_test("Get Personalities", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Personalities", False, f"Request failed: {str(e)}")
        return False
    
    def test_create_pet(self):
        """Test POST /api/pet/create"""
        try:
            pet_data = {
                "user_id": "test_user_luna",
                "name": "Luna",
                "personality_type": "predefined",
                "personality_id": "cheerful",
                "color": "#FFB6C1"
            }
            
            response = requests.post(
                f"{self.base_url}/api/pet/create",
                json=pet_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get("success") and "pet" in data:
                    pet = data["pet"]
                    self.pet_id = pet.get("_id")
                    
                    # Verify pet data
                    if (pet.get("name") == "Luna" and 
                        pet.get("personality_id") == "cheerful" and
                        pet.get("color") == "#FFB6C1"):
                        self.log_test("Create Pet", True, f"Pet created successfully with ID: {self.pet_id}")
                        return True
                    else:
                        self.log_test("Create Pet", False, "Pet data doesn't match request", data)
                else:
                    self.log_test("Create Pet", False, "Invalid response format", data)
            else:
                self.log_test("Create Pet", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Create Pet", False, f"Request failed: {str(e)}")
        return False
    
    def test_get_pet(self):
        """Test GET /api/pet/{pet_id}"""
        if not self.pet_id:
            self.log_test("Get Pet", False, "No pet_id available from create test")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/api/pet/{self.pet_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "pet" in data and "stats" in data:
                    pet = data["pet"]
                    stats = data["stats"]
                    
                    if (pet.get("name") == "Luna" and 
                        stats and stats.get("affection") == 50):
                        self.log_test("Get Pet", True, "Pet and stats retrieved successfully")
                        return True
                    else:
                        self.log_test("Get Pet", False, "Pet or stats data incorrect", data)
                else:
                    self.log_test("Get Pet", False, "Missing pet or stats in response", data)
            else:
                self.log_test("Get Pet", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Pet", False, f"Request failed: {str(e)}")
        return False
    
    def test_chat(self):
        """Test POST /api/chat"""
        if not self.pet_id:
            self.log_test("Chat", False, "No pet_id available from create test")
            return False
            
        try:
            chat_data = {
                "pet_id": self.pet_id,
                "message": "Hi! How are you today?"
            }
            
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=chat_data,
                timeout=30  # Longer timeout for AI response
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if (data.get("success") and 
                    "response" in data and 
                    "emotion" in data and 
                    "sentiment_score" in data):
                    
                    ai_response = data["response"]
                    emotion = data["emotion"]
                    sentiment = data["sentiment_score"]
                    
                    if ai_response and len(ai_response) > 0:
                        self.log_test("Chat", True, f"AI responded: '{ai_response[:50]}...', emotion: {emotion}, sentiment: {sentiment}")
                        return True
                    else:
                        self.log_test("Chat", False, "Empty AI response", data)
                else:
                    self.log_test("Chat", False, "Missing required fields in response", data)
            else:
                self.log_test("Chat", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Chat", False, f"Request failed: {str(e)}")
        return False
    
    def test_get_stats(self):
        """Test GET /api/stats/{pet_id}"""
        if not self.pet_id:
            self.log_test("Get Stats", False, "No pet_id available from create test")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/api/stats/{self.pet_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "stats" in data:
                    stats = data["stats"]
                    
                    # After chat, affection should have increased from 50 to 55
                    if (stats.get("affection") == 55 and 
                        "energy" in stats and 
                        "mood" in stats):
                        self.log_test("Get Stats", True, f"Stats updated correctly: affection={stats['affection']}, energy={stats['energy']}, mood={stats['mood']}")
                        return True
                    else:
                        self.log_test("Get Stats", False, f"Stats not updated as expected: {stats}", data)
                else:
                    self.log_test("Get Stats", False, "Missing stats in response", data)
            else:
                self.log_test("Get Stats", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Get Stats", False, f"Request failed: {str(e)}")
        return False
    
    def test_chat_history(self):
        """Test GET /api/chat/history/{pet_id}"""
        if not self.pet_id:
            self.log_test("Chat History", False, "No pet_id available from create test")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/api/chat/history/{self.pet_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "chats" in data:
                    chats = data["chats"]
                    
                    if len(chats) >= 1:
                        # Check if our test message is in the history
                        found_message = any(
                            chat.get("user_message") == "Hi! How are you today?" 
                            for chat in chats
                        )
                        
                        if found_message:
                            self.log_test("Chat History", True, f"Found {len(chats)} chat messages including our test message")
                            return True
                        else:
                            self.log_test("Chat History", False, "Test message not found in chat history", data)
                    else:
                        self.log_test("Chat History", False, "No chat messages found", data)
                else:
                    self.log_test("Chat History", False, "Missing chats in response", data)
            else:
                self.log_test("Chat History", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Chat History", False, f"Request failed: {str(e)}")
        return False
    
    def test_check_inactive(self):
        """Test GET /api/check-inactive/{pet_id}"""
        if not self.pet_id:
            self.log_test("Check Inactive", False, "No pet_id available from create test")
            return False
            
        try:
            response = requests.get(f"{self.base_url}/api/check-inactive/{self.pet_id}", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if "inactive" in data:
                    # For a newly created pet, it should not be inactive
                    if data["inactive"] == False:
                        self.log_test("Check Inactive", True, "Pet is not inactive (as expected for new pet)")
                        return True
                    else:
                        self.log_test("Check Inactive", False, f"New pet should not be inactive: {data}", data)
                else:
                    self.log_test("Check Inactive", False, "Missing inactive field in response", data)
            else:
                self.log_test("Check Inactive", False, f"HTTP {response.status_code}", response.text)
        except Exception as e:
            self.log_test("Check Inactive", False, f"Request failed: {str(e)}")
        return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print("=" * 60)
        print("MIA AI Pet Backend API Testing Suite")
        print("=" * 60)
        print(f"Testing backend at: {self.base_url}")
        print()
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("Get Personalities", self.test_get_personalities),
            ("Create Pet", self.test_create_pet),
            ("Get Pet", self.test_get_pet),
            ("Chat with Pet", self.test_chat),
            ("Get Updated Stats", self.test_get_stats),
            ("Chat History", self.test_chat_history),
            ("Check Inactive", self.test_check_inactive)
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\nRunning: {test_name}")
            if test_func():
                passed += 1
            time.sleep(1)  # Small delay between tests
        
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        print(f"Passed: {passed}/{total}")
        print(f"Failed: {total - passed}/{total}")
        
        if passed == total:
            print("🎉 ALL TESTS PASSED!")
        else:
            print("⚠️  Some tests failed. Check details above.")
        
        return passed == total

if __name__ == "__main__":
    tester = MIABackendTester()
    success = tester.run_all_tests()
    
    # Print detailed results
    print("\nDETAILED RESULTS:")
    for result in tester.test_results:
        status = "✅" if result["success"] else "❌"
        print(f"{status} {result['test']}: {result['details']}")
    
    exit(0 if success else 1)