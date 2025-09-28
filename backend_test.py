#!/usr/bin/env python3
"""
ZODIC Trading Platform Backend API Tests
Tests all backend endpoints for the trading bot platform
"""

import requests
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://zodic-auto-trader.preview.emergentagent.com/api"
TEST_SESSION_ID = "test-session-12345"  # Mock session ID for testing

class ZodicAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_id = None
        self.test_bot_id = None
        self.results = {
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "errors": []
        }
    
    def log_result(self, test_name: str, success: bool, message: str = "", response_data: Any = None):
        """Log test result"""
        self.results["total_tests"] += 1
        if success:
            self.results["passed"] += 1
            print(f"✅ {test_name}: PASSED {message}")
        else:
            self.results["failed"] += 1
            error_msg = f"❌ {test_name}: FAILED - {message}"
            if response_data:
                error_msg += f" | Response: {response_data}"
            print(error_msg)
            self.results["errors"].append(error_msg)
    
    def make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make HTTP request with proper error handling"""
        url = f"{self.base_url}{endpoint}"
        try:
            response = self.session.request(method, url, timeout=30, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            raise
    
    def test_health_check(self):
        """Test health check endpoint"""
        print("\n=== Testing Health Check ===")
        try:
            response = self.make_request("GET", "/health")
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "healthy":
                    self.log_result("Health Check", True, f"Status: {data['status']}")
                else:
                    self.log_result("Health Check", False, f"Invalid response format: {data}")
            else:
                self.log_result("Health Check", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
    
    def test_market_data_endpoints(self):
        """Test market data endpoints (no auth required)"""
        print("\n=== Testing Market Data Endpoints ===")
        
        # Test get all stocks
        try:
            response = self.make_request("GET", "/market/stocks")
            if response.status_code == 200:
                data = response.json()
                expected_stocks = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "ICICIBANK", "WIPRO", "BHARTIARTL", "ITC"]
                if all(stock in data for stock in expected_stocks):
                    self.log_result("Get All Stocks", True, f"Found {len(data)} stocks")
                else:
                    self.log_result("Get All Stocks", False, f"Missing expected stocks. Got: {list(data.keys())}")
            else:
                self.log_result("Get All Stocks", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Get All Stocks", False, f"Exception: {str(e)}")
        
        # Test get specific stock
        try:
            response = self.make_request("GET", "/market/stocks/RELIANCE")
            if response.status_code == 200:
                data = response.json()
                if "RELIANCE" in data and "price" in data["RELIANCE"]:
                    self.log_result("Get Specific Stock", True, f"RELIANCE price: {data['RELIANCE']['price']}")
                else:
                    self.log_result("Get Specific Stock", False, f"Invalid response format: {data}")
            else:
                self.log_result("Get Specific Stock", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Get Specific Stock", False, f"Exception: {str(e)}")
        
        # Test invalid stock
        try:
            response = self.make_request("GET", "/market/stocks/INVALID")
            if response.status_code == 404:
                self.log_result("Invalid Stock Handling", True, "Correctly returned 404")
            else:
                self.log_result("Invalid Stock Handling", False, f"Expected 404, got: {response.status_code}")
        except Exception as e:
            self.log_result("Invalid Stock Handling", False, f"Exception: {str(e)}")
    
    def test_authentication_endpoints(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication Endpoints ===")
        
        # Test session creation (will fail without valid Emergent Auth session)
        try:
            headers = {"X-Session-ID": TEST_SESSION_ID}
            response = self.make_request("POST", "/auth/session", headers=headers)
            
            # This will likely fail since we don't have a valid Emergent Auth session
            if response.status_code == 200:
                data = response.json()
                if "user" in data:
                    self.auth_token = response.cookies.get("session_token")
                    self.test_user_id = data["user"]["id"]
                    self.log_result("Session Creation", True, f"User: {data['user']['email']}")
                else:
                    self.log_result("Session Creation", False, f"Invalid response format: {data}")
            else:
                # Expected to fail with mock session ID
                self.log_result("Session Creation", False, f"Status code: {response.status_code} (Expected - using mock session ID)", response.text)
        except Exception as e:
            self.log_result("Session Creation", False, f"Exception: {str(e)}")
        
        # Test get current user without auth
        try:
            response = self.make_request("GET", "/auth/me")
            if response.status_code == 401:
                self.log_result("Get User Without Auth", True, "Correctly returned 401")
            else:
                self.log_result("Get User Without Auth", False, f"Expected 401, got: {response.status_code}")
        except Exception as e:
            self.log_result("Get User Without Auth", False, f"Exception: {str(e)}")
        
        # Test logout
        try:
            response = self.make_request("POST", "/auth/logout")
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_result("Logout", True, data["message"])
                else:
                    self.log_result("Logout", False, f"Invalid response format: {data}")
            else:
                self.log_result("Logout", False, f"Status code: {response.status_code}")
        except Exception as e:
            self.log_result("Logout", False, f"Exception: {str(e)}")
    
    def test_protected_endpoints_without_auth(self):
        """Test protected endpoints without authentication"""
        print("\n=== Testing Protected Endpoints Without Auth ===")
        
        endpoints_to_test = [
            ("GET", "/bots", "Get Bots"),
            ("POST", "/bots", "Create Bot"),
            ("GET", "/portfolio", "Get Portfolio"),
            ("GET", "/trades", "Get Trades"),
            ("GET", "/analytics/overview", "Get Analytics"),
            ("GET", "/admin/users", "Get Users (Admin)"),
        ]
        
        for method, endpoint, test_name in endpoints_to_test:
            try:
                if method == "POST" and endpoint == "/bots":
                    # Provide sample bot data for POST request
                    response = self.make_request(method, endpoint, json={
                        "name": "Test Bot",
                        "strategy": "momentum",
                        "capital": 10000
                    })
                else:
                    response = self.make_request(method, endpoint)
                
                if response.status_code == 401:
                    self.log_result(f"{test_name} Without Auth", True, "Correctly returned 401")
                elif response.status_code == 403 and "admin" in endpoint.lower():
                    self.log_result(f"{test_name} Without Auth", True, "Correctly returned 403 (admin endpoint)")
                else:
                    self.log_result(f"{test_name} Without Auth", False, f"Expected 401/403, got: {response.status_code}")
            except Exception as e:
                self.log_result(f"{test_name} Without Auth", False, f"Exception: {str(e)}")
    
    def test_admin_endpoints_without_admin_role(self):
        """Test admin endpoints without admin role (would need valid client session)"""
        print("\n=== Testing Admin Endpoints Without Admin Role ===")
        
        # These tests would require a valid client session, which we can't create without Emergent Auth
        # But we can test that they return 401 without any auth
        admin_endpoints = [
            ("GET", "/admin/users", "Get All Users"),
            ("PUT", "/admin/users/test-user-id/role", "Update User Role"),
        ]
        
        for method, endpoint, test_name in admin_endpoints:
            try:
                if method == "PUT":
                    response = self.make_request(method, endpoint, json={"role": "admin"})
                else:
                    response = self.make_request(method, endpoint)
                
                if response.status_code == 401 or response.status_code == 403:
                    self.log_result(f"{test_name} Without Auth", True, f"Correctly returned {response.status_code}")
                else:
                    self.log_result(f"{test_name} Without Auth", False, f"Expected 401/403, got: {response.status_code}")
            except Exception as e:
                self.log_result(f"{test_name} Without Auth", False, f"Exception: {str(e)}")
    
    def test_bot_toggle_endpoint(self):
        """Test bot toggle endpoint"""
        print("\n=== Testing Bot Toggle Endpoint ===")
        
        try:
            # This will fail without auth, but we can test the endpoint exists
            response = self.make_request("PUT", "/bots/test-bot-id/toggle")
            if response.status_code == 401:
                self.log_result("Bot Toggle Without Auth", True, "Correctly returned 401")
            else:
                self.log_result("Bot Toggle Without Auth", False, f"Expected 401, got: {response.status_code}")
        except Exception as e:
            self.log_result("Bot Toggle Without Auth", False, f"Exception: {str(e)}")
    
    def test_error_handling(self):
        """Test error handling for invalid requests"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid endpoints
        try:
            response = self.make_request("GET", "/invalid/endpoint")
            if response.status_code == 404:
                self.log_result("Invalid Endpoint", True, "Correctly returned 404")
            else:
                self.log_result("Invalid Endpoint", False, f"Expected 404, got: {response.status_code}")
        except Exception as e:
            self.log_result("Invalid Endpoint", False, f"Exception: {str(e)}")
        
        # Test invalid HTTP methods
        try:
            response = self.make_request("DELETE", "/health")
            if response.status_code == 405:
                self.log_result("Invalid HTTP Method", True, "Correctly returned 405")
            else:
                self.log_result("Invalid HTTP Method", False, f"Expected 405, got: {response.status_code}")
        except Exception as e:
            self.log_result("Invalid HTTP Method", False, f"Exception: {str(e)}")
    
    def test_mongodb_integration(self):
        """Test MongoDB integration by checking if endpoints that require DB work"""
        print("\n=== Testing MongoDB Integration ===")
        
        # The health check and market data endpoints don't require DB
        # But auth endpoints do - we can infer DB connectivity from their responses
        try:
            # Test an endpoint that requires DB access
            response = self.make_request("GET", "/auth/me")
            # If we get 401 (not authenticated) rather than 500 (server error), 
            # it suggests the DB connection is working
            if response.status_code == 401:
                self.log_result("MongoDB Integration", True, "DB appears to be accessible (got 401, not 500)")
            elif response.status_code == 500:
                self.log_result("MongoDB Integration", False, "Possible DB connection issue (got 500)")
            else:
                self.log_result("MongoDB Integration", True, f"Unexpected but non-error response: {response.status_code}")
        except Exception as e:
            self.log_result("MongoDB Integration", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting ZODIC Trading Platform Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print(f"Test started at: {datetime.now()}")
        
        # Run test suites in order
        self.test_health_check()
        self.test_market_data_endpoints()
        self.test_authentication_endpoints()
        self.test_protected_endpoints_without_auth()
        self.test_admin_endpoints_without_admin_role()
        self.test_bot_toggle_endpoint()
        self.test_error_handling()
        self.test_mongodb_integration()
        
        # Print summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.results['total_tests']}")
        print(f"Passed: {self.results['passed']}")
        print(f"Failed: {self.results['failed']}")
        print(f"Success Rate: {(self.results['passed']/self.results['total_tests']*100):.1f}%")
        
        if self.results['errors']:
            print(f"\n❌ FAILED TESTS ({len(self.results['errors'])}):")
            for error in self.results['errors']:
                print(f"  • {error}")
        
        print(f"\nTest completed at: {datetime.now()}")
        
        return self.results

if __name__ == "__main__":
    tester = ZodicAPITester()
    results = tester.run_all_tests()
    
    # Exit with error code if tests failed
    if results['failed'] > 0:
        exit(1)
    else:
        exit(0)