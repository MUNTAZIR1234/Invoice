
import { GoogleGenAI } from "@google/genai";

// Standardize API Key retrieval for both development and production
const getAI = () => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Please set API_KEY in your environment variables.");
  }
  
  return new GoogleGenAI({ apiKey });
};

export const generateCommunication = async (tenantName: string, amount: number) => {
  const ai = getAI();
  const prompt = `Write a polite and professional message to a tenant named ${tenantName} regarding their latest rental invoice of ₹${amount}. Format as a short email.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a professional property manager assistant specializing in tenant relations."
      }
    });
    return response.text || "Failed to generate message.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating AI response.";
  }
};

export const getFinancialInsights = async (data: any) => {
  const ai = getAI();
  const prompt = `Analyze this property data and provide 3 key insights for the landlord. Data: ${JSON.stringify(data)}. Focus on portfolio efficiency, occupancy, and asset distribution. Use ₹ for currency.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a financial advisor for real estate investors. Provide concise, actionable insights."
      }
    });
    return response.text || "No insights available.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating insights.";
  }
};
