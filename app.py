from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS to allow requests from your frontend

# Initialize Firebase Admin SDK
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

@app.route('/generate-recipe', methods=['POST'])
def generate_recipe():
    data = request.json
    print("Received request:", data)

    user_id = data.get('userId')  # Expecting userId from frontend
    ingredients = data.get('ingredients')
    diet = data.get('diet')

    if not user_id:
        return jsonify({"error": "Missing userId"}), 400

    # Fetch user profile from Firestore
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        return jsonify({"error": "User not found"}), 404

    user_profile = user_doc.to_dict()

    # Create prompt for Gemini API
    user_diet = diet or user_profile.get('preferences', {}).get('diet', '')
    prompt = f"Create a {user_diet} recipe using {ingredients}. User preferences: {user_profile.get('preferences', {})}"

    # Call Gemini API (dummy example, you need to replace with working API key)
    gemini_api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f''  # Replace with your API Key
    }
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    response = requests.post(gemini_api_url, json=payload, headers=headers)
    
    if response.status_code != 200:
        print("Gemini API Error:", response.text)
        return jsonify({"error": "Failed to fetch recipe from Gemini API"}), 500

    gemini_data = response.json()

    # Extract recipe
    recipe = gemini_data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', 'No recipe found')

    return jsonify({"recipe": recipe})

if __name__ == '__main__':
    app.run(debug=True)
