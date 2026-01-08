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
    { role: 'ai', text: 'Welcome to the QUEENS CHAMBERS Intelligent Assistant. I have analyzed your portfolio of ' + properties.length + ' assets. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        portfolio: {
          totalProperties: properties.length,
          tenants: tenants.length,
          revenue: invoices.reduce((s, i) => s + i.totalAmount, 0),
          types: properties.reduce((acc: any, p) => { acc[p.type] = (acc[p.type] || 0) + 1; return acc; }, {})
        }
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context: ${JSON.stringify(context)}. User: ${userText}`,
        config: {
          systemInstruction: "You are an elite property manager. Be professional, direct, and data-driven. Use ₹ for currency. Provide insights on occupancy, rental yield, and tenant relations. Format with clean bullet points."
        }
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "I apologize, I could not process that request." }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Portfolio synchronization failed. Please check your network." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-6">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Portfolio Analyst</h2>
        <p className="text-slate-500 font-medium">Real-time property insights and automation.</p>
      </header>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/5 border border-slate-50 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] px-7 py-5 rounded-3xl text-[13px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white font-bold rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 p-4 bg-slate-50 rounded-2xl w-fit animate-pulse">
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-8 bg-slate-50/50 border-t border-slate-50">
          <form onSubmit={handleSend} className="flex gap-4">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about revenue, vacancies, or draft a notice..."
              className="flex-1 px-8 py-5 rounded-[1.5rem] bg-white border border-slate-100 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all shadow-sm"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-slate-900 text-white px-10 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-600 shadow-xl disabled:opacity-50 transition-all active:scale-95"
            >
              Analyze
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};