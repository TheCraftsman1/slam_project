/**
 * EcoSense Peak Knowledge Base
 * This utility provides deep contextual information about the app and its environment.
 */

export interface KnowledgeTopic {
  id: string;
  keywords: string[];
  response: string;
  suggestedFollowUp?: string[];
}

export const ECO_KNOWLEDGE: KnowledgeTopic[] = [
  {
    id: 'naqi',
    keywords: ['naqi', 'national aqi', 'indian aqi', 'calibration', 'difference'],
    response: "EcoSense uses the official Indian National AQI (NAQI) scale. Unlike global satellite models that can be 'optimistic', we apply a 1.8x Indian Ground Calibration factor to ensure our readings match the real-world sensors used by the CPCB and Google Maps.",
    suggestedFollowUp: ["How is NAQI calculated?", "Why is my AQI different?"]
  },
  {
    id: 'iare',
    keywords: ['iare', 'college', 'campus', '5th block', 'institute of aeronautical engineering'],
    response: "IARE (Institute of Aeronautical Engineering) is our primary focus zone. We have high-resolution data for the 5th Block and surrounding campus areas. I can help you monitor air quality specifically for outdoor labs and student zones.",
    suggestedFollowUp: ["Show IARE on map", "Is air safe at IARE?"]
  },
  {
    id: 'health_poor',
    keywords: ['mask', 'unhealthy', 'bad air', 'pollution', 'n95'],
    response: "When the AQI is above 100 (Satisfactory/Moderate), sensitive groups should reduce outdoor exertion. If it exceeds 200, an N95 or N99 mask is essential. For our students, we recommend staying in the air-conditioned labs during peak smog hours.",
    suggestedFollowUp: ["Which mask is best?", "Indoor air tips"]
  },
  {
    id: 'exercise',
    keywords: ['run', 'exercise', 'outdoor', 'gym', 'workout'],
    response: "For optimal health, try to exercise when the NAQI is below 50. In Hyderabad and near Dundigal, this is typically early morning between 5 AM and 7 AM or late evening after 9 PM when vehicular dust settles.",
    suggestedFollowUp: ["Current exercise safety", "Weekly air forecast"]
  },
  {
    id: 'app_features',
    keywords: ['features', 'what can you do', 'dual theme', 'theme'],
    response: "EcoSense is a premium air quality monitor featuring a dual-theme system (Charcoal & Organic), real-time NAQI mapping, and me—your AI assistant! You can toggle themes in the Profile screen.",
    suggestedFollowUp: ["Switch to Dark mode", "How to use the map?"]
  }
];

/**
 * Finds the most relevant knowledge response based on user query
 */
export function getKnowledgeFallback(query: string): string | null {
  const lowered = query.toLowerCase();
  
  // Rank topics by keyword matches
  const ranked = ECO_KNOWLEDGE.map(topic => {
    const matches = topic.keywords.filter(kw => lowered.includes(kw)).length;
    return { ...topic, matches };
  }).filter(t => t.matches > 0)
    .sort((a, b) => b.matches - a.matches);

  return ranked.length > 0 ? ranked[0].response : null;
}
