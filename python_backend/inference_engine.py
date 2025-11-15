import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import json
import os
import re
from typing import Dict, List, Optional
import numpy as np

class MediBotInference:
    def __init__(self, model_path="./medibot_model"):
        self.model_path = model_path
        self.confidence_score = 0.0
        self.last_thinking = ""
        
        # Load model and tokenizer
        self.load_model()
        
        # Medicine safety patterns
        self.safety_patterns = {
            'emergency_keywords': [
                'overdose', 'chest pain', 'difficulty breathing', 'severe allergic reaction',
                'fainting', 'seizure', 'severe bleeding', 'unconscious'
            ],
            'caution_keywords': [
                'pregnancy', 'breastfeeding', 'children', 'elderly', 'kidney disease',
                'liver disease', 'heart condition', 'diabetes'
            ]
        }
        
        # Thinking templates
        self.thinking_templates = {
            'general': "Let me think about {medicine}... I need to consider what this medication is used for, how it works, potential side effects, and important safety information.",
            'uses': "The user is asking about the uses of {medicine}. I should think about the primary indications, mechanism of action, and therapeutic applications.",
            'side_effects': "They want to know about side effects of {medicine}. I need to consider both common and serious adverse reactions.",
            'interactions': "This is about drug interactions with {medicine}. I should think about major drug-drug interactions and contraindications.",
            'precautions': "They're asking about precautions for {medicine}. I need to consider special populations and safety warnings.",
            'how_to_take': "This is about dosing and administration of {medicine}. I should focus on general administration guidelines without specific dosing."
        }
    
    def load_model(self):
        """Load the trained model and tokenizer"""
        try:
            if os.path.exists(self.model_path):
                self.tokenizer = AutoTokenizer.from_pretrained(self.model_path)
                self.model = AutoModelForCausalLM.from_pretrained(self.model_path)
                print(f"Loaded trained model from {self.model_path}")
            else:
                # Fallback to base model
                self.tokenizer = AutoTokenizer.from_pretrained("microsoft/DialoGPT-medium")
                self.model = AutoModelForCausalLM.from_pretrained("microsoft/DialoGPT-medium")
                print("Using base DialoGPT model - no trained model found")
                
            self.model.eval()
            
        except Exception as e:
            print(f"Error loading model: {e}")
            # Fallback to base model
            self.tokenizer = AutoTokenizer.from_pretrained("microsoft/DialoGPT-medium")
            self.model = AutoModelForCausalLM.from_pretrained("microsoft/DialoGPT-medium")
    
    def generate_thinking(self, medicine: str, context: str = "", quick_action: str = "") -> str:
        """Generate thinking process for a medicine query"""
        # Determine thinking template based on quick_action
        template_key = 'general'
        if quick_action:
            action_lower = quick_action.lower()
            if 'use' in action_lower:
                template_key = 'uses'
            elif 'side effect' in action_lower:
                template_key = 'side_effects'
            elif 'interaction' in action_lower:
                template_key = 'interactions'
            elif 'precaution' in action_lower:
                template_key = 'precautions'
            elif 'take' in action_lower:
                template_key = 'how_to_take'
        
        # Generate base thinking
        base_thinking = self.thinking_templates[template_key].format(medicine=medicine)
        
        # Add safety considerations
        safety_thinking = self.generate_safety_thinking(medicine, quick_action)
        
        # Combine thinking
        full_thinking = f"{base_thinking} {safety_thinking}"
        
        # Use model to enhance thinking if available
        enhanced_thinking = self.enhance_thinking_with_model(medicine, full_thinking, quick_action)
        
        self.last_thinking = enhanced_thinking
        return enhanced_thinking
    
    def generate_safety_thinking(self, medicine: str, quick_action: str = "") -> str:
        """Generate safety-focused thinking"""
        safety_thoughts = []
        
        # Check for emergency keywords
        medicine_lower = medicine.lower()
        action_lower = quick_action.lower() if quick_action else ""
        
        for keyword in self.safety_patterns['emergency_keywords']:
            if keyword in medicine_lower or keyword in action_lower:
                safety_thoughts.append("This could involve emergency symptoms - I need to emphasize seeking immediate medical attention.")
                break
        
        # Check for caution keywords
        for keyword in self.safety_patterns['caution_keywords']:
            if keyword in medicine_lower or keyword in action_lower:
                safety_thoughts.append(f"I should mention special considerations for {keyword}.")
        
        # Always include general safety reminder
        safety_thoughts.append("I must remind them this is general information and they should consult a healthcare provider.")
        
        return " ".join(safety_thoughts)
    
    def enhance_thinking_with_model(self, medicine: str, base_thinking: str, quick_action: str = "") -> str:
        """Use the trained model to enhance thinking process"""
        try:
            # Prepare input for model
            input_text = f"<medicine>{medicine}</medicine><action>{quick_action}</action><think>"
            
            # Tokenize input
            inputs = self.tokenizer.encode(input_text, return_tensors="pt")
            
            # Generate thinking
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_length=inputs.shape[1] + 100,
                    num_return_sequences=1,
                    temperature=0.7,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode output
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=False)
            
            # Extract thinking part
            if "<think>" in generated_text:
                thinking_part = generated_text.split("<think>")[1]
                if "</think>" in thinking_part:
                    thinking_part = thinking_part.split("</think>")[0]
                
                # Combine with base thinking
                if thinking_part.strip() and len(thinking_part.strip()) > 20:
                    enhanced = f"{base_thinking} {thinking_part.strip()}"
                    self.confidence_score = 0.8
                    return enhanced
            
        except Exception as e:
            print(f"Error enhancing thinking with model: {e}")
        
        # Fallback to base thinking
        self.confidence_score = 0.6
        return base_thinking
    
    def generate_complete_response(self, medicine: str, thinking: str = "", quick_action: str = "") -> str:
        """Generate complete medicine response"""
        if not thinking:
            thinking = self.generate_thinking(medicine, quick_action=quick_action)
        
        # Try to generate response with model
        model_response = self.generate_response_with_model(medicine, thinking, quick_action)
        
        if model_response:
            return model_response
        
        # Fallback to template-based response
        return self.generate_template_response(medicine, quick_action)
    
    def generate_response_with_model(self, medicine: str, thinking: str, quick_action: str = "") -> Optional[str]:
        """Generate response using the trained model"""
        try:
            # Prepare input
            input_text = f"<medicine>{medicine}</medicine><think>{thinking}</think>"
            
            # Tokenize
            inputs = self.tokenizer.encode(input_text, return_tensors="pt")
            
            # Generate response
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_length=inputs.shape[1] + 300,
                    num_return_sequences=1,
                    temperature=0.5,
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id
                )
            
            # Decode
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Extract response part (after thinking)
            if thinking in generated_text:
                response_part = generated_text.split(thinking)[1].strip()
                if len(response_part) > 50:  # Ensure substantial response
                    self.confidence_score = 0.85
                    return self.format_response(response_part, medicine)
            
        except Exception as e:
            print(f"Error generating response with model: {e}")
        
        return None
    
    def generate_template_response(self, medicine: str, quick_action: str = "") -> str:
        """Generate template-based response as fallback"""
        self.confidence_score = 0.4
        
        response = f"**{medicine.title()}**\n\n"
        
        if quick_action:
            if 'use' in quick_action.lower():
                response += f"• **What it's used for:** {medicine} is commonly prescribed for various medical conditions. Please consult a healthcare provider for specific uses.\n\n"
            elif 'side effect' in quick_action.lower():
                response += f"• **Common side effects:** Like all medications, {medicine} may cause side effects. Common ones may include nausea, dizziness, or headache.\n"
                response += f"• **Serious side effects:** Contact your doctor immediately if you experience severe reactions.\n\n"
            elif 'interaction' in quick_action.lower():
                response += f"• **Interactions:** {medicine} may interact with other medications, alcohol, or certain foods. Always inform your healthcare provider about all medications you're taking.\n\n"
            elif 'precaution' in quick_action.lower():
                response += f"• **Precautions:** Special care may be needed for pregnant women, children, elderly patients, or those with kidney/liver conditions.\n\n"
            elif 'take' in quick_action.lower():
                response += f"• **How to take:** Follow your healthcare provider's instructions exactly. Take as prescribed and complete the full course if applicable.\n\n"
        else:
            response += "• **What it's used for:** Please consult a healthcare provider for specific information about this medication.\n"
            response += "• **How it works:** This medication works through specific mechanisms that your doctor can explain.\n"
            response += "• **How to take:** Always follow your healthcare provider's instructions.\n"
            response += "• **Side effects:** All medications can have side effects. Discuss these with your doctor.\n"
            response += "• **Precautions:** Special considerations may apply to your situation.\n\n"
        
        response += "**Important:** This is general information only. Please consult a doctor before taking or stopping any medicine."
        
        return response
    
    def format_response(self, response: str, medicine: str) -> str:
        """Format and clean up the generated response"""
        # Clean up the response
        response = response.strip()
        
        # Ensure it starts with medicine name if not already
        if not response.startswith(f"**{medicine}"):
            response = f"**{medicine.title()}**\n\n{response}"
        
        # Ensure safety disclaimer
        if "consult a doctor" not in response.lower():
            response += "\n\n**Important:** This is general information only. Please consult a doctor before taking or stopping any medicine."
        
        return response
    
    def get_confidence_score(self) -> float:
        """Get confidence score for last generation"""
        return self.confidence_score
    
    def get_model_version(self) -> str:
        """Get current model version"""
        if os.path.exists(self.model_path):
            return "trained_v1.0"
        return "base_model"
    
    def get_model_size(self) -> str:
        """Get model size information"""
        try:
            if hasattr(self.model, 'num_parameters'):
                params = self.model.num_parameters()
                return f"{params / 1e6:.1f}M parameters"
            return "Unknown size"
        except:
            return "Unknown size"
    
    def reload_model(self):
        """Reload the model (after retraining)"""
        self.load_model()
