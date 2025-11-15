import requests
import json
import os
from datetime import datetime
from typing import List, Dict, Any

class ConvexDataCollector:
    def __init__(self, convex_url: str, api_key: str = None):
        self.convex_url = convex_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json'
        }
        if api_key:
            self.headers['Authorization'] = f'Bearer {api_key}'
    
    def fetch_conversations(self) -> List[Dict[str, Any]]:
        """Fetch all conversations from Convex backend"""
        try:
            # This would be the actual API call to your Convex backend
            # For now, we'll simulate the structure
            response = requests.get(
                f"{self.convex_url}/api/conversations",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error fetching conversations: {response.status_code}")
                return []
                
        except Exception as e:
            print(f"Error connecting to Convex: {e}")
            return []
    
    def fetch_user_conversations(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch conversations for a specific user"""
        try:
            response = requests.get(
                f"{self.convex_url}/api/conversations/{user_id}",
                headers=self.headers
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                return []
                
        except Exception as e:
            print(f"Error fetching user conversations: {e}")
            return []
    
    def send_training_data(self, conversations: List[Dict[str, Any]]) -> bool:
        """Send conversation data to Python backend for training"""
        try:
            response = requests.post(
                'http://localhost:5000/train',
                json={'conversations': conversations},
                headers={'Content-Type': 'application/json'}
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Error sending training data: {e}")
            return False
    
    def collect_and_train(self):
        """Collect conversations and send for training"""
        print("Collecting conversations from Convex...")
        conversations = self.fetch_conversations()
        
        if conversations:
            print(f"Found {len(conversations)} conversations")
            success = self.send_training_data(conversations)
            
            if success:
                print("Training data sent successfully!")
                return True
            else:
                print("Failed to send training data")
                return False
        else:
            print("No conversations found")
            return False

# Example usage script
if __name__ == "__main__":
    # Configuration
    CONVEX_URL = os.getenv('CONVEX_URL', 'https://your-convex-deployment.convex.cloud')
    API_KEY = os.getenv('CONVEX_API_KEY')
    
    collector = ConvexDataCollector(CONVEX_URL, API_KEY)
    collector.collect_and_train()
