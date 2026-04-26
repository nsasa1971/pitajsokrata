"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Sidebar from "@/components/Sidebar";
import type { User } from "@supabase/supabase-js";
import type { Message } from "@/types";

export default function ChatPage() {
  const router = useRouter();
  const supabase = createClient();

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Anonimni limit
  const [dailyTurnsUsed, setDailyTurnsUsed] = useState(0);
  const [lastSessionDate, setLastSessionDate] = useState<string>("");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [finalInsights, setFinalInsights] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [turnsInSession, setTurnsInSession] = useState(0);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Provera auth pri učitavanju
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setAuthChecked(true);

      if (data.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("is_pro")
          .eq("id", data.user.id)
          .single();
        setIsPro(userData?.is_pro || false);
      } else {
        const today = new Date().toISOString().split("T")[0];
        const stored = localStorage.getItem("sokrat_daily");
        if (stored) {
          const { date, turns } = JSON.parse(stored);
          if (date === today) {
            setDailyTurnsUsed(turns);
          } else {
            setDailyTurnsUsed(0);
            localStorage.setItem("sokrat_daily", JSON.stringify({ date: today, turns: 0 }));
          }
        } else {
          localStorage.setItem("sokrat_daily", JSON.stringify({ date: today, turns: 0 }));
        }
        setLastSessionDate(today);
      }
    };
    checkAuth();
  }, [supabase]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const canSend = () => {
    if (loading) return false;
    if (user) return true;
    return dailyTurnsUsed < 3;
  };

  const turnsRemaining = user ? -1 : Math.max(0, 3 - dailyTurnsUsed);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || !canSend()) return;

    setError(null);
    const content = input.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId: user?.id || "anonymous",
          sessionId: currentSessionId,
          isPro: user ? isPro : false,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.is_limit_reached) {
          setError("Iskoristio si sve besplatne razmene za danas. Prijavi se za neograničeno.");
        } else {
          setError(data.message || data.error || "Došlo je do greške.");
        }
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
        setLoading(false);
        return;
      }

      const sokratMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        turnNumber: data.turn_number,
        isFinal: data.is_final,
        insights: data.insights,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, sokratMessage]);
      setTurnsInSession(data.turn_number);
      if (data.sessionId) setCurrentSessionId(data.sessionId);

      if (!user) {
        const today = new Date().toISOString().split("T")[0];
        const newTurns = dailyTurnsUsed + 1;
        setDailyTurnsUsed(newTurns);
        localStorage.setItem("sokrat_daily", JSON.stringify({ date: today, turns: newTurns }));
      }

      if (data.is_final && data.insights.length > 0) {
        setFinalInsights(data.insights);
        setShowSummary(true);
      }
    } catch (err: unknown) {
      setError("Greška pri povezivanju sa serverom.");
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, canSend, user, currentSessionId, dailyTurnsUsed, isPro, supabase]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowSummary(false);
    setFinalInsights([]);
    setError(null);
    setCurrentSessionId(null);
    setTurnsInSession(0);
  };

  const handleSelectSession = async (sessionId: string) => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("id", sessionId)
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      const loaded: Message[] = [];
      data.forEach((row: any) => {
        if (row.message_user) {
          loaded.push({
            id: `user-${row.id}`,
            role: "user",
            content: row.message_user,
            timestamp: new Date(row.created_at),
          });
        }
        if (row.message_sokrat) {
          loaded.push({
            id: `sokrat-${row.id}`,
            role: "assistant",
            content: row.message_sokrat,
            turnNumber: row.turn_number,
            isFinal: row.is_final,
            insights: row.insights || [],
            timestamp: new Date(row.created_at),
          });
        }
      });
      setMessages(loaded);
      setCurrentSessionId(sessionId);
      setTurnsInSession(data[data.length - 1]?.turn_number || 0);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsPro(false);
    handleNewChat();
  };

  if (!authChecked) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0a0a0b]">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-amber-400 rounded-full typing-dot"></span>
          <span className="w-2 h-2 bg-amber-400 rounded-full typing-dot"></span>
          <span className="w-2 h-2 bg-amber-400 rounded-full typing-dot"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-[#0a0a0b]">
      {/* Sidebar */}
      <Sidebar
        user={user}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        currentSessionId={currentSessionId}
      />

      {/* Glavni deo */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="border-b border-gray-800/50 bg-[#0d0d0f] px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <a
              href="/"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg shadow-lg shadow-amber-500/20 hover:opacity-90 transition-opacity flex-shrink-0"
            >
              🏛️
            </a>
            <div className="min-w-0">
              <h1 className="font-semibold text-sm sm:text-lg text-white truncate">PitajSokrata.com</h1>
              <p className="text-[10px] sm:text-xs text-gray-500">
                {user
                  ? isPro
                    ? "✨ Pro – neograničeno"
                    : "🔒 Prijavljen"
                  : `Besplatno: ${turnsRemaining} razmena danas`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {!user ? (
              <button
                onClick={() => router.push("/login")}
                className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Prijavi se
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white text-xs sm:text-sm transition-colors bg-gray-800/50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl"
              >
                Odjavi se
              </button>
            )}
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="bg-red-900/30 border-b border-red-800/50 text-red-300 px-4 py-2 sm:py-3 text-xs sm:text-sm text-center">
            {error}
          </div>
        )}

        {/* Limit warning */}
        {!user && turnsRemaining <= 1 && turnsRemaining >= 0 && (
          <div className="bg-amber-900/20 border-b border-amber-800/30 text-amber-300 px-4 py-2 text-[11px] sm:text-xs text-center">
            {turnsRemaining === 1
              ? "Još 1 besplatna razmena danas."
              : "Nemaš više besplatnih razmena."}{" "}
            <button onClick={() => router.push("/login")} className="underline font-medium">
              Prijavi se za neograničeno
            </button>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-4xl mx-auto w-full chat-messages">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-600">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mx-auto">
                  <span className="text-4xl sm:text-5xl">🏛️</span>
                </div>
                <p className="text-lg sm:text-xl font-medium text-gray-400">Opiši šta te muči.</p>
                <p className="text-xs sm:text-sm text-gray-600">Sokrat sluša.</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2 sm:gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm sm:text-base flex-shrink-0 shadow-md">
                  🏛️
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
                <div
                  className={`rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-br-lg"
                      : "bg-[#1a1a1e] text-gray-200 rounded-bl-lg border border-gray-800/30"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
                <button
                  onClick={() => handleCopy(msg.content, msg.id)}
                  className="text-gray-600 hover:text-gray-400 text-[10px] sm:text-xs mt-1 sm:mt-1.5 transition-colors px-1"
                >
                  {copiedId === msg.id ? "✓ Kopirano" : "📋 Kopiraj"}
                </button>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-700 flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0 text-gray-300">
                  {user ? user.email?.charAt(0).toUpperCase() : "?"}
                </div>
              )}
            </div>
          ))}

          {/* Sokrat kuca */}
          {loading && (
            <div className="flex gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-sm sm:text-base flex-shrink-0 shadow-md">
                🏛️
              </div>
              <div className="bg-[#1a1a1e] border border-gray-800/30 rounded-2xl rounded-bl-lg px-4 sm:px-5 py-3 sm:py-3.5">
                <div className="flex gap-1 sm:gap-1.5">
                  <span className="w-2 h-2 bg-amber-400 rounded-full typing-dot"></span>
                  <span className="w-2 h-2 bg-amber-400 rounded-full typing-dot"></span>
                  <span className="w-2 h-2 bg-amber-400 rounded-full typing-dot"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-800/50 bg-[#0d0d0f] px-3 sm:px-4 py-3 sm:py-4 chat-input-area">
          <div className="max-w-4xl mx-auto">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                loading
                  ? "Sokrat razmišlja..."
                  : !canSend()
                  ? "Iskoristio si besplatne razmene. Prijavi se!"
                  : "Opiši šta te muči... (Enter za slanje)"
              }
              disabled={loading || !canSend()}
              rows={1}
              className="w-full bg-[#1a1a1e] border border-gray-700/50 text-gray-100 placeholder:text-gray-500 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 resize-none min-h-[48px] sm:min-h-[52px] max-h-[200px] text-sm focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all disabled:opacity-40"
            />
            <p className="text-gray-600 text-[10px] sm:text-xs mt-1.5 text-center">
              Enter za slanje • Shift+Enter za novi red
            </p>
          </div>
        </div>

        {/* Summary Modal */}
        {showSummary && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#0d0d0f] border border-gray-800 rounded-2xl p-5 sm:p-6 max-w-lg w-full space-y-4 sm:space-y-5 shadow-2xl">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center mx-auto">
                  <span className="text-2xl sm:text-3xl">🏛️</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Evo šta si otkrio</h2>
                <p className="text-gray-500 text-xs sm:text-sm">Ove uvide si sam izneo tokom razgovora.</p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                {finalInsights.map((insight, i) => (
                  <div
                    key={i}
                    className="bg-[#1a1a1e] border border-gray-800/30 rounded-xl p-3 sm:p-4 flex gap-2 sm:gap-3 items-start"
                  >
                    <span className="text-base sm:text-lg flex-shrink-0 mt-0.5">💡</span>
                    <p className="text-gray-300 text-xs sm:text-sm leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleNewChat}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded-xl px-5 py-3 sm:py-3.5 font-semibold transition-all duration-200 shadow-lg shadow-amber-500/20 text-sm sm:text-base"
              >
                🔄 Novi razgovor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}