import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Mic, MicOff, Send, Bot, User, Sparkles, Volume2, VolumeX, Wifi, WifiOff, Settings, Loader2, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BACKEND_URL } from '../utils/config';
import { getKnowledgeFallback, ECO_KNOWLEDGE } from '../utils/ecoKnowledge';

// ─── Types ───────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'ollama' | 'fallback';
  model?: string;
}

interface EnvContext {
  aqi: number;
  location: string;
  resolved: boolean;
  lat: number | null;
  lon: number | null;
}

const OUTPUT_DENIAL_MARKERS = [
  "i don't have",
  "i dont have",
  "i'm not aware",
  "im not aware",
  'no data',
  'cannot access',
  "can't access",
];

const MAX_RESPONSE_SENTENCES = 5;

// ─── Web Speech API type helpers ─────────────────────
const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm EcoBot, your AI-powered air quality assistant 🌿. I can analyze real-time air quality, give health recommendations, suggest safe exercise times, and help with indoor air management. Try asking me anything!",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false); // Disabling auto-speak by default to increase perceived speed
  const [strictOutputMode, setStrictOutputMode] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [activeBackendUrl, setActiveBackendUrl] = useState<string>(BACKEND_URL);
  const [envContext, setEnvContext] = useState<EnvContext>({ aqi: 0, location: 'Detecting Location...', resolved: false, lat: null, lon: null });
  const [ollamaStatus, setOllamaStatus] = useState<string>('checking...');
  const [showStatus, setShowStatus] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamAbortRef = useRef<AbortController | null>(null);

  const backendCandidates = useMemo(() => {
    return Array.from(new Set([
      BACKEND_URL,
      'http://127.0.0.2:8000',
      'http://127.0.0.1:8000',
      'http://localhost:8000',
    ]));
  }, []);

  const resolveEnvContextNow = useCallback(async (): Promise<EnvContext> => {
    if (!("geolocation" in navigator)) {
      return { aqi: 50, location: 'Unknown', resolved: true, lat: null as number | null, lon: null as number | null };
    }

    return await new Promise<{ aqi: number; location: string; resolved: boolean; lat: number | null; lon: number | null }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon } = pos.coords;
          try {
            const aqiResp = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi`);
            const aqiData = await aqiResp.json();
            const aqi = aqiData?.current?.us_aqi ? Math.round(aqiData.current.us_aqi) : 50;

            const geoResp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
            const geoData = await geoResp.json();
            const location = geoData?.address?.city || geoData?.address?.town || geoData?.address?.state || 'Your Area';

            resolve({ aqi, location, resolved: true, lat, lon });
          } catch {
            resolve({ aqi: 50, location: 'Unknown Location', resolved: true, lat, lon });
          }
        },
        () => resolve({ aqi: 50, location: 'Unknown Location', resolved: true, lat: null, lon: null }),
        {
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 0
        }
      );
    });
  }, []);

  const extractTargetLocationFromQuery = (query: string): string | null => {
    const lowered = query.toLowerCase().trim();
    const pattern = /\b(?:in|at|for|of|near)\s+([a-z]+(?:[\s-][a-z]+){0,2})\b/i;
    const match = lowered.match(pattern);
    if (!match?.[1]) return null;
    const candidate = match[1].trim();
    if (!candidate || candidate.length < 2) return null;
    return candidate
      .split(/[\s-]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const trimToSentenceLimit = (text: string, maxSentences: number): string => {
    const sentenceMatches = text.match(/[^.!?]+[.!?]+/g);
    if (!sentenceMatches || sentenceMatches.length <= maxSentences) {
      return text;
    }
    return sentenceMatches.slice(0, maxSentences).join(' ').trim();
  };

  const buildDeterministicReply = (query: string, context: EnvContext): string => {
    // 1. Check for specific EcoSense knowledge matches first
    const knowledgeMatch = getKnowledgeFallback(query);
    if (knowledgeMatch) return knowledgeMatch;

    const targetLocation = extractTargetLocationFromQuery(query) || context.location || 'your area';
    const aqiValue = Number.isFinite(context.aqi) ? context.aqi : 50;

    if (aqiValue > 200) {
      return `AQI in ${targetLocation} is ${aqiValue} (Very Unhealthy). Avoid outdoor activity, stay indoors, and use an N95 mask if you must step outside.`;
    }
    if (aqiValue > 150) {
      return `AQI in ${targetLocation} is ${aqiValue} (Unhealthy). Reduce outdoor exertion and wear a mask for longer outdoor exposure.`;
    }
    if (aqiValue > 100) {
      return `AQI in ${targetLocation} is ${aqiValue} (Unhealthy for Sensitive Groups). Sensitive people should limit outdoor time and heavy exercise.`;
    }
    if (aqiValue > 50) {
      return `AQI in ${targetLocation} is ${aqiValue} (Moderate). Outdoor activity is generally fine, but sensitive groups should stay cautious.`;
    }
    return `AQI in ${targetLocation} is ${aqiValue} (Good). Air quality is safe for normal outdoor activities.`;
  };

  const normalizeAssistantReply = (rawReply: string, query: string, context: EnvContext): string => {
    const collapsed = rawReply
      .replace(/\s+/g, ' ')
      .replace(/\s+([,.!?;:])/g, '$1')
      .trim();

    if (!collapsed) {
      return buildDeterministicReply(query, context);
    }

    const lowered = collapsed.toLowerCase();
    const shouldForceDeterministic = strictOutputMode && OUTPUT_DENIAL_MARKERS.some(marker => lowered.includes(marker));
    if (shouldForceDeterministic) {
      return buildDeterministicReply(query, context);
    }

    return trimToSentenceLimit(collapsed, MAX_RESPONSE_SENTENCES);
  };

  const pushSystemAssistantMessage = (content: string, source: 'fallback' | 'ollama' = 'fallback') => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      source,
      model: source === 'fallback' ? 'client-guard' : undefined,
    }]);
  };

  const handleSlashCommand = async (rawInput: string): Promise<boolean> => {
    const input = rawInput.trim();
    if (!input.startsWith('/')) return false;

    const [command, ...args] = input.split(/\s+/);
    const commandName = command.toLowerCase();

    if (commandName === '/help') {
      pushSystemAssistantMessage(
        'Available commands:\n• /help\n• /status\n• /locate\n• /clear\n• /aqi <place>\n\nExample: /aqi paris',
        'fallback'
      );
      return true;
    }

    if (commandName === '/status') {
      const statusText = `Backend: ${backendOnline ? 'Online' : 'Offline'}\nEndpoint: ${activeBackendUrl}\nAI Engine: ${ollamaStatus}\nContext: ${envContext.location} (AQI ${envContext.aqi || '--'})\nStrict Output Mode: ${strictOutputMode ? 'ON' : 'OFF'}`;
      pushSystemAssistantMessage(statusText, 'fallback');
      return true;
    }

    if (commandName === '/locate') {
      const updatedContext = await resolveEnvContextNow();
      setEnvContext(updatedContext);
      pushSystemAssistantMessage(`Location refreshed: ${updatedContext.location} (AQI ${updatedContext.aqi || '--'})`, 'fallback');
      return true;
    }

    if (commandName === '/clear') {
      setMessages([{
        id: Date.now().toString(),
        role: 'assistant',
        content: "Chat reset complete. I'm ready for the next AQI query.",
        timestamp: new Date(),
      }]);
      return true;
    }

    if (commandName === '/aqi') {
      const place = args.join(' ').trim();
      if (!place) {
        pushSystemAssistantMessage('Usage: /aqi <place>\nExample: /aqi new york', 'fallback');
        return true;
      }
      await sendMessage(`What is the current AQI in ${place}? Give 1-2 lines with health advice.`);
      return true;
    }

    pushSystemAssistantMessage(`Unknown command: ${commandName}. Type /help to see available commands.`, 'fallback');
    return true;
  };

  // ─── Scroll to bottom on new messages ──────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ─── Check backend status on mount ─────────────────
  useEffect(() => {
    const checkStatus = async () => {
      for (const candidate of backendCandidates) {
        try {
          const resp = await fetch(`${candidate}/api/status`);
          if (resp.ok) {
            const data = await resp.json();
            setBackendOnline(true);
            setActiveBackendUrl(candidate);
            setOllamaStatus(data.ollama);
            return;
          }
        } catch {
          // Try next endpoint candidate
        }
      }

      setBackendOnline(false);
      setOllamaStatus('backend offline');
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Re-check every 30s
    return () => clearInterval(interval);
  }, [backendCandidates]);

  // ─── Fetch Real User Context (Location & AQI) ──────
  useEffect(() => {
    const fetchEnvData = async () => {
      const context = await resolveEnvContextNow();
      setEnvContext(context);
    };
    
    fetchEnvData();
  }, [resolveEnvContextNow]);

  // ─── Text-to-Speech via edge-tts backend ───────────
  const speakText = useCallback(async (text: string) => {
    if (!autoSpeak || !backendOnline) return;

    // Stop any current playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    try {
      setIsSpeaking(true);
      const resp = await fetch(`${activeBackendUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.replace(/[🌿🌱💚✨🌳☀️]/g, '') }) // Strip emojis for cleaner speech
      });

      if (!resp.ok) throw new Error('TTS failed');

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };

      await audio.play();
    } catch {
      setIsSpeaking(false);
    }
  }, [autoSpeak, backendOnline, activeBackendUrl]);

  // ─── Stop speaking ────────────────────────────────
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const stopStreaming = () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
    setIsStreaming(false);
    setIsTyping(false);
  };

  // ─── Send message to backend ──────────────────────
  const sendMessage = async (text: string) => {
    const normalizedInput = text.trim();
    if (!normalizedInput) return;

    const handledAsCommand = await handleSlashCommand(normalizedInput);
    if (handledAsCommand) {
      setInputText('');
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: normalizedInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);
    setIsStreaming(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }

    let aiMsgId: string | null = null;

    try {
      if (!backendOnline) throw new Error('Backend offline');

      if (streamAbortRef.current) {
        streamAbortRef.current.abort();
      }
      const streamController = new AbortController();
      streamAbortRef.current = streamController;

      let requestContext = envContext;
      if (!envContext.resolved || envContext.lat === null || envContext.lon === null) {
        requestContext = await resolveEnvContextNow();
        setEnvContext(requestContext);
      }

      const resp = await fetch(`${activeBackendUrl}/api/ask-ecobot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: streamController.signal,
        body: JSON.stringify({
          user_voice_text: normalizedInput,
          current_aqi: requestContext.aqi,
          location: requestContext.location,
          latitude: requestContext.lat,
          longitude: requestContext.lon
        })
      });

      if (!resp.ok) throw new Error('Request failed');

      aiMsgId = (Date.now() + 1).toString();
      setIsTyping(false);
      setIsStreaming(true);
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        source: 'ollama',
        model: 'Thinking...'
      }]);

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder('utf-8');
      let fullReply = '';
      let buffer = '';
      let isDone = false;
      let responseSource: 'ollama' | 'fallback' = 'ollama';
      let responseModel = 'Thinking...';

      const applyDataPayload = (dataStr: string) => {
        if (!dataStr || dataStr === '[DONE]') {
          if (dataStr === '[DONE]') {
            isDone = true;
          }
          return;
        }
        try {
          const parsed = JSON.parse(dataStr);
          const chunkText = typeof parsed.text === 'string' ? parsed.text : '';
          if (!chunkText) return;

          fullReply += chunkText;
          responseSource = parsed.source === 'fallback' ? 'fallback' : 'ollama';
          responseModel = typeof parsed.model === 'string' ? parsed.model : responseModel;

          setMessages(prev => prev.map(message =>
            message.id === aiMsgId
              ? { ...message, content: fullReply, source: responseSource, model: responseModel }
              : message
          ));
        } catch {
          // Ignore malformed SSE payloads
        }
      };

      while (!isDone) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data: ')) continue;
          applyDataPayload(trimmedLine.slice(6).trim());
          if (isDone) break;
        }
      }

      const trailing = buffer.trim();
      if (!isDone && trailing.startsWith('data: ')) {
        applyDataPayload(trailing.slice(6).trim());
      }

      const normalizedReply = normalizeAssistantReply(fullReply, normalizedInput, requestContext);
      setMessages(prev => prev.map(message =>
        message.id === aiMsgId
          ? { ...message, content: normalizedReply, source: responseSource, model: responseModel }
          : message
      ));

      if (autoSpeak) {
        speakText(normalizedReply);
      }
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === 'AbortError';

      if (isAbort) {
        if (aiMsgId) {
          setMessages(prev => prev.map(message =>
            message.id === aiMsgId
              ? {
                  ...message,
                  content: message.content?.trim() ? message.content : 'Response generation stopped.',
                  source: 'fallback',
                  model: 'client-guard'
                }
              : message
          ));
        } else {
          pushSystemAssistantMessage('Response generation stopped.', 'fallback');
        }
        return;
      }

      const startCommand = 'python -m uvicorn main:app --app-dir backend_ai --port 8000';
      const offlineMessage = `I'm having trouble connecting to my AI backend.\n\nStart backend with:\n${startCommand}\n\nCurrent backend URL: ${activeBackendUrl}`;
      pushSystemAssistantMessage(offlineMessage, 'fallback');
    } finally {
      streamAbortRef.current = null;
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  // ─── Handle form submit ───────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  // ─── Speech-to-Text (Web Speech API) ──────────────
  const toggleListening = () => {
    if (isListening) {
      // Stop listening
      recognitionRef.current?.stop();
      setIsListening(false);
      setLiveTranscript('');
      return;
    }

    if (!SpeechRecognitionClass) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Your browser doesn't support Speech Recognition. Please use Chrome or Edge for voice input.",
        timestamp: new Date()
      }]);
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setLiveTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      setLiveTranscript(interim || final);

      if (final) {
        setIsListening(false);
        setLiveTranscript('');
        sendMessage(final);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setLiveTranscript('');
      if (event.error === 'not-allowed') {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: "Microphone access was denied. Please allow microphone permissions in your browser settings and try again.",
          timestamp: new Date()
        }]);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // ─── Quick Actions ─────────────────────────────────
  const quickActions = [
    "Is it safe to go outside?",
    "Indoor air quality tips",
    "Should I wear a mask?",
    "Best time for a run?"
  ];

  return (
    <div className="h-full w-full flex flex-col bg-surface font-display relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[30%] bg-accent/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[30%] bg-accent/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <motion.div
        className="px-5 pt-6 pb-4 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center shadow-[0_0_15px_rgba(107,142,94,0.3)]">
            <Sparkles size={20} className="text-text-inverse" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-text-main">EcoBot Assistant</h1>
            <div className="flex items-center gap-1.5">
              {backendOnline === null ? (
                <Loader2 size={10} className="text-yellow-500 animate-spin" />
              ) : backendOnline ? (
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              <span className={`text-[10px] font-semibold ${backendOnline ? 'text-accent' : backendOnline === false ? 'text-red-400' : 'text-yellow-500'}`}>
                {backendOnline ? 'Online • AI Powered' : backendOnline === false ? 'Backend Offline' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${autoSpeak ? 'bg-accent/15 border border-accent/25 text-accent' : 'bg-border-subtle border border-border-strong text-text-sub'}`}
              title={autoSpeak ? 'Voice On' : 'Voice Off'}
            >
              {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button
              onClick={() => setShowStatus(!showStatus)}
              className="w-9 h-9 rounded-xl bg-border-subtle border border-border-strong flex items-center justify-center text-text-sub hover:text-text-main transition-all active:scale-90"
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {/* Status Panel */}
        <AnimatePresence>
          {showStatus && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 bg-border-subtle border border-border-subtle rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider">Backend</span>
                  <span className={`text-[10px] font-bold ${backendOnline ? 'text-accent' : 'text-red-400'}`}>
                    {backendOnline ? '● Connected' : '● Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider">AI Engine</span>
                  <span className="text-[10px] font-bold text-text-sub">{ollamaStatus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider">Endpoint</span>
                  <span className="text-[10px] font-bold text-text-sub">{activeBackendUrl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider">Local Context</span>
                  <span className={`text-[10px] font-bold ${envContext.resolved ? 'text-accent' : 'text-text-sub animate-pulse'}`}>
                    {envContext.location} (AQI: {envContext.aqi || '--'})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider">Voice</span>
                  <span className="text-[10px] font-bold text-text-sub">
                    {autoSpeak ? 'Neural TTS (AriaNeural)' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider">Output Guard</span>
                  <button
                    onClick={() => setStrictOutputMode(!strictOutputMode)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${strictOutputMode ? 'bg-accent/15 text-accent' : 'bg-border-subtle text-text-sub'}`}
                  >
                    {strictOutputMode ? 'ON' : 'OFF'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-sub font-bold uppercase tracking-wider">Speech Input</span>
                  <span className="text-[10px] font-bold text-text-sub">
                    {SpeechRecognitionClass ? 'Web Speech API ✓' : 'Not Supported'}
                  </span>
                </div>
                {!backendOnline && (
                  <div className="pt-2 border-t border-border-subtle">
                    <p className="text-[10px] text-yellow-500/80 leading-relaxed">
                      Start backend: <span className="font-mono bg-border-subtle px-1.5 py-0.5 rounded">python -m uvicorn main:app --app-dir backend_ai --port 8000</span>
                    </p>
                  </div>
                )}
                <div className="pt-2 border-t border-border-subtle">
                  <p className="text-[10px] text-text-sub leading-relaxed">
                    Commands: <span className="font-mono">/help</span> <span className="font-mono">/status</span> <span className="font-mono">/locate</span> <span className="font-mono">/clear</span> <span className="font-mono">/aqi &lt;place&gt;</span>
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-4 z-10">
        <div className="flex flex-col gap-4 min-h-full justify-end">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot size={14} className="text-accent" />
                </div>
              )}
              <div className={`max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-accent text-text-inverse rounded-2xl rounded-tr-none px-4.5 py-3.5 shadow-lg shadow-accent/20'
                  : 'bg-card border border-border-subtle rounded-2xl rounded-tl-none px-4.5 py-3.5 shadow-sm'
              }`}>
                <p className={`text-[15px] leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'text-text-inverse font-medium' : 'text-text-main'}`}>
                  {msg.content}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[9px] ${msg.role === 'user' ? 'text-accent/70' : 'text-text-sub'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.source && msg.role === 'assistant' && (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      msg.source === 'ollama' ? 'bg-accent/15 text-accent' : 'bg-border-subtle text-text-sub'
                    }`}>
                      {msg.source === 'ollama' ? `⚡ ${msg.model}` : '● built-in'}
                    </span>
                  )}
                  {/* Replay voice button */}
                  {msg.role === 'assistant' && backendOnline && (
                    <button
                      onClick={() => speakText(msg.content)}
                      className="text-text-sub hover:text-accent transition-colors ml-auto"
                      title="Play voice"
                    >
                      <Volume2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-border-subtle flex items-center justify-center ml-2 mt-1 shrink-0">
                  <User size={14} className="text-text-sub" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center mr-2 shrink-0">
                  <Bot size={14} className="text-accent" />
                </div>
                <div className="bg-card border border-border-subtle rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 shadow-sm">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-accent"
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <motion.div
          className="px-5 pb-3 flex gap-2 overflow-x-auto z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {quickActions.map(action => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              className="bg-card border border-border-subtle shadow-sm px-4 py-2 rounded-full text-xs font-semibold text-text-sub whitespace-nowrap hover:bg-accent/10 hover:border-accent/30 active:scale-95 transition-all"
            >
              {action}
            </button>
          ))}
        </motion.div>
      )}

      {/* Voice Visualizer (full-screen overlay while listening) */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            className="absolute inset-0 bg-surface/95 z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 w-32 h-32 bg-accent/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative flex items-end justify-center gap-1.5 h-24 w-48">
                {[20, 35, 50, 40, 55, 30, 45, 25, 15].map((height, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-accent to-accent/70 rounded-full"
                    animate={{ height: [height * 0.3, height, height * 0.3] }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                  />
                ))}
              </div>
            </div>

            {/* Live transcript */}
            {liveTranscript && (
              <motion.p
                className="text-text-main text-sm font-medium mb-4 px-6 text-center max-w-[80%]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                "{liveTranscript}"
              </motion.p>
            )}

            <span className="text-accent/80 text-xs font-bold uppercase tracking-[0.3em] animate-pulse mb-6">
              {liveTranscript ? 'Hearing you...' : 'Listening...'}
            </span>
            <button
              onClick={toggleListening}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <MicOff size={24} className="text-text-main" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-accent/15 backdrop-blur-xl border border-accent/20 rounded-full px-4 py-2 flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="w-1 bg-accent rounded-full"
                  animate={{ height: [4, 12, 4] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-accent/80">EcoBot speaking</span>
            <button onClick={stopSpeaking} className="ml-1 text-accent/80 hover:text-text-main transition-colors">
              <VolumeX size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar */}
      <div className="px-5 pb-6 pt-3 z-10">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-all ${
              isListening
                ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                : 'bg-accent/15 border border-accent/20 text-accent hover:bg-accent/25'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <div className="flex-1 bg-card border border-border-subtle shadow-sm rounded-2xl flex items-center px-4 py-3 focus-within:border-accent/30 transition-colors">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Ask EcoBot anything...'}
              className="bg-transparent border-none focus:outline-none text-text-main placeholder:text-text-sub w-full text-sm font-medium"
              disabled={isListening}
            />
          </div>
          {isStreaming ? (
            <button
              type="button"
              onClick={stopStreaming}
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-all bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
              title="Stop response"
            >
              <Square size={16} />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!inputText.trim() || isListening}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-all ${
                inputText.trim() ? 'bg-accent text-text-inverse shadow-[0_4px_15px_rgba(107,142,94,0.3)]' : 'bg-border-subtle text-text-sub'
              }`}
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
