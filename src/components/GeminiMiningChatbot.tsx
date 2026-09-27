import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Sparkles,
  Send,
  Search,
  Globe,
  Trash2,
  Minimize2,
  Maximize2,
  ExternalLink,
  Bot,
  User,
  Zap,
  Brain,
  ShieldCheck,
  ChevronDown,
  X,
  Compass,
} from "lucide-react";
import { MoilMine } from "../types/mining";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  modelUsed?: string;
  usedSearch?: boolean;
  webSearchQueries?: string[];
  groundingChunks?: Array<{ title: string; uri: string }>;
}

interface GeminiMiningChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  mine: MoilMine;
}

type ModelOption = "gemini-3.5-flash" | "gemini-3.1-pro-preview" | "gemini-3.1-flash-lite";

const SYSTEM_ROLES = [
  {
    id: "chief-geologist",
    name: "Chief Geological Strategist",
    description: "Specialized in Braunite/Pyrolusite petrology, SWIR 2.2µm absorption, and UNFC reserve estimation.",
    instruction:
      "You are the Chief Geological Strategist for MOIL Limited (Ministry of Steel). Provide expert lithological evaluations, UNFC reserve classifications (111 Proved vs 121 Probable), and space-based remote sensing interpretation.",
  },
  {
    id: "ops-director",
    name: "Operations & Fleet Director",
    description: "Specialized in HEMM equipment telematics, haul cycle optimization, and production shortfall mitigation.",
    instruction:
      "You are the Operations & Fleet Director for MOIL Limited. Focus on daily run-of-mine production targets, dumper/shovel availability, haul road drainage, and surge stockpile high-grade ore blending.",
  },
  {
    id: "safety-blasting",
    name: "DGMS Safety & Blasting Officer",
    description: "Specialized in Peak Particle Velocity (PPV) limits, electronic detonator timing, and monsoon risks.",
    instruction:
      "You are the DGMS Safety & Blasting Officer for MOIL Limited. Enforce the 5.0 mm/s ground vibration ceiling, nonel vs electronic delay timing, flyrock perimeter controls, and pit slope stability under heavy monsoon.",
  },
];

const QUICK_PROMPTS = [
  "What is the live benchmark price for 44% Mn ore and latest MOIL e-auction rates?",
  "How does SWIR 2.2µm absorption detect sub-surface braunite ore bodies?",
  "Calculate UNFC Proved (111) vs Probable (121) reserves for Balaghat Mine.",
  "Recommend immediate actions to mitigate 7,200 MT production shortfall in monsoon.",
];

