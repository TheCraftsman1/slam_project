// This service will handle communication between your phone and your laptop's Python server

// Replace with your laptop's actual local IP address (e.g., 192.168.1.15)
const BACKEND_URL = 'http://192.168.X.X:8000';

export const askEcoBot = async (voiceText, aqi, location) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/ask-ecobot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_voice_text: voiceText,
        current_aqi: aqi,
        location: location
      }),
    });
    
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error("Error talking to backend AI: ", error);
    return "Sorry, I couldn't reach the AI server. Make sure your laptop and phone are on the same WiFi.";
  }
};
