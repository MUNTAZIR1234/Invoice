import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Tenant, Invoice, Property } from '../types';

interface AIAssistantProps {
  tenants: Tenant[];
  invoices: Invoice[];
  properties: Property[];
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ tenants, invoices, properties }) => {
  const [insight, setInsight] = useState<string>('Ready to analyze your portfolio.');
  const [loading, setLoading] = useState(false);

  const analyzePortfolio = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const context = {
        properties: properties.length,
        tenants: tenants.length,
        revenue: invoices.reduce((s, i) => s + i.totalAmount, 0)
      };
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this property data and provide 3 key professional insights. Data: ${JSON.stringify(context)}`,
        config: {
          systemInstruction: "You are a real estate investment analyst. Use ₹ for currency. Be professional and data-driven."
        }
      });
      setInsight(response.text || 'No data found.');
    } catch (e) {
      setInsight('AI Analysis failed. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">AI Insights</h2>
        <p className="text-slate-500 font-medium">Algorithmic analysis of your property holdings.</p>
      </header>

      <div className="bg-indigo-600 rounded-[3rem] p-12 text-white shadow-2xl shadow-indigo-200">
        <h3 className="text-2xl font-black mb-6">Strategic Overview</h3>
        <div className="bg-white/10 backdrop-blur-md rounded-[2rem] p-8 min-h-[200px] text-lg leading-relaxed font-medium">
          {loading ? 'Analyzing your assets...' : insight}
        </div>
        <button 
          onClick={analyzePortfolio}
          disabled={loading}
          className="mt-8 bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Generate Analysis'}
        </button>
      </div>
    </div>
  );
};