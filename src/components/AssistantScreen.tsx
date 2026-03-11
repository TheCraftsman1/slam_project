import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, Bot, User, Sparkles, Volume2, VolumeX, Wifi, WifiOff, Settings, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ─── Types ───────────────────────────────────────────
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  source?: 'ollama' | 'fallback';
  model?: string;
}

// ─── Config ──────────────────────────────────────────
const BACKEND_URL = 'http://localhost:8000';

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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<string>('checking...');
  const [showStatus, setShowStatus] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ─── Scroll to bottom on new messages ──────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ─── Check backend status on mount ─────────────────
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const resp = await fetch(`${BACKEND_URL}/api/status`);
        if (resp.ok) {
          const data = await resp.json();
          setBackendOnline(true);
          setOllamaStatus(data.ollama);
        } else {
          setBackendOnline(false);
          setOllamaStatus('backend offline');
        }
      } catch {
        setBackendOnline(false);
        setOllamaStatus('backend offline');
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Re-check every 30s
    return () => clearInterval(interval);
  }, []);

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
      const resp = await fetch(`${BACKEND_URL}/api/tts`, {
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
  }, [autoSpeak, backendOnline]);

  // ─── Stop speaking ────────────────────────────────
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  // ─── Send message to backend ──────────────────────
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      if (!backendOnline) throw new Error('Backend offline');

      const resp = await fetch(`${BACKEND_URL}/api/ask-ecobot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_voice_text: text.trim(),
          current_aqi: 72, // TODO: Pass real AQI from app state/context
          location: 'Visakhapatnam'  // TODO: Pass real location
        })
      });

      if (!resp.ok) throw new Error('Request failed');

      const data = await resp.json();

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        source: data.source,
        model: data.model
      };
      setIsTyping(false);
      setMessages(prev => [...prev, aiMsg]);

      // Auto-speak the response
      speakText(data.reply);

    } catch {
      // Offline fallback (basic responses without backend)
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting to my backend server. Please make sure the FastAPI server is running:\n\n`cd backend_ai && uvicorn main:app --reload`\n\nOnce it's up, I'll be fully functional!",
        timestamp: new Date(),
        source: 'fallback'
      };
      setIsTyping(false);
      setMessages(prev => [...prev, aiMsg]);
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
    <div className="h-full w-full flex flex-col bg-[#0b1120] font-display relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[30%] bg-blue-500/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[30%] bg-cyan-500/[0.04] rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <motion.div
        className="px-5 pt-6 pb-4 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">EcoBot Assistant</h1>
            <div className="flex items-center gap-1.5">
              {backendOnline === null ? (
                <Loader2 size={10} className="text-yellow-400 animate-spin" />
              ) : backendOnline ? (
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
              <span className={`text-[10px] font-semibold ${backendOnline ? 'text-green-400' : backendOnline === false ? 'text-red-400' : 'text-yellow-400'}`}>
                {backendOnline ? 'Online • AI Powered' : backendOnline === false ? 'Backend Offline' : 'Connecting...'}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-1.5">
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 ${autoSpeak ? 'bg-blue-500/15 border border-blue-500/25 text-blue-400' : 'bg-white/[0.05] border border-white/[0.08] text-slate-500'}`}
              title={autoSpeak ? 'Voice On' : 'Voice Off'}
            >
              {autoSpeak ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>
            <button
              onClick={() => setShowStatus(!showStatus)}
              className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-slate-500 hover:text-white transition-all active:scale-90"
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
              <div className="mt-3 bg-white/[0.03] border border-white/[0.06] rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Backend</span>
                  <span className={`text-[10px] font-bold ${backendOnline ? 'text-green-400' : 'text-red-400'}`}>
                    {backendOnline ? '● Connected' : '● Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">AI Engine</span>
                  <span className="text-[10px] font-bold text-slate-300">{ollamaStatus}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Voice</span>
                  <span className="text-[10px] font-bold text-slate-300">
                    {autoSpeak ? 'Neural TTS (AriaNeural)' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Speech Input</span>
                  <span className="text-[10px] font-bold text-slate-300">
                    {SpeechRecognitionClass ? 'Web Speech API ✓' : 'Not Supported'}
                  </span>
                </div>
                {!backendOnline && (
                  <div className="pt-2 border-t border-white/[0.05]">
                    <p className="text-[10px] text-yellow-400/80 leading-relaxed">
                      Start backend: <span className="font-mono bg-white/[0.05] px-1.5 py-0.5 rounded">cd backend_ai && uvicorn main:app --reload</span>
                    </p>
                  </div>
                )}
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
                <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Bot size={14} className="text-blue-400" />
                </div>
              )}
              <div className={`max-w-[80%] ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3'
                  : 'glass-card rounded-2xl rounded-bl-md px-4 py-3'
              }`}>
                <p className={`text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'text-white' : 'text-slate-200'}`}>
                  {msg.content}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`text-[9px] ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'}`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {msg.source && msg.role === 'assistant' && (
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${
                      msg.source === 'ollama' ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.06] text-slate-500'
                    }`}>
                      {msg.source === 'ollama' ? `⚡ ${msg.model}` : '● built-in'}
                    </span>
                  )}
                  {/* Replay voice button */}
                  {msg.role === 'assistant' && backendOnline && (
                    <button
                      onClick={() => speakText(msg.content)}
                      className="text-slate-600 hover:text-blue-400 transition-colors ml-auto"
                      title="Play voice"
                    >
                      <Volume2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center ml-2 mt-1 shrink-0">
                  <User size={14} className="text-slate-300" />
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
                <div className="w-7 h-7 rounded-full bg-blue-500/15 flex items-center justify-center mr-2 shrink-0">
                  <Bot size={14} className="text-blue-400" />
                </div>
                <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-blue-400"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
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
              className="glass-card px-4 py-2 rounded-full text-xs font-semibold text-slate-300 whitespace-nowrap hover:bg-white/[0.08] active:scale-95 transition-all"
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
            className="absolute inset-0 bg-[#0b1120]/95 z-50 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
              <div className="relative flex items-end justify-center gap-1.5 h-24 w-48">
                {[20, 35, 50, 40, 55, 30, 45, 25, 15].map((height, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-full"
                    animate={{ height: [height * 0.3, height, height * 0.3] }}
                    transition={{ duration: 0.8 + i * 0.1, repeat: Infinity, ease: "easeInOut" }}
                  />
                ))}
              </div>
            </div>

            {/* Live transcript */}
            {liveTranscript && (
              <motion.p
                className="text-white text-sm font-medium mb-4 px-6 text-center max-w-[80%]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                "{liveTranscript}"
              </motion.p>
            )}

            <span className="text-blue-400/80 text-xs font-bold uppercase tracking-[0.3em] animate-pulse mb-6">
              {liveTranscript ? 'Hearing you...' : 'Listening...'}
            </span>
            <button
              onClick={toggleListening}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_20px_rgba(239,68,68,0.4)]"
            >
              <MicOff size={24} className="text-white" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speaking indicator */}
      <AnimatePresence>
        {isSpeaking && (
          <motion.div
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-blue-500/15 backdrop-blur-xl border border-blue-500/20 rounded-full px-4 py-2 flex items-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="w-1 bg-blue-400 rounded-full"
                  animate={{ height: [4, 12, 4] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-blue-300">EcoBot speaking</span>
            <button onClick={stopSpeaking} className="ml-1 text-blue-300 hover:text-white transition-colors">
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
                : 'bg-blue-500/15 border border-blue-500/20 text-blue-400 hover:bg-blue-500/25'
            }`}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <div className="flex-1 glass-card rounded-2xl flex items-center px-4 py-3 focus-within:border-blue-500/30 transition-colors">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Ask EcoBot anything...'}
              className="bg-transparent border-none focus:outline-none text-white placeholder:text-slate-500 w-full text-sm font-medium"
              disabled={isListening}
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isListening}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 active:scale-95 transition-all ${
              inputText.trim() ? 'bg-blue-500 text-white shadow-[0_4px_15px_rgba(59,130,246,0.3)]' : 'bg-white/[0.05] text-slate-600'
            }`}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
