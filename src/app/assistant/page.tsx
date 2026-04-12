"use client";

import { useState, useRef, useEffect } from "react";
import { RegimeBadge } from "@/components/RegimeBadge";
import { SectorRotationCard } from "@/components/SectorRotationCard";

type Message = { role: "user" | "assistant"; content: string };

const QUICK_PROMPTS = [
  "What should I do today?",
  "What's my biggest risk right now?",
  "Review my last 5 trades",
  "Should I rotate sectors?",
  "Explain the current regime",
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v2/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply || "(no response)" }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-1">Quantamental Assistant</h1>
        <p className="text-sm text-zinc-400">Chat with your local Llama-powered portfolio analyst</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar — context */}
        <div className="space-y-4">
          <RegimeBadge />
          <SectorRotationCard />

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 mb-2">Quick prompts</div>
            <div className="space-y-1.5">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  disabled={loading}
                  className="block w-full text-left text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded px-2 py-1.5 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/30 flex flex-col h-[70vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-zinc-500 text-sm py-12">
                Ask me anything about your portfolio, the market, or specific tickers.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-500/20 text-white border border-blue-500/30"
                      : "bg-zinc-800/60 text-zinc-200 border border-zinc-700"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800/60 border border-zinc-700 rounded-2xl px-4 py-2.5 text-sm text-zinc-400">
                  <span className="inline-block animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask about your portfolio..."
                className="flex-1 bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
