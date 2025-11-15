import os
import json
import torch
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from model_trainer import MediBotTrainer
from inference_engine import MediBotInference

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize the trainer and inference engine
trainer = MediBotTrainer()
inference_engine = MediBotInference()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "MediBot Python backend is running"})

@app.route('/train', methods=['POST'])
def train_model():
    """Train the model with new conversation data"""
    try:
        data = request.json
        conversations = data.get('conversations', [])
        
        if not conversations:
            return jsonify({"error": "No conversation data provided"}), 400
        
        # Process and train on the conversations
        training_results = trainer.train_on_conversations(conversations)
        
        return jsonify({
            "status": "success",
            "message": "Model training completed",
            "results": training_results
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate_thinking', methods=['POST'])
def generate_thinking():
    """Generate thinking process for a medicine query"""
    try:
        data = request.json
        medicine = data.get('medicine', '')
        context = data.get('context', '')
        quick_action = data.get('quick_action', '')
        
        if not medicine:
            return jsonify({"error": "Medicine name is required"}), 400
        
        # Generate thinking process using trained model
        thinking_process = inference_engine.generate_thinking(
            medicine=medicine,
            context=context,
            quick_action=quick_action
        )
        
        return jsonify({
            "thinking": thinking_process,
            "confidence": inference_engine.get_confidence_score(),
            "model_version": inference_engine.get_model_version()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/generate_response', methods=['POST'])
def generate_response():
    """Generate full medicine response with thinking"""
    try:
        data = request.json
        medicine = data.get('medicine', '')
        thinking = data.get('thinking', '')
        quick_action = data.get('quick_action', '')
        
        if not medicine:
            return jsonify({"error": "Medicine name is required"}), 400
        
        # Generate complete response
        response = inference_engine.generate_complete_response(
            medicine=medicine,
            thinking=thinking,
            quick_action=quick_action
        )
        
        return jsonify({
            "response": response,
            "thinking": thinking or inference_engine.last_thinking,
            "confidence": inference_engine.get_confidence_score()
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/feedback', methods=['POST'])
def process_feedback():
    """Process user feedback to improve the model"""
    try:
        data = request.json
        conversation_id = data.get('conversation_id')
        feedback_type = data.get('type')  # 'positive', 'negative', 'correction'
        feedback_data = data.get('data', {})
        
        # Store feedback for future training
        trainer.add_feedback(conversation_id, feedback_type, feedback_data)
        
        return jsonify({
            "status": "success",
            "message": "Feedback recorded successfully"
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/model_stats', methods=['GET'])
def get_model_stats():
    """Get current model statistics and performance metrics"""
    try:
        stats = {
            "model_version": inference_engine.get_model_version(),
            "training_examples": trainer.get_training_count(),
            "accuracy_metrics": trainer.get_accuracy_metrics(),
            "thinking_patterns": trainer.get_thinking_patterns(),
            "common_medicines": trainer.get_common_medicines(),
            "model_size": inference_engine.get_model_size(),
            "last_training": trainer.get_last_training_time()
        }
        
        return jsonify(stats)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/retrain', methods=['POST'])
def retrain_model():
    """Retrain the model with accumulated feedback"""
    try:
        # Retrain using accumulated feedback and conversations
        results = trainer.retrain_with_feedback()
        
        # Reload the inference engine with new model
        inference_engine.reload_model()
        
        return jsonify({
            "status": "success",
            "message": "Model retrained successfully",
            "results": results
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    app.run(host='0.0.0.0', port=port, debug=debug)
