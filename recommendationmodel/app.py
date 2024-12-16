from flask import Flask, request, jsonify
from flask_cors import CORS  # Importing CORS to allow cross-origin requests
import pickle
import pandas as pd
import numpy as np
from load_model import RecommendationModel  # Import your RecommendationModel class

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})  # Allow all origins for API routes

# Load the pickled model
def load_model(model_path):
    try:
        with open(model_path, 'rb') as model_file:
            model = pickle.load(model_file)
            return model
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return None

# Initialize the recommendation model
model_path = 'recommendation_model.pkl'
model = load_model(model_path)

@app.route('/')
def home():
    return "Welcome to the Property Recommendation API!"

@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        # Get user preferences from the request body
        user_input_preferences = request.json
        print("User Input Preferences app:", user_input_preferences)  # Log the input preferences

        # Use your loaded model to get recommendations
        recommended_property_ids = model.recommend_properties(user_input_preferences)
     
        # Create the response with recommended property IDs in JSON format
        response_data = {'recommendedPropertyIds': recommended_property_ids}
        response = jsonify(response_data), 200
        
        # Console log the JSONified recommended property IDs
        print("JSONified Response sent:", response_data)

        return response
        
    except Exception as e:
        # Log the exception for debugging purposes
        print(f"Error during recommendation: {str(e)}")
        # Return error message in JSON format if an exception occurs
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=8080)  # This binds to all interfaces
    # Set debug to False in production
