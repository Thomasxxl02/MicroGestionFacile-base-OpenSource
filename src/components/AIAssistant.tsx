import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { generateAssistantResponse } from '../services/geminiService';
import { Send, Bot, User, Sparkles, MessageSquare, AlertCircle } from 'lucide-react';

import { useUserProfile } from '../hooks/useData';

const AIAssistant: React.FC = () => {
  const { profile: userProfile } = useUserProfile();
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      role: 'model',
      content:
        "Bonjour ! Je suis votre assistant administratif virtuel. Je peux vous aider avec vos questions sur le statut auto-entrepreneur, les déclarations URSSAF, ou la rédaction de courriers. Comment puis-je vous aider aujourd'hui ?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build context from last few messages
    const context = messages
      .slice(-3)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const responseText = await generateAssistantResponse(
      userMsg.content,
      context,
      userProfile.geminiKey
    );

    const modelMsg: ChatMessage = { role: 'model', content: responseText, timestamp: Date.now() };
    setMessages((prev) => [...prev, modelMsg]);
    setIsLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] max-w-5xl mx-auto flex flex-col bg-card dark:bg-card rounded-[3rem] shadow-premium border border-border overflow-hidden animate-fade-in">
      <div className="bg-gradient-to-r from-primary to-indigo-600 p-8 flex items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 bg-white/20 backdrop-blur-xl rounded-[1.5rem] shadow-premium border border-white/10">
            <Sparkles className="text-white" size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-white font-black text-2xl tracking-tighter">IA Assistant</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <p className="text-primary-foreground/70 text-[10px] font-black uppercase tracking-[0.2em]">
                Live • Google Gemini Engine
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-muted/30 dark:bg-muted/5 scroll-smooth scrollbar-hide">
        {!userProfile.geminiKey && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex items-start gap-4 text-amber-600 dark:text-amber-400">
            <AlertCircle className="shrink-0 mt-1" size={22} strokeWidth={2.5} />
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest">Clé API manquante</p>
              <p className="text-sm font-medium opacity-80 leading-relaxed">
                Veuillez configurer votre clé API Google Gemini dans les <strong>Paramètres</strong>{' '}
                pour activer l'assistant intelligent.
              </p>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`
              w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-soft border-2
              ${msg.role === 'user' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-primary/20 text-primary'}
            `}
            >
              {msg.role === 'user' ? (
                <User size={22} strokeWidth={2.5} />
              ) : (
                <Bot size={22} strokeWidth={2.5} />
              )}
            </div>

            <div
              className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`
                px-6 py-4 text-[13px] font-bold leading-relaxed whitespace-pre-wrap shadow-premium
                ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-[2rem] rounded-tr-sm'
                    : 'bg-card text-foreground rounded-[2rem] rounded-tl-sm border border-border'
                }
                `}
              >
                {msg.content}
              </div>
              <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-2 px-2 opacity-40">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white border-2 border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-soft">
              <Bot size={22} strokeWidth={2.5} />
            </div>
            <div className="bg-card px-6 py-5 rounded-[2rem] rounded-tl-sm border border-border shadow-premium">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-duration:0.6s]"></div>
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:-.15s]"></div>
                <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce [animation-duration:0.6s] [animation-delay:-.3s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-8 bg-card border-t border-border">
        <form onSubmit={handleSend} className="relative flex gap-4">
          <div className="relative flex-1 group">
            <input
              type="text"
              className="w-full pl-6 pr-14 py-5 bg-muted/30 border-none rounded-[2rem] focus:ring-4 focus:ring-primary/10 focus:bg-card outline-none transition-all text-foreground font-bold border border-transparent focus:border-primary/20 placeholder:font-normal placeholder:opacity-40"
              placeholder="Posez une question à l'IA..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center hover:bg-primary/90 disabled:opacity-0 disabled:translate-x-4 transition-all duration-300 shadow-premium"
            >
              <Send size={20} strokeWidth={2.5} />
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <MessageSquare size={12} strokeWidth={2.5} />
            Vérifiez les données cruciales. AI Engine 3.0 Gemini.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
