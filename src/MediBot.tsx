import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";

interface Message {
  id: string;
  role: "user" | "assistant" | "thinking";
  content: string;
  timestamp: number;
  isComplete?: boolean;
}

export function MediBot() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentMedicine, setCurrentMedicine] = useState<string | null>(null);
  
  const conversation = useQuery(api.medibot.getConversation);
  const sendMessage = useMutation(api.medibot.sendMessage);
  const getMedicineInfo = useAction(api.medibot.getMedicineInfo);
  const clearConversation = useMutation(api.medibot.clearConversation);

  const messages = conversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
    // Try to capture corrected medicine name from the latest assistant message
    const lastAssistant = messages.filter(m => m.role === "assistant").pop();
    if (lastAssistant) {
      const text = lastAssistant.content;
      const corrMatch = text.match(/i guess you are reffering to\s+"([^"]+)"/i);
      if (corrMatch) {
        setCurrentMedicine(corrMatch[1].trim());
        return;
      }
      const headerMatch = text.match(/\*\*([^*]+)\*\*/); // bold header
      if (headerMatch) {
        setCurrentMedicine(headerMatch[1].trim());
      }
    }
  }, [messages]);

  const detectQuickAction = (text: string): string | null => {
    const t = text.toLowerCase();
    if (/\buses\b|\bwhat\s+is\b/.test(t)) return "Uses";
    if (/\bside\s*effects\b|\bany\s*side\s*effects\b/.test(t)) return "Side Effects";
    if (/\binteractions\b|\bdrug\s*interactions\b|\balcohol\b/.test(t)) return "Interactions";
    if (/\bprecautions\b|\bis\s*it\s*safe\b/.test(t)) return "Precautions";
    if (/\bhow\s*to\s*(use|take)\b|\busage\b|\bdos(e|ing)\b/.test(t)) return "How to Take";
    return null;
  };

  const isLikelyMedicineQuery = (text: string) => {
    const t = text.toLowerCase().trim();
    const hasDose = /(\b\d+\s*(mg|ml|mcg|g)\b)/.test(t);
    const hasForm = /(tablet|tab|capsule|syrup|injection)/.test(t);
    const looksName = t.split(/\s+/).length <= 3; // short name or brand
    const mentionsMedicine = /(medicine|drug|tablet|capsule|side\s*effects|interactions|precautions|how\s*to\s*(use|take))/i.test(t);
    return hasDose || hasForm || looksName || mentionsMedicine;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput("");
    setIsLoading(true);

    try {
      await sendMessage({ content: userInput });
      const qa = detectQuickAction(userInput);
      if (qa && currentMedicine) {
        await getMedicineInfo({ medicine: currentMedicine, quickAction: qa });
      } else {
        // Route all queries through medicine flow to restore original behavior
        await getMedicineInfo({ medicine: userInput });
        setCurrentMedicine(userInput);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = async (_medicine: string, action: string) => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const med = currentMedicine || _medicine;
      await sendMessage({ content: `${action} for ${med}` });
      await getMedicineInfo({ 
        medicine: med, 
        quickAction: action 
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    "Uses",
    "Side Effects", 
    "Interactions",
    "Precautions",
    "How to Take"
  ];

  const renderMessage = (message: Message) => {
    if (message.role === "thinking") {
      return (
        <div className="flex justify-start mb-4">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 text-slate-700 rounded-xl rounded-bl-md px-4 py-3 max-w-xs lg:max-w-md dark:from-indigo-900/30 dark:to-purple-900/30 dark:border-indigo-700 dark:text-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤔</span>
              <span className="font-semibold text-sm text-slate-800 dark:text-slate-100">MediBot is thinking...</span>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-300">
              {message.content}
            </div>
            {!message.isComplete && (
              <div className="flex items-center gap-1 mt-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex mb-4 animate-fade-in ${message.role === "user" ? "justify-end" : "justify-start"}`}
        style={{
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl transition-all duration-300 hover:scale-[1.02] transform ${
            message.role === "user"
              ? "bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-br-md shadow-lg hover:shadow-xl"
              : "bg-white text-slate-800 rounded-bl-md shadow-md border border-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700 hover:shadow-lg"
          }`}
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </div>
          <div className={`text-xs mt-2 ${
            message.role === "user" ? "text-slate-300" : "text-slate-500 dark:text-slate-400"
          }`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-white p-6 border-b border-slate-600 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">💊</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">MediBot</h1>
              <p className="text-slate-300 text-sm">AI-Powered Medicine Assistant</p>
            </div>
          </div>
          <button
            onClick={() => clearConversation()}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 text-sm font-medium border border-white/20 hover:border-white/30 hover:scale-105 active:scale-95 transform"
          >
            Clear Chat
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-900/50">
        {messages.length === 0 && (
          <div className="text-center text-slate-500 dark:text-slate-400 py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">👋</span>
            </div>
            <p className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Welcome to MediBot</p>
            <p className="text-slate-600 dark:text-slate-300 mb-4 max-w-md mx-auto">
              Ask me about any medicine and I'll provide safe, clear information with my thinking process.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                "What is aspirin?"
              </span>
              <span className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-sm">
                "Tell me about ibuprofen"
              </span>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id}>
            {renderMessage(message)}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length > 0 && messages[messages.length - 1]?.role === "user" && (
        <div className="px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action}
                onClick={() => {
                  const lastUserMessage = messages.filter(m => m.role === "user").pop();
                  if (lastUserMessage) {
                    handleQuickAction(lastUserMessage.content, action);
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-all duration-300 disabled:opacity-50 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about any medicine... (e.g., 'What is aspirin?')"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-300 hover:border-slate-400 dark:hover:border-slate-500 focus:scale-[1.02] transform"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transform"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              "Ask"
            )}
          </button>
        </form>

        {/* Disclaimer */}
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-900/20 dark:border-amber-700/50">
          <p className="text-xs text-amber-800 dark:text-amber-200">
            <strong>⚠️ Important:</strong> This is general information only. Always consult a healthcare professional before taking or stopping any medicine. In case of emergency, contact your doctor or hospital immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
