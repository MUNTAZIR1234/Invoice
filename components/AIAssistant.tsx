import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Tenant, Invoice, Property } from '../types';

interface AIAssistantProps {
  tenants: Tenant[];
  invoices: Invoice[];
  properties: Property[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ tenants, invoices, properties }) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Welcome to QUEENS CHAMBERS AI Assistant. I have live access to your tenants, invoices, and assets. How can I help you optimize your portfolio today?' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = {
        stats: {
          totalProperties: properties.length,
          occupiedProperties: tenants.length,
          totalRevenue: invoices.reduce((s, i) => s + i.totalAmount, 0),
        },
        properties: properties.map(p => ({ name: p.name, type: p.type })),
        tenants: tenants.map(t => ({ name: t.name, property: properties.find(p => p.id === t.propertyId)?.name })),
      };

      const prompt = `System: You are the intelligent portfolio assistant for Queens Chambers. 
Context Data: ${JSON.stringify(context)}.
Question: ${userText}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "You are professional, concise, and insightful. Format numerical values with ₹. Use bullet points for structured information. If data is missing, state it politely. Focus on real estate and financial efficiency."
        }
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process your request." }]);
    } catch (error) {
      console.error("Gemini Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Service temporary unavailable. Please verify your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">AI Portfolio Analyst</h2>
        <p className="text-slate-500 mt-1 font-medium">Real-time insights powered by Gemini 3 Flash.</p>
      </header>

      <div className="flex-1 bg-white rounded-[2rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-6 py-4 rounded-2xl text-[13px] leading-relaxed shadow-sm transition-all ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white font-semibold rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                <p className="whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-50 px-6 py-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-2 items-center">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-100">
          <form onSubmit={handleSend} className="flex gap-4">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask for a financial summary or tenant status..."
              className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium shadow-sm bg-white"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center gap-2 active:scale-95 shadow-xl shadow-slate-900/10"
            >
              Consult
            </button>
          </form>
          <div className="flex gap-2 mt-6 overflow-x-auto no-scrollbar pb-1">
            {['Revenue Report', 'Occupancy Analysis', 'Draft Rent Reminder'].map(suggest => (
              <button 
                key={suggest}
                onClick={() => setInput(suggest)}
                className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
              >
                {suggest}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};