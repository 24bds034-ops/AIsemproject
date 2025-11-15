#!/usr/bin/env python3
"""
Training script for MediBot model
Run this script to train the model on conversation data
"""

import os
import sys
import json
import argparse
from datetime import datetime
from model_trainer import MediBotTrainer
from data_collector import ConvexDataCollector

def load_sample_data():
    """Load sample conversation data for testing"""
    sample_conversations = [
        {
            "userId": "user1",
            "messages": [
                {
                    "id": "msg1",
                    "role": "user",
                    "content": "What is aspirin?",
                    "timestamp": 1640995200000
                },
                {
                    "id": "msg2",
                    "role": "thinking",
                    "content": "Let me think about aspirin... This is a very common medication that people use for pain relief and heart protection. I need to consider its uses, how it works, side effects, and important safety information. It's an NSAID that works by blocking COX enzymes, which reduces inflammation and pain. I should mention both its benefits and risks, especially bleeding risks.",
                    "timestamp": 1640995205000,
                    "isComplete": True
                },
                {
                    "id": "msg3",
                    "role": "assistant",
                    "content": "**Aspirin**\n\n• **What it's used for:** Pain relief, fever reduction, and heart attack/stroke prevention\n• **How it works:** Blocks enzymes that cause inflammation and pain\n• **How to take:** With food to reduce stomach irritation, as directed by doctor\n• **Common side effects:** Stomach upset, heartburn, nausea\n• **Serious side effects:** Stomach bleeding, allergic reactions, ringing in ears\n• **Precautions:** Avoid in children with viral infections (Reye's syndrome risk)\n• **Interactions:** Blood thinners, alcohol increase bleeding risk\n• **When to avoid:** Active bleeding, severe kidney/liver disease\n• **Overdose/Missed dose:** Seek help for overdose; take missed dose unless almost time for next\n• **Storage:** Room temperature, dry place\n\nThis is general information only. Please consult a doctor before taking or stopping any medicine.",
                    "timestamp": 1640995210000
                }
            ]
        },
        {
            "userId": "user2", 
            "messages": [
                {
                    "id": "msg4",
                    "role": "user",
                    "content": "Side effects of ibuprofen",
                    "timestamp": 1640995300000
                },
                {
                    "id": "msg5",
                    "role": "thinking",
                    "content": "The user is asking specifically about side effects of ibuprofen. I need to think about both common and serious side effects. Ibuprofen is an NSAID like aspirin, so it has similar risks including stomach problems, kidney issues, and cardiovascular risks. I should categorize the side effects clearly and emphasize when to seek medical attention.",
                    "timestamp": 1640995305000,
                    "isComplete": True
                },
                {
                    "id": "msg6",
                    "role": "assistant", 
                    "content": "**Ibuprofen Side Effects**\n\n• **Common side effects:** Stomach upset, nausea, heartburn, dizziness, headache\n• **Serious side effects:** Stomach bleeding, kidney problems, high blood pressure, heart attack risk\n• **Allergic reactions:** Rash, swelling, difficulty breathing - seek immediate help\n• **Long-term risks:** Increased risk of heart problems and kidney damage with prolonged use\n• **When to stop and call doctor:** Black/bloody stools, severe stomach pain, swelling, chest pain\n\n⚠️ If you experience severe symptoms like difficulty breathing or chest pain, contact a doctor or hospital immediately.\n\nThis is general information only. Please consult a doctor before taking or stopping any medicine.",
                    "timestamp": 1640995310000
                }
            ]
        }
    ]
    return sample_conversations

def main():
    parser = argparse.ArgumentParser(description='Train MediBot model')
    parser.add_argument('--data-source', choices=['sample', 'convex', 'file'], 
                       default='sample', help='Source of training data')
    parser.add_argument('--data-file', type=str, help='Path to JSON file with conversation data')
    parser.add_argument('--convex-url', type=str, help='Convex deployment URL')
    parser.add_argument('--epochs', type=int, default=3, help='Number of training epochs')
    parser.add_argument('--output-dir', type=str, default='./medibot_model', 
                       help='Output directory for trained model')
    
    args = parser.parse_args()
    
    print("🤖 MediBot Training Script")
    print("=" * 50)
    
    # Initialize trainer
    trainer = MediBotTrainer()
    
    # Load training data based on source
    conversations = []
    
    if args.data_source == 'sample':
        print("📚 Loading sample conversation data...")
        conversations = load_sample_data()
        
    elif args.data_source == 'file':
        if not args.data_file or not os.path.exists(args.data_file):
            print("❌ Error: Data file not found")
            sys.exit(1)
        
        print(f"📁 Loading data from {args.data_file}...")
        with open(args.data_file, 'r') as f:
            conversations = json.load(f)
            
    elif args.data_source == 'convex':
        if not args.convex_url:
            print("❌ Error: Convex URL required for convex data source")
            sys.exit(1)
        
        print(f"🌐 Fetching data from Convex: {args.convex_url}")
        collector = ConvexDataCollector(args.convex_url)
        conversations = collector.fetch_conversations()
    
    if not conversations:
        print("❌ No conversation data found")
        sys.exit(1)
    
    print(f"✅ Found {len(conversations)} conversations")
    
    # Train the model
    print("🚀 Starting training...")
    start_time = datetime.now()
    
    try:
        results = trainer.train_on_conversations(conversations)
        
        end_time = datetime.now()
        duration = end_time - start_time
        
        print("\n🎉 Training completed!")
        print("=" * 50)
        print(f"⏱️  Duration: {duration}")
        print(f"📊 Training Loss: {results.get('training_loss', 'N/A')}")
        print(f"📝 Examples Trained: {results.get('examples_trained', 0)}")
        print(f"🧠 Thinking Patterns: {results.get('thinking_patterns', 0)}")
        print(f"💊 Medicines Learned: {results.get('medicines_learned', 0)}")
        print(f"💾 Model saved to: {args.output_dir}")
        
        # Save training summary
        summary = {
            'timestamp': datetime.now().isoformat(),
            'duration_seconds': duration.total_seconds(),
            'data_source': args.data_source,
            'conversations_count': len(conversations),
            'results': results
        }
        
        with open('training_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print("📋 Training summary saved to training_summary.json")
        
    except Exception as e:
        print(f"❌ Training failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
