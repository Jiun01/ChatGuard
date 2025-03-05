const API_URL = 'http://localhost:5000/api'; // Change this to your deployed API URL in production

/**
 * Service to handle API calls to the backend
 */
export default {
  /**
   * Analyze text for offensive content
   * @param {string} text - The text to analyze
   * @param {number} threshold - Threshold for classification (0.0 to 1.0)
   * @returns {Promise} - Promise with the analysis result
   */
  async analyzeText(text, threshold = 0.5) {
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, threshold }),
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error analyzing text:', error);
      throw error;
    }
  },
  
  /**
   * Check API health
   * @returns {Promise} - Promise with health status
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_URL}/health`);
      
      if (!response.ok) {
        throw new Error(`API health check failed: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API health check error:', error);
      throw error;
    }
  }
};