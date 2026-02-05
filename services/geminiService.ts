import { GoogleGenAI, Type } from "@google/genai";
import { Property, DetailedFinancials } from "../types";

const GENERATION_MODEL = "gemini-2.0-flash-exp";
const REASONING_MODEL = "gemini-2.0-flash-thinking-exp";

// Helper to get client dynamically
const getClient = () => {
  const apiKey = localStorage.getItem("beaconhill_api_key");
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

// Retry logic for 429 Rate Limits
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.status === 429 || error.message?.includes('429'))) {
      console.warn(`Rate limit hit, retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const enrichPropertyData = async (address: string): Promise<Partial<Property>> => {
  try {
    const ai = getClient();
    const prompt = `
      I am a real estate investor looking at a property at: ${address}.
      Act as a real estate data analyst. 
      Estimate the following details for this property based on typical characteristics for this location in Massachusetts.
      Return JSON only.
    `;

    const apiCall = () => ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            city: { type: Type.STRING },
            zip: { type: Type.STRING },
            sqft: { type: Type.NUMBER },
            units: { type: Type.NUMBER },
            yearBuilt: { type: Type.NUMBER },
            description: { type: Type.STRING },
            estimatedMarketRent: { type: Type.NUMBER, description: "Estimated annual gross rent" },
            estimatedValue: { type: Type.NUMBER, description: "Estimated market value/price" }
          },
          required: ["city", "zip", "sqft", "yearBuilt", "description"],
        },
      },
    });

    const response = await retryWithBackoff(apiCall);

    if (response.text) {
      const data = JSON.parse(response.text);

      // Default Assumptions
      const estimatedValue = data.estimatedValue || 1000000;
      const grossRent = data.estimatedMarketRent || 100000; // Annual

      // Construct DetailedFinancials
      const financials: DetailedFinancials = {
        grossPotentialRent: grossRent,
        otherIncome: grossRent * 0.03, // 3% misc income
        vacancyRate: 5,

        // Expenses
        propertyTax: estimatedValue * 0.012, // ~1.2% MA Tax
        insurance: (data.units || 3) * 1200, // Est per unit
        utilities: (data.units || 3) * 1500, // Est per unit
        repairsMaintenance: (data.units || 3) * 800,
        managementFee: 5, // 5%
        capitalReserves: (data.units || 3) * 300,

        // Acquisition
        purchasePrice: estimatedValue,
        closingCosts: estimatedValue * 0.02,
        renovationBudget: (data.units || 3) * 10000,
      };

      return {
        address: address,
        city: data.city,
        state: 'MA',
        zip: data.zip,
        sqft: data.sqft,
        units: data.units || 1,
        yearBuilt: data.yearBuilt,
        description: data.description,
        financials: financials
      };
    }
    return {};
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw error;
    console.error("Error enriching property data:", error);
    return {}; // Graceful fail
  }
};

export const generateValueAddPlan = async (property: Property): Promise<string> => {
  try {
    const ai = getClient();
    const context = JSON.stringify({
      address: property.address,
      type: property.assetClass,
      sqft: property.sqft,
      year: property.yearBuilt,
      financials: property.financials
    });

    const prompt = `
      You are a world-class CRE underwriter. Analyze this property in Massachusetts.
      Property Context: ${context}
      
      Identify 3 distinct "Value Unlock" strategies (Strategic, Operational, Financial).
      Focus on long-term hold and cash yield on unlevered cost.
      Be specific to Massachusetts market trends (e.g., biotech demand, student housing, historic tax credits, ADU laws).
      
      Format the output as Markdown.
    `;

    const apiCall = () => ai.models.generateContent({
      model: REASONING_MODEL,
      contents: prompt,
      config: {}
    });

    const response = await retryWithBackoff(apiCall);

    return response.text || "Unable to generate plan.";
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw error;
    console.error("Error generating value add plan:", error);
    return "Error contacting AI agent. Please try again later.";
  }
};

export const analyzeManagementTrends = async (property: Property): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `
      The user owns this property: ${property.address} (${property.assetClass}).
      Act as a property manager and strategist.
      Provide a brief update on:
      1. Current market rent trends in this specific MA submarket.
      2. Any new Tenant Laws in MA that might affect management.
      3. One operational tip to reduce expense ratio.
    `;

    const apiCall = () => ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const response = await retryWithBackoff(apiCall);

    // Check for grounding chunks
    let groundingText = "";
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const links = response.candidates[0].groundingMetadata.groundingChunks
        .map((c: any) => c.web?.uri)
        .filter(Boolean)
        .join('\n');
      if (links) groundingText = `\n\nSources:\n${links}`;
    }

    return (response.text || "No insights found.") + groundingText;
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw error;
    console.error("Error analyzing trends:", error);
    return "Error retrieving market data.";
  }
};

export const GeminiService = {
  generateText: async (prompt: string): Promise<string> => {
    try {
      const ai = getClient();
      const apiCall = () => ai.models.generateContent({
        model: GENERATION_MODEL,
        contents: prompt,
      });
      const response = await retryWithBackoff(apiCall);
      return response.text || "";
    } catch (error: any) {
      if (error.message === "API_KEY_MISSING") throw error;
      console.error("Gemini Generic Error:", error);
      return "";
    }
  }
};
