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

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No stream reader');
    }

    const decoder = new TextDecoder('utf-8');
    let fullReply = '';
    let isDone = false;

    while (!isDone) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const dataStr = line.slice(6);
        if (dataStr === '[DONE]') {
          isDone = true;
          break;
        }
        try {
          const parsed = JSON.parse(dataStr);
          if (parsed?.text) {
            fullReply += parsed.text;
          }
        } catch {
          // Ignore malformed lines
        }
      }
    }

    return fullReply;
  } catch (error) {
    console.error("Error talking to backend AI: ", error);
    return "Sorry, I couldn't reach the AI server. Make sure your laptop and phone are on the same WiFi.";
  }
};
