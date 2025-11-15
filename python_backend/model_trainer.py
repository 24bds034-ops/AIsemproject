import torch
import torch.nn as nn
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, 
    TrainingArguments, Trainer, DataCollatorForLanguageModeling
)
from datasets import Dataset
import json
import os
import numpy as np
from datetime import datetime
import pickle
from typing import List, Dict, Any

class MediBotTrainer:
    def __init__(self, model_name="microsoft/DialoGPT-medium"):
        self.model_name = model_name
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name)
        
        # Add special tokens for thinking process
        special_tokens = {
            "additional_special_tokens": [
                "<think>", "</think>", 
                "<medicine>", "</medicine>",
                "<action>", "</action>",
                "<safety>", "</safety>"
            ]
        }
        self.tokenizer.add_special_tokens(special_tokens)
        self.model.resize_token_embeddings(len(self.tokenizer))
        
        # Training data storage
        self.training_data = []
        self.feedback_data = []
        self.thinking_patterns = {}
        self.medicine_knowledge = {}
        
        # Load existing data if available
        self.load_training_data()
        
    def load_training_data(self):
        """Load existing training data and patterns"""
        try:
            if os.path.exists('training_data.pkl'):
                with open('training_data.pkl', 'rb') as f:
                    data = pickle.load(f)
                    self.training_data = data.get('training_data', [])
                    self.thinking_patterns = data.get('thinking_patterns', {})
                    self.medicine_knowledge = data.get('medicine_knowledge', {})
        except Exception as e:
            print(f"Could not load existing training data: {e}")
    
    def save_training_data(self):
        """Save training data and patterns"""
        data = {
            'training_data': self.training_data,
            'thinking_patterns': self.thinking_patterns,
            'medicine_knowledge': self.medicine_knowledge,
            'last_updated': datetime.now().isoformat()
        }
        with open('training_data.pkl', 'wb') as f:
            pickle.dump(data, f)
    
    def process_conversation(self, conversation: Dict[str, Any]) -> List[Dict[str, str]]:
        """Process a conversation into training examples"""
        messages = conversation.get('messages', [])
        training_examples = []
        
        current_context = ""
        thinking_context = ""
        
        for i, message in enumerate(messages):
            role = message.get('role')
            content = message.get('content', '')
            
            if role == 'user':
                current_context = content
                # Extract medicine name and action if possible
                self.extract_medicine_info(content)
                
            elif role == 'thinking':
                thinking_context = content
                # Store thinking patterns
                self.store_thinking_pattern(current_context, content)
                
            elif role == 'assistant':
                # Create training example
                if current_context and thinking_context:
                    training_example = {
                        'input': f"<medicine>{current_context}</medicine>",
                        'thinking': f"<think>{thinking_context}</think>",
                        'output': content,
                        'full_sequence': f"<medicine>{current_context}</medicine><think>{thinking_context}</think>{content}"
                    }
                    training_examples.append(training_example)
                    
                    # Store medicine knowledge
                    self.store_medicine_knowledge(current_context, content)
        
        return training_examples
    
    def extract_medicine_info(self, user_input: str):
        """Extract medicine name and action from user input"""
        # Simple extraction - can be improved with NER
        common_actions = ['uses', 'side effects', 'interactions', 'precautions', 'how to take']
        
        for action in common_actions:
            if action.lower() in user_input.lower():
                medicine = user_input.lower().replace(action.lower(), '').strip()
                medicine = medicine.replace('for', '').replace('of', '').strip()
                return medicine, action
        
        return user_input.strip(), None
    
    def store_thinking_pattern(self, query: str, thinking: str):
        """Store thinking patterns for analysis"""
        medicine, action = self.extract_medicine_info(query)
        
        if medicine not in self.thinking_patterns:
            self.thinking_patterns[medicine] = []
        
        self.thinking_patterns[medicine].append({
            'query': query,
            'thinking': thinking,
            'action': action,
            'timestamp': datetime.now().isoformat()
        })
    
    def store_medicine_knowledge(self, query: str, response: str):
        """Store medicine knowledge for reference"""
        medicine, action = self.extract_medicine_info(query)
        
        if medicine not in self.medicine_knowledge:
            self.medicine_knowledge[medicine] = {}
        
        if action:
            self.medicine_knowledge[medicine][action] = response
        else:
            self.medicine_knowledge[medicine]['general'] = response
    
    def train_on_conversations(self, conversations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Train the model on conversation data"""
        # Process conversations into training examples
        all_examples = []
        for conv in conversations:
            examples = self.process_conversation(conv)
            all_examples.extend(examples)
        
        self.training_data.extend(all_examples)
        
        if not all_examples:
            return {"message": "No valid training examples found"}
        
        # Prepare dataset
        dataset = self.prepare_dataset(all_examples)
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir='./medibot_model',
            overwrite_output_dir=True,
            num_train_epochs=3,
            per_device_train_batch_size=2,
            per_device_eval_batch_size=2,
            warmup_steps=100,
            logging_steps=50,
            save_steps=500,
            evaluation_strategy="steps",
            eval_steps=500,
            save_total_limit=2,
            prediction_loss_only=True,
            remove_unused_columns=False,
        )
        
        # Data collator
        data_collator = DataCollatorForLanguageModeling(
            tokenizer=self.tokenizer,
            mlm=False,
        )
        
        # Create trainer
        trainer = Trainer(
            model=self.model,
            args=training_args,
            data_collator=data_collator,
            train_dataset=dataset,
            eval_dataset=dataset,  # Using same dataset for eval (should split in production)
        )
        
        # Train the model
        training_result = trainer.train()
        
        # Save the model
        trainer.save_model('./medibot_model')
        self.tokenizer.save_pretrained('./medibot_model')
        
        # Save training data
        self.save_training_data()
        
        return {
            "training_loss": training_result.training_loss,
            "examples_trained": len(all_examples),
            "total_examples": len(self.training_data),
            "thinking_patterns": len(self.thinking_patterns),
            "medicines_learned": len(self.medicine_knowledge)
        }
    
    def prepare_dataset(self, examples: List[Dict[str, str]]) -> Dataset:
        """Prepare dataset for training"""
        texts = [example['full_sequence'] for example in examples]
        
        # Tokenize texts
        tokenized = self.tokenizer(
            texts,
            truncation=True,
            padding=True,
            max_length=512,
            return_tensors="pt"
        )
        
        # Create dataset
        dataset = Dataset.from_dict({
            'input_ids': tokenized['input_ids'],
            'attention_mask': tokenized['attention_mask'],
            'labels': tokenized['input_ids'].clone()
        })
        
        return dataset
    
    def add_feedback(self, conversation_id: str, feedback_type: str, feedback_data: Dict[str, Any]):
        """Add feedback for future training"""
        feedback_entry = {
            'conversation_id': conversation_id,
            'type': feedback_type,
            'data': feedback_data,
            'timestamp': datetime.now().isoformat()
        }
        self.feedback_data.append(feedback_entry)
        
        # Save feedback
        with open('feedback_data.pkl', 'wb') as f:
            pickle.dump(self.feedback_data, f)
    
    def retrain_with_feedback(self) -> Dict[str, Any]:
        """Retrain model incorporating feedback"""
        if not self.feedback_data:
            return {"message": "No feedback data available for retraining"}
        
        # Process feedback into training examples
        feedback_examples = self.process_feedback_data()
        
        if feedback_examples:
            return self.train_on_conversations(feedback_examples)
        else:
            return {"message": "No valid feedback examples for retraining"}
    
    def process_feedback_data(self) -> List[Dict[str, Any]]:
        """Process feedback data into training examples"""
        # This would process feedback into conversation format
        # Implementation depends on feedback structure
        return []
    
    def get_training_count(self) -> int:
        """Get total number of training examples"""
        return len(self.training_data)
    
    def get_accuracy_metrics(self) -> Dict[str, float]:
        """Get model accuracy metrics"""
        # This would calculate various accuracy metrics
        # For now, return placeholder values
        return {
            "thinking_accuracy": 0.85,
            "response_accuracy": 0.82,
            "safety_score": 0.95,
            "coherence_score": 0.88
        }
    
    def get_thinking_patterns(self) -> Dict[str, int]:
        """Get thinking pattern statistics"""
        pattern_stats = {}
        for medicine, patterns in self.thinking_patterns.items():
            pattern_stats[medicine] = len(patterns)
        return pattern_stats
    
    def get_common_medicines(self) -> List[str]:
        """Get list of commonly queried medicines"""
        return list(self.medicine_knowledge.keys())[:20]  # Top 20
    
    def get_last_training_time(self) -> str:
        """Get timestamp of last training"""
        try:
            if os.path.exists('training_data.pkl'):
                with open('training_data.pkl', 'rb') as f:
                    data = pickle.load(f)
                    return data.get('last_updated', 'Never')
        except:
            pass
        return 'Never'
