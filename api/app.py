import pickle
import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model and tokenizer (from your notebook)
print("Loading model and tokenizer...")
try:
    model = tf.keras.models.load_model("offensive_language_detection_model.keras")
    print("ML model loaded successfully")
    
    with open("tokenizer.pkl", "rb") as f:
        tokenizer = pickle.load(f)
    print("Tokenizer loaded successfully")
except Exception as e:
    print(f"Error loading model or tokenizer: {e}")
    # Provide fallback if model loading fails
    model = None
    tokenizer = None

# Load foul words from en.txt (this is the word list your notebook uses)
try:
    with open("en.txt", "r", encoding="utf-8") as f:
        foul_words = f.read().splitlines()
    print(f"Loaded {len(foul_words)} words from foul word list")
except Exception as e:
    print(f"Error loading word list: {e}")
    foul_words = []

# This is based on your notebook's function
def contains_offensive_word(text, foul_list):
    """Check if text contains any words from the foul list."""
    words = text.lower().split()
    offensive_words = []
    for w in words:
        w_clean = w.strip('.,!?;:"\'')
        if w_clean in foul_list:
            offensive_words.append(w_clean)
    return offensive_words

# This is based on your notebook's classification function
def classify_text(text, tokenizer, model, foul_list, max_length=100, threshold=0.5):
    """Classify text as offensive or not offensive using both dictionary and model approaches."""
    # Dictionary-based check first (exactly as in your notebook)
    offensive_words = contains_offensive_word(text, foul_list)
    if offensive_words:
        return "offensive", 1.0, offensive_words

    # Only proceed with model prediction if we have a model loaded
    if model is not None and tokenizer is not None:
        # Model-based prediction using your notebook's approach
        seq = tokenizer.texts_to_sequences([text])
        padded_seq = pad_sequences(seq, maxlen=max_length, padding='post', truncating='post')
        # Your model returns a sigmoid activation
        prediction = model.predict(padded_seq)
        prob = float(prediction[0][0])
        
        # Apply threshold (as in your notebook)
        if prob > threshold:
            return "offensive", prob, []
        else:
            return "not offensive", prob, []
    else:
        # Fall back to dictionary-only approach if model isn't loaded
        return "not offensive", 0.0, []

@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    """API endpoint to analyze text for offensive content."""
    if not request.json or 'text' not in request.json:
        return jsonify({'error': 'No text provided'}), 400
    
    text = request.json['text']
    
    # Get threshold from request or use default
    threshold = float(request.json.get('threshold', 0.5))
    
    # Analyze the text using your notebook's logic
    label, probability, offensive_words = classify_text(text, tokenizer, model, foul_words, threshold=threshold)
    
    # Log results for debugging
    print(f"Text: '{text}'")
    print(f"Classification: {label} (probability: {probability:.4f})")
    print(f"Offensive words detected: {offensive_words}")
    
    return jsonify({
        'text': text,
        'label': label,
        'probability': probability,
        'is_offensive': label == "offensive",
        'offensive_words': offensive_words
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("Starting API server...")
    app.run(host='0.0.0.0', port=5000, debug=True)