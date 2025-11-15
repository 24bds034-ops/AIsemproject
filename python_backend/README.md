# MediBot Python Training Backend

This Python backend trains a machine learning model to think and respond like MediBot by learning from conversation patterns.

## Features

- **Model Training**: Trains a transformer model on MediBot conversations
- **Thinking Process Learning**: Learns to generate thinking processes like the original MediBot
- **Safety-First Approach**: Incorporates medical safety patterns and warnings
- **Feedback Integration**: Learns from user feedback to improve responses
- **REST API**: Provides endpoints for training and inference

## Setup

1. **Install Dependencies**:
```bash
pip install -r requirements.txt
```

2. **Environment Variables**:
Create a `.env` file:
```
DEBUG=True
PORT=5000
CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_API_KEY=your-api-key
```

3. **Run Training**:
```bash
# Train on sample data
python train_script.py --data-source sample

# Train on your Convex data
python train_script.py --data-source convex --convex-url https://your-deployment.convex.cloud

# Train on custom data file
python train_script.py --data-source file --data-file conversations.json
```

4. **Start API Server**:
```bash
python app.py
```

## API Endpoints

### Training Endpoints

- `POST /train` - Train model with conversation data
- `POST /retrain` - Retrain with accumulated feedback
- `POST /feedback` - Submit feedback for future training

### Inference Endpoints

- `POST /generate_thinking` - Generate thinking process for a medicine query
- `POST /generate_response` - Generate complete response with thinking
- `GET /model_stats` - Get model performance statistics

### Health Check

- `GET /health` - Check if the service is running

## Usage Examples

### Training the Model

```python
import requests

# Send conversation data for training
conversations = [
    {
        "userId": "user1",
        "messages": [
            {"role": "user", "content": "What is aspirin?"},
            {"role": "thinking", "content": "Let me think about aspirin..."},
            {"role": "assistant", "content": "Aspirin is a medication..."}
        ]
    }
]

response = requests.post('http://localhost:5000/train', 
                        json={'conversations': conversations})
print(response.json())
```

### Generating Thinking Process

```python
response = requests.post('http://localhost:5000/generate_thinking', 
                        json={
                            'medicine': 'ibuprofen',
                            'quick_action': 'side effects'
                        })
thinking = response.json()['thinking']
```

### Getting Model Statistics

```python
response = requests.get('http://localhost:5000/model_stats')
stats = response.json()
print(f"Model version: {stats['model_version']}")
print(f"Training examples: {stats['training_examples']}")
```

## Model Architecture

The system uses a fine-tuned transformer model (DialoGPT) with:

- **Special Tokens**: `<think>`, `</think>`, `<medicine>`, `</medicine>`, etc.
- **Safety Patterns**: Built-in medical safety checks and warnings
- **Thinking Templates**: Structured thinking process templates
- **Feedback Loop**: Continuous learning from user interactions

## Data Format

Conversations should follow this format:

```json
{
  "userId": "user123",
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
      "content": "Let me think about aspirin...",
      "timestamp": 1640995205000,
      "isComplete": true
    },
    {
      "id": "msg3",
      "role": "assistant", 
      "content": "**Aspirin** is a medication...",
      "timestamp": 1640995210000
    }
  ]
}
```

## Safety Features

- **Emergency Detection**: Identifies emergency keywords and emphasizes immediate medical attention
- **Caution Patterns**: Recognizes high-risk situations (pregnancy, children, etc.)
- **Disclaimer Enforcement**: Always includes medical disclaimers
- **Safety-First Training**: Prioritizes safety in all generated responses

## Performance Monitoring

The system tracks:
- Training accuracy metrics
- Thinking pattern quality
- Response coherence scores
- Safety compliance rates
- User feedback sentiment

## Integration with Convex

To integrate with your existing Convex MediBot:

1. **Data Collection**: Use `data_collector.py` to fetch conversations from Convex
2. **Training**: Run training script with your conversation data
3. **API Integration**: Call the Python backend from your Convex actions for enhanced thinking

Example Convex integration:

```typescript
// In your Convex action
const pythonResponse = await fetch('http://localhost:5000/generate_thinking', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    medicine: args.medicine,
    quick_action: args.quickAction
  })
});

const { thinking } = await pythonResponse.json();
```

## Development

- **Model Training**: Modify `model_trainer.py` for different training strategies
- **Inference Logic**: Update `inference_engine.py` for response generation
- **API Endpoints**: Add new endpoints in `app.py`
- **Safety Patterns**: Update safety rules in `inference_engine.py`

## Deployment

For production deployment:

1. Use a proper WSGI server (gunicorn)
2. Set up GPU support for faster training/inference
3. Implement proper authentication and rate limiting
4. Use a database for storing training data and feedback
5. Set up monitoring and logging

```bash
# Production deployment
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```
