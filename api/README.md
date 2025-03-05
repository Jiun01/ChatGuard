# ChatGuard API

This is the REST API backend for the ChatGuard Chrome extension.

## Setup

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the API:
   ```
   python app.py
   ```

The API will be available at http://localhost:5000

## Endpoints

- `POST /api/analyze` - Analyze text for offensive content
  - Request body: `{ "text": "text to analyze", "threshold": 0.5 }`
  - Response: `{ "text": "text to analyze", "label": "offensive" or "not offensive", "probability": 0.xx, "is_offensive": true or false }`

- `GET /api/health` - Health check
  - Response: `{ "status": "ok" }`
