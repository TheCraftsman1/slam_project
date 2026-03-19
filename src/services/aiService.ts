import type { AqiStation } from '../types';
import { BACKEND_URL } from '../utils/config';

export interface AiInsightState {
  loading: boolean;
  text: string | null;
}

export async function fetchAiInsight(
  station: AqiStation,
  signal: AbortSignal,
  onUpdate: (state: AiInsightState) => void,
  cache: Map<string, string>
): Promise<string> {
  const cacheKey = `${station.id}:${station.aqi}`;
  const cachedInsight = cache.get(cacheKey);
  if (cachedInsight) {
    return cachedInsight;
  }

  onUpdate({ loading: true, text: null });

  try {
    const resp = await fetch(`${BACKEND_URL}/api/ask-ecobot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({
        user_voice_text: "Give one short, specific safety insight for this spot.",
        current_aqi: station.aqi,
        location: station.name,
        latitude: station.lat,
        longitude: station.lng,
        response_style: 'map_fast'
      })
    });

    if (resp.ok) {
      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream reader');

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
              onUpdate({ loading: true, text: fullReply });
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }

      const finalText = fullReply || `AQI in ${station.name} is ${station.aqi}.`;
      cache.set(cacheKey, finalText);
      return finalText;
    } else {
      throw new Error('API error');
    }
  } catch {
    // Offline fallback
    let advice = "";
    if (station.aqi > 150) advice = `Air in ${station.name} is unhealthy. Avoid outdoor activity and wear an N95 mask.`;
    else if (station.aqi > 100) advice = `${station.name} has moderate-to-poor air. Sensitive groups limit exertion.`;
    else if (station.aqi > 50) advice = `Air quality is acceptable. Light outdoor activity is fine.`;
    else advice = `Excellent air quality in ${station.name}! AI local server is offline, but it looks safe.`;
    return advice;
  }
}
