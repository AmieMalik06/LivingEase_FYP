const axios = require('axios'); 

// Function to call Python API and get recommendations
async function getRecommendations(userInput) {
  try {
    // Send POST request to Python API
    const response = await axios.post('http://localhost:5001/recommend', userInput);  // Updated port to 5001

    // Return the recommendations from the Python API
    return response.data.recommended_properties;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return null;
  }
}

module.exports = { getRecommendations };
