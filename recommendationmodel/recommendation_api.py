import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity
import pymongo
from bson import ObjectId
from flask import Flask, request, jsonify
from math import radians, cos, sin, sqrt, atan2

# Flask setup
app = Flask(__name__)

# MongoDB setup
client = pymongo.MongoClient("mongodb+srv://elsa:elsa@cluster0.4pnu7wx.mongodb.net/")
db = client['test']
properties_collection = db['properties']

# Load properties and prepare DataFrame
properties_data = list(properties_collection.find({}))
for property in properties_data:
    property['_id'] = str(property['_id'])  # Convert ObjectId to string
properties_df = pd.DataFrame(properties_data)

# Recommendation Model
class RecommendationModel:
    def __init__(self, properties_df):
        self.properties_df = properties_df
        self.encoder = OneHotEncoder(handle_unknown='ignore')
        self._prepare_data()

    def _prepare_data(self):
        # Ensure categorical features are of type str
        self.properties_df['category'] = self.properties_df['category'].astype(str)
        self.properties_df['location'] = self.properties_df['location'].astype(str)
        # Convert other fields to numeric types
        self.properties_df['rentPrice'] = pd.to_numeric(self.properties_df['rentPrice'], errors='coerce')
        self.properties_df['propertySize'] = pd.to_numeric(self.properties_df['propertySize'], errors='coerce')
        self.properties_df['latitude'] = pd.to_numeric(self.properties_df['latitude'], errors='coerce')
        self.properties_df['longitude'] = pd.to_numeric(self.properties_df['longitude'], errors='coerce')
        # Drop rows with NaN values in essential columns
        self.properties_df.dropna(subset=['rentPrice', 'propertySize', 'latitude', 'longitude'], inplace=True)
        # Fit the encoder on relevant columns
        self.encoder.fit(self.properties_df[['category', 'location']])
        # Prepare features
        numerical_features = self.properties_df[['rentPrice', 'propertySize']].values
        combined_categories = self.encoder.transform(self.properties_df[['category', 'location']]).toarray()
        self.combined_df = np.concatenate([numerical_features, combined_categories], axis=1)

    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        R = 6371  # Radius of the Earth in kilometers
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat / 2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2)**2
        c = 2 * atan2(sqrt(a), sqrt(1 - a))
        distance = R * c
        return distance

    def recommend_properties(self, user_preferences, top_n=5):
        # Default values
        defaults = {
            'rentPrice': self.properties_df['rentPrice'].mean(),
            'propertySize': self.properties_df['propertySize'].mean(),
            'category': self.properties_df['category'].mode()[0],
            'location': self.properties_df['location'].mode()[0],
            'latitude': self.properties_df['latitude'].mean(),
            'longitude': self.properties_df['longitude'].mean(),
            'distance': 5  # Default max distance in km
        }
        # Fill missing preferences
        for key, value in defaults.items():
            user_preferences.setdefault(key, value)
        # Filter properties within the specified distance
        user_lat, user_lon, max_distance = user_preferences['latitude'], user_preferences['longitude'], user_preferences['distance']
        self.properties_df['distance'] = self.properties_df.apply(
            lambda row: self._calculate_distance(user_lat, user_lon, row['latitude'], row['longitude']),
            axis=1
        )
        nearby_properties = self.properties_df[self.properties_df['distance'] <= max_distance]
        if nearby_properties.empty:
            return []
        # Prepare features for similarity calculation
        combined_categories = self.encoder.transform(nearby_properties[['category', 'location']]).toarray()
        numerical_features = nearby_properties[['rentPrice', 'propertySize']].values
        combined_df = np.concatenate([numerical_features, combined_categories], axis=1)
        user_data = {
            'rentPrice': (user_preferences.get('minRentPrice', 0) + user_preferences.get('maxRentPrice', 0)) / 2,
            'propertySize': (user_preferences.get('minPropertySize', 0) + user_preferences.get('maxPropertySize', 0)) / 2,
            'category': user_preferences['category'],
            'location': user_preferences['location']
        }
        user_preferences_df = pd.DataFrame([user_data])
        user_categorical = self.encoder.transform(user_preferences_df[['category', 'location']]).toarray()
        user_numerical = user_preferences_df[['rentPrice', 'propertySize']].values
        user_combined_features = np.concatenate([user_numerical, user_categorical], axis=1)
        user_similarity = cosine_similarity(user_combined_features, combined_df)
        similar_indices = user_similarity.argsort()[0][-top_n:][::-1]
        recommended_properties = nearby_properties.iloc[similar_indices]
        return recommended_properties['_id'].tolist()

model = RecommendationModel(properties_df)

@app.route('/recommends', methods=['POST'])
def recommend():
    user_preferences = request.json
    recommendations = model.recommend_properties(user_preferences)
    print("API Recommendations:", recommendations)  # Debugging line
    return jsonify(recommendations)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081,  debug=True)
