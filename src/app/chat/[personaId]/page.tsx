"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

type Msg = { id?: string; role: "user" | "assistant"; content: string; created_at?: string };
type Persona = { id: string; name: string; personality: string; face_url?: string; voice_id?: string };


const MOODS = [
  { emoji: "😊", label: "happy", prompt: "I'm feeling pretty good rn" },
  { emoji: "😔", label: "down", prompt: "feeling kinda down today" },
  { emoji: "😤", label: "frustrated", prompt: "honestly pretty frustrated" },
  { emoji: "😴", label: "tired", prompt: "so tired rn" },
  { emoji: "🤔", label: "thoughtful", prompt: "been thinking about stuff" },
  { emoji: "😆", label: "hyped", prompt: "omg so excited rn" },
];

export default function ChatPage() {
  const router = useRouter();
  const { personaId } = useParams<{ personaId: string }>();
  const [persona, setPersona] = useState<Persona>({ id: "", name: "Your companion", personality: "", face_url: "" });
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showPersonalityPanel, setShowPersonalityPanel] = useState(false);
  const [memory, setMemory] = useState<{ summary: string | null; messageCount: number } | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [autoPlayVoice, setAutoPlayVoice] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [inCall, setInCall] = useState(false);
  const [callListening, setCallListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false); // mobile only

  // Personality controls
  const [flirtyLevel, setFlirtyLevel] = useState(30);
  const [funnyLevel, setFunnyLevel] = useState(50);
  const [supportiveLevel, setSupportiveLevel] = useState(70);
  const [deepLevel, setDeepLevel] = useState(40);
  const [conversationMode, setConversationMode] = useState<"casual" | "vent" | "playful" | "advice">("casual");

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<string>("");
  const isAISpeakingRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load browser voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      const defaultVoice = availableVoices.find(v =>
        v.name.includes("Samantha") ||
        v.name.includes("Google UK English Female") ||
        v.name.includes("Female")
      ) || availableVoices[0];
      setSelectedVoice(defaultVoice);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  useEffect(() => {
    if (!personaId) return;
    fetch(`/api/personas?user_id=test-user`)
      .then((r) => r.json())
      .then((data) => {
        const foundPersona = data.personas?.find((p: Persona) => p.id === personaId);
        if (foundPersona) setPersona(foundPersona);
      });
    fetch(`/api/persona/${personaId}/messages`)
      .then((r) => r.json())
      .then((data) => setMessages(data.messages ?? []));
  }, [personaId]);

  useEffect(() => {
    if (!autoPlayVoice) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "assistant" && lastMsg.content && lastMsg.content !== lastMessageRef.current && !loading) {
      lastMessageRef.current = lastMsg.content;
      speakText(lastMsg.content, lastMsg.id ?? `msg-${messages.length - 1}`, true);
    }
  }, [messages, loading, autoPlayVoice]);

  function getPersonalityModifier() {
    const mode = {
      casual: "just chatting casually, keep it light and fun",
      vent: "they need to vent/talk through something. be supportive and listen",
      playful: "they wanna have fun, play games, joke around",
      advice: "they want actual advice. be thoughtful but still casual"
    }[conversationMode];

    return `\n\nCURRENT VIBE SETTINGS:
Mode: ${mode}
Flirty: ${flirtyLevel}% ${flirtyLevel > 60 ? "(be a bit flirty/playful)" : ""}
Funny: ${funnyLevel}% ${funnyLevel > 60 ? "(crack jokes, be goofy)" : ""}
Supportive: ${supportiveLevel}% ${supportiveLevel > 60 ? "(be extra caring and validating)" : ""}
Deep: ${deepLevel}% ${deepLevel > 60 ? "(ask thoughtful questions, go deeper)" : ""}

Adjust your personality to match these settings!`;
  }

  async function send(text?: string, customContext?: string) {
    const messageText = text || input;
    if (!messageText.trim() || loading) return;

    const contextualMessage = customContext
      ? `${customContext}\n\n${messageText}`
      : messageText;

    const userMsg: Msg = {
      role: "user",
      content: customContext ? messageText : contextualMessage,
      created_at: new Date().toISOString()
    };

    setMessages((m) => [...m, userMsg, { role: "assistant", content: "", created_at: new Date().toISOString() }]);
    setInput("");
    setLiveTranscript("");
    setLoading(true);

    try {
      const personalityMod = getPersonalityModifier();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId,
          message: contextualMessage + personalityMod
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `Error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc, created_at: new Date().toISOString() };
          return copy;
        });
      }
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: `Error: ${error.message || "Failed to get response"}`,
          created_at: new Date().toISOString(),
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  function speakText(text: string, messageId: string, fromAutoPlay = false) {
    window.speechSynthesis.cancel();
    if (playingAudio === messageId && !fromAutoPlay) {
      setPlayingAudio(null);
      isAISpeakingRef.current = false;
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.onstart = () => {
      setPlayingAudio(messageId);
      isAISpeakingRef.current = true;
    };
    utterance.onend = () => {
      setPlayingAudio(null);
      isAISpeakingRef.current = false;
      if (inCall && recognitionRef.current) {
        setTimeout(() => {
          try { recognitionRef.current.start(); } catch (e) {}
        }, 500);
      }
    };
    utterance.onerror = () => {
      setPlayingAudio(null);
      isAISpeakingRef.current = false;
    };
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function previewVoice(voice: SpeechSynthesisVoice) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance("Hi! This is how I sound. Do you like my voice?");
    utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  }

  function selectVoice(voice: SpeechSynthesisVoice) {
    setSelectedVoice(voice);
    setShowVoiceModal(false);
  }

  async function openMemory() {
    const res = await fetch(`/api/persona/${personaId}/memory`);
    setMemory(await res.json());
    setShowMemory(true);
  }

  async function downloadExport() {
    // fetch + blob (instead of opening the URL) so it also works in demo mode
    const res = await fetch(`/api/persona/${personaId}/export`);
    const blob = new Blob([await res.text()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `companion-export-${personaId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function startCall() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice calling is not supported in your browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setVideoStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.error);
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Couldn't access camera. Call will continue audio-only.");
    }

    setInCall(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => setCallListening(true);

    recognition.onresult = async (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      if (interimTranscript) setLiveTranscript(interimTranscript);
      if (finalTranscript) {
        setLiveTranscript("");
        if (isAISpeakingRef.current) {
          window.speechSynthesis.cancel();
          isAISpeakingRef.current = false;
          setPlayingAudio(null);
        }
        setCallListening(false);
        await send(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Recognition error:", event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setTimeout(() => {
          if (inCall && recognitionRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        }, 1000);
      }
    };

    recognition.onend = () => {
      if (inCall && !isAISpeakingRef.current) {
        setTimeout(() => {
          if (inCall && recognitionRef.current && !isAISpeakingRef.current) {
            try { recognitionRef.current.start(); } catch (e) {}
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }

  function endCall() {
    setInCall(false);
    setCallListening(false);
    setLiveTranscript("");
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    window.speechSynthesis.cancel();
    isAISpeakingRef.current = false;
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
      setVideoStream(null);
    }
  }

  function startRecording() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice recording is not supported in your browser.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => setRecording(true);
    recognition.onend = () => {
      setRecording(false);
      setLiveTranscript("");
    };
    recognition.onerror = () => {
      setRecording(false);
      setLiveTranscript("");
    };
    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += transcript;
        else interimTranscript += transcript;
      }
      setLiveTranscript(interimTranscript || finalTranscript);
      if (finalTranscript) setInput(finalTranscript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setRecording(false);
    }
  }

  function formatTime(timestamp?: string) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f5f0ff] via-[#ede7ff] to-[#e5deff] floating-shapes">
      {/* Sidebar */}
      <div className={`${showSidebar ? "fixed inset-0 z-40 flex" : "hidden"} md:static md:z-auto md:flex w-full md:w-80 glass border-r border-purple-200 flex-col`}>
        <div className="p-6 flex-1 overflow-y-auto">
          <button
            onClick={() => setShowSidebar(false)}
            className="md:hidden mb-4 text-sm font-medium text-purple-700 underline underline-offset-2"
          >
            ← Back to chat
          </button>
          <div className="mb-6">
            {/* Avatar */}
            <div className="relative mb-4 group">
              <div className="absolute inset-0 gradient-purple-pink rounded-full blur-2xl opacity-40 group-hover:opacity-60 transition-opacity animate-pulse-glow"></div>
              <img
                src={persona.face_url || "https://i.pravatar.cc/512?img=1"}
                alt={persona.name}
                className="relative w-full aspect-square rounded-full object-cover border-4 border-white shadow-2xl avatar-glow cursor-pointer transition-transform hover:scale-105"
                onClick={() => router.push("/")}
              />
              {playingAudio && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-full absolute inset-0 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full animate-pulse"></div>
                  <div className="relative flex gap-2 items-end h-16">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-2 bg-white rounded-full animate-bounce-gentle"
                        style={{ height: `${15 + i * 10}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <h2 className="text-2xl font-bold gradient-text mb-1">{persona.name}</h2>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse-glow"></div>
              <p className="text-xs text-purple-600 font-medium">
                {inCall ? "🔴 In call" : "Always here"}
              </p>
            </div>
          </div>

          {/* Call Button */}
          <button
            onClick={inCall ? endCall : startCall}
            className={`w-full mb-3 p-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 font-bold ${
              inCall ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "gradient-purple-pink text-white hover:scale-105 btn-glow"
            }`}
          >
            {inCall ? (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                End Call
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Video Call
              </>
            )}
          </button>

          {callListening && (
            <div className="mb-3 p-3 glass-pink rounded-2xl text-center animate-pulse">
              <p className="text-pink-700 text-sm font-medium flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                {isAISpeakingRef.current ? "Speaking..." : "Listening..."}
              </p>
            </div>
          )}

          {/* Conversation Mode */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-purple-700 mb-2">Mode</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { mode: "casual", icon: "💬", label: "Chat" },
                { mode: "vent", icon: "💭", label: "Vent" },
                { mode: "playful", icon: "🎮", label: "Play" },
                { mode: "advice", icon: "💡", label: "Advice" },
              ].map(({ mode, icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setConversationMode(mode as any)}
                  className={`p-2 rounded-xl text-sm font-medium transition-all ${
                    conversationMode === mode
                      ? "gradient-purple-pink text-white shadow-lg"
                      : "glass-purple text-purple-700 hover:scale-105"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>

          {/* Personality Button */}
          <button
            onClick={() => setShowPersonalityPanel(!showPersonalityPanel)}
            className="w-full mb-3 p-3 glass-purple rounded-2xl text-purple-700 font-medium hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Personality
          </button>

          {showPersonalityPanel && (
            <div className="mb-3 glass-purple p-3 rounded-2xl space-y-3 animate-slide-up">
              <div>
                <div className="flex justify-between text-xs font-medium text-purple-700 mb-1">
                  <span>😘 Flirty</span>
                  <span>{flirtyLevel}%</span>
                </div>
                <input type="range" min="0" max="100" value={flirtyLevel} onChange={(e) => setFlirtyLevel(Number(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-purple-700 mb-1">
                  <span>😂 Funny</span>
                  <span>{funnyLevel}%</span>
                </div>
                <input type="range" min="0" max="100" value={funnyLevel} onChange={(e) => setFunnyLevel(Number(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-purple-700 mb-1">
                  <span>💜 Supportive</span>
                  <span>{supportiveLevel}%</span>
                </div>
                <input type="range" min="0" max="100" value={supportiveLevel} onChange={(e) => setSupportiveLevel(Number(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer" />
              </div>
              <div>
                <div className="flex justify-between text-xs font-medium text-purple-700 mb-1">
                  <span>🤔 Deep</span>
                  <span>{deepLevel}%</span>
                </div>
                <input type="range" min="0" max="100" value={deepLevel} onChange={(e) => setDeepLevel(Number(e.target.value))}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <button onClick={openMemory} className="glass-purple p-3 rounded-xl transition-all hover:scale-105 flex flex-col items-center gap-1 group">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-[10px] font-medium text-purple-700">Memory</span>
            </button>
            <button onClick={() => setShowVoiceModal(true)} className="glass-pink p-3 rounded-xl transition-all hover:scale-105 flex flex-col items-center gap-1">
              <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="text-[10px] font-medium text-pink-700">Voice</span>
            </button>
            <button onClick={downloadExport} className="glass-purple p-3 rounded-xl transition-all hover:scale-105 flex flex-col items-center gap-1">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="text-[10px] font-medium text-purple-700">Export</span>
            </button>
          </div>

          {/* Auto-play Toggle */}
          <div className="glass-purple p-3 rounded-2xl mb-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-purple-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" />
                </svg>
                Auto-play
              </span>
              <button onClick={() => setAutoPlayVoice(!autoPlayVoice)}
                className={`w-10 h-5 rounded-full transition-all duration-300 ${autoPlayVoice ? "gradient-purple-pink" : "bg-gray-300"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                  autoPlayVoice ? "translate-x-5" : "translate-x-0.5"
                }`} />
              </button>
            </label>
          </div>

          <button onClick={() => router.push("/")}
            className="w-full glass p-3 rounded-2xl text-purple-700 text-sm font-medium hover:scale-105 transition-all flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            All Companions
          </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Video Bubble - FIXED POSITIONING */}
        {inCall && videoStream && (
          <div className="fixed top-6 right-6 z-50 animate-fade-in">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative glass rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                <video ref={videoRef} autoPlay muted playsInline className="w-48 h-64 object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    You
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile header (sidebar is hidden on small screens) */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 glass border-b border-purple-200">
          {persona.face_url ? (
            <img src={persona.face_url} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-white" />
          ) : (
            <div className="w-10 h-10 rounded-full gradient-purple-pink" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold gradient-text truncate">{persona.name}</p>
            <p className="text-xs text-purple-600">Always here</p>
          </div>
          <button
            onClick={() => setShowSidebar(true)}
            className="px-3 py-2 rounded-xl glass-purple text-sm font-medium text-purple-700"
          >
            Menu
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center space-y-4 mt-12">
                <h3 className="text-xl font-bold gradient-text">say hi to {persona.name}</h3>
                <p className="text-purple-600 text-sm">just start texting like u would a friend</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={m.id ?? i} className="animate-fade-in">
                <div className={`flex items-start gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex-1 max-w-[70%] ${m.role === "user" ? "ml-auto" : ""}`}>
                    <div className={`message-bubble text-base leading-relaxed ${
                      m.role === "user"
                        ? "gradient-purple-pink text-white shadow-xl shadow-purple-200/50"
                        : "glass text-purple-900 shadow-xl shadow-purple-100/50"
                    }`}>
                      {m.content || (loading && i === messages.length - 1 ? (
                        <div className="flex gap-2">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s` }} />
                          ))}
                        </div>
                      ) : "")}
                    </div>
                    {m.created_at && (
                      <div className={`mt-2 px-2 ${m.role === "user" ? "text-right" : ""}`}>
                        <span className="text-xs text-purple-400 font-medium">{formatTime(m.created_at)}</span>
                      </div>
                    )}
                  </div>
                  {m.role === "assistant" && m.content && (
                    <button onClick={() => speakText(m.content, m.id ?? `msg-${i}`)}
                      className={`mt-1 p-3 rounded-full transition-all ${
                        playingAudio === (m.id ?? `msg-${i}`)
                          ? "gradient-purple-pink text-white shadow-lg shadow-purple-300 scale-110"
                          : "glass-purple text-purple-600 hover:scale-110"
                      }`}>
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        {playingAudio === (m.id ?? `msg-${i}`) ? (
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        )}
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="px-3 py-3 md:px-8 md:py-6 glass border-t border-purple-200">
          <div className="max-w-4xl mx-auto">
            {/* Mood Quick Actions */}
            {showQuickActions && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-2 animate-slide-up">
                {MOODS.map((mood) => (
                  <button key={mood.label} onClick={() => { send(mood.prompt); setShowQuickActions(false); }}
                    className="flex-shrink-0 glass-pink px-3 py-2 rounded-full text-sm hover:scale-105 transition-all">
                    {mood.emoji} {mood.label}
                  </button>
                ))}
              </div>
            )}

            {liveTranscript && (
              <div className="mb-3 glass-pink p-3 rounded-2xl animate-pulse">
                <p className="text-pink-700 text-sm italic">🎤 {liveTranscript}</p>
              </div>
            )}

            <div className="flex items-center gap-2 md:gap-4">
              <button onClick={recording ? stopRecording : startRecording} disabled={inCall}
                className={`p-3 md:p-4 rounded-full transition-all shadow-lg ${
                  recording ? "bg-red-500 hover:bg-red-600 text-white animate-pulse scale-110"
                    : inCall ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "gradient-purple-pink text-white hover:scale-110 btn-glow"
                }`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>

              <button onClick={() => setShowQuickActions(!showQuickActions)}
                className="p-3 md:p-4 rounded-full glass-purple text-purple-600 hover:scale-110 transition-all shadow-lg">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </button>

              <div className="flex-1 min-w-0 glass rounded-full border-2 border-purple-200 focus-within:border-purple-400 transition-all shadow-lg">
                <textarea className="w-full bg-transparent px-4 py-3 md:px-6 md:py-4 text-purple-900 placeholder-purple-400 outline-none resize-none text-base"
                  placeholder={inCall ? "🔴 In call - speak to chat" : recording ? "🎤 Recording..." : liveTranscript ? "" : "Type a message..."}
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1} disabled={recording || inCall} />
              </div>

              <button onClick={() => send()} disabled={loading || !input.trim() || recording || inCall}
                className="p-3 md:p-4 rounded-full gradient-purple-pink text-white disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 transition-all shadow-lg btn-glow">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in" onClick={() => setShowVoiceModal(false)}>
          <div className="glass rounded-3xl p-8 max-w-3xl w-full shadow-2xl animate-slide-up max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold gradient-text flex items-center gap-3">
                <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                Choose Voice ({voices.length} available)
              </h3>
              <button onClick={() => setShowVoiceModal(false)} className="p-2 rounded-full hover:bg-purple-100 transition-all">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-2">
              {voices.map((voice, idx) => (
                <button key={idx} onClick={() => selectVoice(voice)}
                  className={`glass-purple p-4 rounded-2xl text-left transition-all hover:scale-105 card-float ${
                    selectedVoice?.name === voice.name ? "ring-2 ring-purple-500" : ""
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-purple-900 text-sm">{voice.name}</h4>
                    {selectedVoice?.name === voice.name && (
                      <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-purple-600 font-medium px-2 py-1 bg-purple-100 rounded-full">
                    {voice.lang}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); previewVoice(voice); }}
                    className="mt-3 w-full py-2 rounded-lg text-sm font-medium transition-all bg-purple-100 text-purple-700 hover:bg-purple-200">
                    ▶ Preview
                  </button>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Memory Modal */}
      {showMemory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in" onClick={() => setShowMemory(false)}>
          <div className="glass rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold gradient-text mb-4 flex items-center gap-3">
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Memory
            </h3>
            <p className="text-purple-700 whitespace-pre-wrap leading-relaxed mb-6">
              {memory?.summary ?? "Nothing yet — keep chatting and memory builds automatically!"}
            </p>
            <p className="text-sm text-purple-500 mb-6 font-medium">{memory?.messageCount ?? 0} messages stored</p>
            <button className="w-full py-4 gradient-purple-pink hover:opacity-90 rounded-2xl text-white font-semibold transition-all btn-glow"
              onClick={() => setShowMemory(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
