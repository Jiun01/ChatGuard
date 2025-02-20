import pickle

# 1. Load the tokenizer
with open("tokenizer.pkl", "rb") as f:
    tokenizer = pickle.load(f)

import tensorflow as tf
from tensorflow.keras.preprocessing.sequence import pad_sequences

# 2. Load the model
model = tf.keras.models.load_model("offensive_language_detection_model.keras")

# 3. Define your classification function
def classify_text(text, tokenizer, model, max_length=100):
    sequences = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(sequences, maxlen=max_length, padding='post', truncating='post')
    prediction = model.predict(padded)[0][0]  # single sigmoid
    return "offensive" if prediction > 0.5 else "not offensive"

# 4. Test with sample sentences
test_sentences = [
    "Hello friend, how are you?",
    "You are so dumb",
    "This is a test product"
]

for s in test_sentences:
    label = classify_text(s, tokenizer, model)
    print(f"Text: {s} -> {label}")