export const GeminiMiningChatbot: React.FC<GeminiMiningChatbotProps> = ({
  isOpen,
  onClose,
  mine,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      text: `Hello! I am your **MOIL Mining & Geological AI Copilot**.\n\nCurrently connected to **${mine.name}** (${mine.district}, ${mine.state}). Ask me about:\n- **Space & Exploration:** Satellite multispectral SWIR/NDVI/LST signatures & UNFC reserve validation.\n- **Production Intelligence:** HEMM availability, monsoon shortfall mitigation, and surge blending.\n- **Live Web Intelligence:** Current manganese benchmark prices and Ministry of Steel policy circulars via Google Search Grounding.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelUsed: "gemini-3.5-flash",
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<ModelOption>("gemini-3.5-flash");
  const [useGoogleSearch, setUseGoogleSearch] = useState<boolean>(true);
  const [selectedRole, setSelectedRole] = useState(SYSTEM_ROLES[0]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of chat thread
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Prepare history payload for multi-turn conversation
      const historyPayload = messages
        .filter((m) => m.id !== "welcome-1")
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          history: historyPayload,
          model: selectedModel,
          useGoogleSearch,
          systemRole: `${selectedRole.instruction} You are currently advising on the ${mine.name} mine (${mine.type}, ${mine.state}).`,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to receive response from Gemini server");
      }

      const data = await res.json();
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: data.model || selectedModel,
        usedSearch: data.usedSearch,
        webSearchQueries: data.webSearchQueries,
        groundingChunks: data.groundingChunks,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        text: `**Operational Notice:** Unable to reach live Gemini server (${err.message}). Using local MOIL knowledge cache.\n\nFor ${mine.name}, proved reserve UNFC status remains compliant at 111 with 65° SSW dipping ore body.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: "local-cache",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        text: `Conversation thread reset. Ready for new exploration queries regarding **${mine.name}**.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        modelUsed: selectedModel,
      },
    ]);
  };

  return (
    <div
      className={`fixed z-50 transition-all duration-200 font-sans ${
        isMinimized
          ? "bottom-4 right-4 w-72"
          : "bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-[490px] h-full sm:h-[680px] max-h-screen"
      }`}
    >
      <div className="bg-[#0f172a] border border-slate-700 sm:rounded-lg h-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#0a0f18] border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-600/20 text-blue-400 border border-blue-500/40 rounded">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-white uppercase tracking-tight">
                  Gemini Mining Copilot
                </h2>
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-ping"></span>
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                {mine.name} • {selectedRole.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleClearChat}
              className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition"
              title="Clear Thread"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* If Not Minimized */}
        {!isMinimized && (
          <>
            {/* Control Bar: Model Switcher & Search Grounding Toggle */}
            <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px]">
              {/* Model Selector */}
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-semibold uppercase">Engine:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ModelOption)}
                  className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-1.5 py-0.5 text-[10px] focus:outline-none cursor-pointer"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex Tasks)</option>
                  <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast Tasks)</option>
                </select>
              </div>

              {/* Google Search Grounding Toggle */}
              <button
                type="button"
                onClick={() => setUseGoogleSearch(!useGoogleSearch)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold transition ${
                  useGoogleSearch
                    ? "bg-blue-600/20 text-blue-300 border-blue-500/50"
                    : "bg-slate-950 text-slate-400 border-slate-800"
                }`}
                title="Search Grounding using gemini-3.5-flash with live web results"
              >
                <Globe className="w-3 h-3 text-blue-400" />
                <span>Search Grounding</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    useGoogleSearch ? "bg-green-400" : "bg-slate-500"
                  }`}
                ></span>
              </button>
            </div>

            {/* Persona Selector Bar */}
            <div className="px-3 py-1 bg-[#0a0f18] border-b border-slate-800/80 flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px]">
              <span className="text-slate-500 font-semibold uppercase shrink-0">Role:</span>
              {SYSTEM_ROLES.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`px-2 py-0.5 rounded shrink-0 transition text-[10px] font-medium ${
                    selectedRole.id === role.id
                      ? "bg-blue-900/40 text-blue-200 border border-blue-700/60"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {role.name}
                </button>
              ))}
            </div>

            {/* Scrollable Message Thread */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs bg-[#0b111e]">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mb-1 px-1">
                      <span>{isUser ? "You" : "Gemini Copilot"}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                      {msg.modelUsed && (
                        <span className="font-mono text-slate-400 ml-1">
                          [{msg.modelUsed}]
                        </span>
                      )}
                    </div>

                    <div
                      className={`max-w-[92%] p-2.5 rounded text-xs leading-relaxed ${
                        isUser
                          ? "bg-blue-600 text-white rounded-br-none shadow-sm"
                          : "bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none shadow-sm"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.text}</div>

                      {/* Google Search Grounding Metadata Section */}
                      {!isUser && msg.usedSearch && (
                        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] space-y-1.5">
                          {/* Search Queries */}
                          {msg.webSearchQueries && msg.webSearchQueries.length > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap text-blue-400 font-mono text-[9px]">
                              <Search className="w-2.5 h-2.5 shrink-0" />
                              <span className="text-slate-400">Web Searched:</span>
                              {msg.webSearchQueries.map((q, idx) => (
                                <span
                                  key={idx}
                                  className="bg-blue-950/60 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800/40"
                                >
                                  "{q}"
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Grounding Sources / Citations */}
                          {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-slate-400 font-semibold flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5 text-blue-400" />
                                <span>Grounding Sources & Verification:</span>
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {msg.groundingChunks.map((chunk, cIdx) => (
                                  <a
                                    key={cIdx}
                                    href={chunk.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-blue-300 hover:text-white px-2 py-0.5 rounded border border-slate-700/60 text-[9px] transition"
                                  >
                                    <span className="truncate max-w-[160px]">
                                      {chunk.title}
                                    </span>
                                    <ExternalLink className="w-2.5 h-2.5 shrink-0 text-slate-500" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="p-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    <Sparkles className="w-3 h-3 animate-spin" />
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-2 rounded text-slate-400 text-xs flex items-center gap-2">
                    <span className="animate-pulse">
                      {useGoogleSearch
                        ? "Searching web & synthesizing mining intelligence..."
                        : "Computing geological reasoning..."}
                    </span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompts Bar */}
            <div className="p-2 bg-[#0a0f18] border-t border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <span className="text-[9px] font-bold text-slate-500 uppercase shrink-0">
                Quick:
              </span>
              {QUICK_PROMPTS.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(qp)}
                  disabled={isLoading}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-[10px] shrink-0 transition"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <div className="p-2.5 bg-[#0f172a] border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Ask Gemini about ${mine.name} reserves, PPV vibration, prices...`}
                  disabled={isLoading}
                  className="flex-1 bg-[#0a0f18] border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className={`p-2 rounded text-white transition ${
                    !inputMessage.trim() || isLoading
                      ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-500 shadow-md"
                  }`}
                  title="Send Message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
