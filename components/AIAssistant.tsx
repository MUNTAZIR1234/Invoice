
import React, { useState, useRef, useEffect } from 'react';
import { getFinancialInsights } from '../services/geminiService';
import { Tenant, Invoice, Property } from '../types';
import { GoogleGenAI } from "@google/genai";

interface AIAssistantProps {
  tenants: Tenant[];
  invoices: Invoice[];
  properties: Property[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ tenants, invoices, properties }) => {
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([
    { role: 'ai', text: 'Hello! I am your QUEENS CHAMBERS Assistant. I can analyze your portfolio, draft tenant messages, or answer questions about your property finances. How can I help today?' }
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
      const context = { tenants, invoices, properties };
      const prompt = `You are a professional property management assistant for "QUEENS CHAMBERS". Use this data: ${JSON.stringify(context)}. Question: ${userText}`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Be helpful, professional, and concise. Format lists with bullet points. If asked about finances, provide specific numbers from the data provided in Rupees (₹)."
        }
      });

      setMessages(prev => [...prev, { role: 'ai', text: response.text || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI. Please check your system configuration." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col animate-in fade-in duration-500">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-slate-900">AI Assistant</h2>
        <p className="text-slate-500 mt-1">Chat with Gemini about your property portfolio.</p>
      </header>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-800'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-100 px-4 py-3 rounded-2xl flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.5s]"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 bg-slate-50">
          <form onSubmit={handleSend} className="flex gap-3">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me anything... (e.g. 'Who owes the most rent?')"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              Send 🚀
            </button>
          </form>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {['Portfolio Summary', 'Draft Late Rent Note', 'Collection Analysis'].map(suggest => (
              <button 
                key={suggest}
                onClick={() => { setInput(suggest); }}
                className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all"
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
