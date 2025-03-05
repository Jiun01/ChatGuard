import pickle
import tensorflow as tf
import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model and tokenizer
print("Loading model and tokenizer...")
model = tf.keras.models.load_model("offensive_language_detection_model.keras")

with open("tokenizer.pkl", "rb") as f:
    tokenizer = pickle.load(f)

# Load foul words list for additional context
with open("en.txt", "r", encoding="utf-8") as f:
    foul_words = f.read().splitlines()

def find_offensive_words(text, foul_list):
    """
    Find specific offensive words in the text, but don't use this for classification.
    This is just to provide context about WHICH words might be offensive.
    """
    words = text.lower().split()
    offensive_words = []
    for w in words:
        w_clean = w.strip('.,!?;:"\'')
        if w_clean in foul_list:
            offensive_words.append(w_clean)
    return offensive_words

def classify_text(text, tokenizer, model, foul_list, max_length=100, threshold=0.5):
    """
    Classify text using the ML model as the primary mechanism.
    The word list is only used to provide context about specific words.
    """
    # Primary classification using the model
    seq = tokenizer.texts_to_sequences([text])
    padded_seq = pad_sequences(seq, maxlen=max_length, padding='post', truncating='post')
    
    # Get prediction probability
    prediction = model.predict(padded_seq)
    prob = float(prediction[0][0])
    
    # Determine classification based on threshold
    is_offensive = prob > threshold
    label = "offensive" if is_offensive else "not offensive"
    
    # Find specific offensive words for context only if the model says it's offensive
    offensive_words = []
    if is_offensive:
        offensive_words = find_offensive_words(text, foul_list)
    
    return label, prob, offensive_words, is_offensive

@app.route('/api/analyze', methods=['POST'])
def analyze_text():
    """API endpoint to analyze text for offensive content."""
    if not request.json or 'text' not in request.json:
        return jsonify({'error': 'No text provided'}), 400
    
    text = request.json['text']
    
    # Get threshold from request or use default
    threshold = float(request.json.get('threshold', 0.5))
    
    label, probability, offensive_words, is_offensive = classify_text(text, tokenizer, model, foul_words, threshold=threshold)
    
    # Print what the model is detecting for debugging
    print(f"Text: '{text}'")
    print(f"Classification: {label} (probability: {probability:.4f})")
    print(f"Offensive words detected: {offensive_words}")
    
    return jsonify({
        'text': text,
        'label': label,
        'probability': probability,
        'is_offensive': is_offensive,
        'offensive_words': offensive_words
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    print("Starting API server...")
    app.run(host='0.0.0.0', port=5000, debug=True)