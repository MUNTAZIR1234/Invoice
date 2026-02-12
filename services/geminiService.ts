
import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWhatsAppReminder = async (tenantName: string, amount: number, id: string, dueDate: string) => {
  const ai = getAI();
  const prompt = `Draft a very short, polite WhatsApp message for a tenant named ${tenantName} regarding Invoice ${id}. 
  The amount is ₹${amount.toLocaleString()} and it was due on ${dueDate}. 
  Keep it professional, friendly, and under 40 words. Mention the bank details are in the PDF.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are an assistant for Queens Chambers property management. Your tone is respectful but firm regarding payments."
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Dear ${tenantName}, friendly reminder for invoice ${id} of ₹${amount}. Please check your email for the PDF. Thanks!`;
  }
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
