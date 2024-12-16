import pandas as pd
import numpy as np
import pickle
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity
from pymongo import MongoClient

class RecommendationModel:
    def __init__(self, properties_df):
        self.properties_df = properties_df
        self.encoder = OneHotEncoder(handle_unknown='ignore')
        self._prepare_data()

    def _prepare_data(self):
        # Ensure required columns exist and are correctly formatted
        required_columns = ['category', 'location', 'rentPrice', 'propertySize']
        if not all(col in self.properties_df.columns for col in required_columns):
            raise ValueError("DataFrame must contain 'category', 'location', 'rentPrice', and 'propertySize' columns.")

        # Fit the encoder on the relevant columns and handle categorical data
        self.encoder.fit(self.properties_df[['category', 'location']])

        # Create combined features DataFrame for the properties
        combined_categories = self.encoder.transform(self.properties_df[['category', 'location']]).toarray()
        numerical_features = self.properties_df[['rentPrice', 'propertySize']].values
        self.combined_df = np.concatenate([numerical_features, combined_categories], axis=1)

    def recommend_properties(self, user_preferences, top_n=5):
        # Default values based on the properties DataFrame
        defaults = {
            'rentPrice': self.properties_df['rentPrice'].mean(),
            'propertySize': self.properties_df['propertySize'].mean(),
            'category': self.properties_df['category'].mode()[0],
            'location': self.properties_df['location'].mode()[0],
            'latitude': self.properties_df['latitude'].mean() if 'latitude' in self.properties_df else 0,
            'longitude': self.properties_df['longitude'].mean() if 'longitude' in self.properties_df else 0
        }

        # Fill missing preferences with defaults
        for key, value in defaults.items():
            user_preferences.setdefault(key, value)

        # Calculate average values for user preferences
        user_data = {
            'rentPrice': user_preferences.get('minRentPrice', 0) +
                         (user_preferences.get('maxRentPrice', 0) - user_preferences.get('minRentPrice', 0)) / 2,
            'propertySize': user_preferences.get('minPropertySize', 0) +
                            (user_preferences.get('maxPropertySize', 0) - user_preferences.get('minPropertySize', 0)) / 2,
            'category': user_preferences.get('category', defaults['category']),
            'location': user_preferences.get('location', defaults['location']),
            'latitude': user_preferences.get('latitude', defaults['latitude']),
            'longitude': user_preferences.get('longitude', defaults['longitude']),
            'distance': user_preferences.get('distance', 10)  # Default distance if not provided
        }

        # Log user data after default values applied
        print("User Data Prepared:\n", user_data)

        user_preferences_df = pd.DataFrame([user_data])

        # One-hot encode categorical features in user preferences
        user_categorical = self.encoder.transform(user_preferences_df[['category', 'location']]).toarray()
        user_numerical = user_preferences_df[['rentPrice', 'propertySize']].values
        user_combined_features = np.concatenate([user_numerical, user_categorical], axis=1)

        

        # Compute cosine similarity between user preferences and all properties
        user_similarity = cosine_similarity(user_combined_features, self.combined_df)
        

        # Get top N similar properties
        similar_indices = user_similarity.argsort()[0][-top_n:][::-1]
        recommended_properties = self.properties_df.iloc[similar_indices]
        recommended_ids = recommended_properties['_id'].astype(str).tolist()

        # Print recommended properties with their IDs
        print("Recommended Property IDs:", recommended_ids)
        return recommended_ids


def load_model(model_path):
    with open(model_path, 'rb') as model_file:
        model = pickle.load(model_file)
    return model

def load_properties_from_db(mongo_uri, db_name, collection_name):
    client = MongoClient(mongo_uri)
    db = client[db_name]
    collection = db[collection_name]
    
    properties = list(collection.find())
    return pd.DataFrame(properties)

if __name__ == "__main__":
    # Load properties data from MongoDB
    mongo_uri = 'mongodb+srv://elsa:elsa@cluster0.4pnu7wx.mongodb.net/'  # Replace with your MongoDB connection string
    db_name = 'test'  # Replace with your database name
    collection_name = 'properties'  # Replace with your collection name

    properties_df = load_properties_from_db(mongo_uri, db_name, collection_name)
    print("Properties DataFrame in Flask:\n", properties_df.head())

    # Load the saved model
    model_path = 'recommendation_model.pkl'
    model = load_model(model_path)
    print("Model Encoder Loaded in Flask:\n", model.encoder)
    print("Combined DataFrame Loaded in Flask:\n", model.combined_df[:5])  # Show first 5 rows

    # Update the properties DataFrame in the model and reinitialize
    model.properties_df = properties_df
    model._prepare_data()  # Reinitialize with updated properties data

    # Example user preferences
    user_preferences = {
        "minRentPrice": 500,
        "maxRentPrice": 1500,
        "minPropertySize": 1000,
        "maxPropertySize": 3000,
        "category": "Residential",
        "location": "Downtown",
        "latitude": 72.9744022,
        "longitude": 33.6992161,
    }

    # Get recommendations based on user preferences
    recommendations = model.recommend_properties(user_preferences)
    print("Recommendations:", recommendations)
