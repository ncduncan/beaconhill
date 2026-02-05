import { GoogleGenAI, Type } from "@google/genai";
import { Property } from "../types";

const GENERATION_MODEL = "gemini-3-flash-preview"; // Or "gemini-1.5-flash"
const REASONING_MODEL = "gemini-3-pro-preview"; // Or "gemini-1.5-pro"

// Helper to get client dynamically
const getClient = () => {
  const apiKey = localStorage.getItem("beaconhill_api_key");
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
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

    const response = await ai.models.generateContent({
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

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        address: address,
        city: data.city,
        state: 'MA',
        zip: data.zip,
        sqft: data.sqft,
        units: data.units || 1,
        yearBuilt: data.yearBuilt,
        description: data.description,
        // Map estimated values to our financial structure partially
        financials: {
          purchasePrice: data.estimatedValue || 1000000,
          grossPotentialRent: data.estimatedMarketRent || 100000,
          vacancyRate: 5,
          operatingExpenses: (data.estimatedMarketRent || 100000) * 0.35, // Rule of thumb
          propertyTax: (data.estimatedValue || 1000000) * 0.012, // MA approx rate
          capitalReserves: (data.sqft || 5000) * 0.50, // $0.50/sqft reserve
        } as any // Type casting for partial return
      };
    }
    return {};
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw error;
    console.error("Error enriching property data:", error);
    return {};
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

    const response = await ai.models.generateContent({
      model: REASONING_MODEL,
      contents: prompt,
      config: {
        // thinkingConfig: { thinkingBudget: 2048 } // Commented out to avoid potential model config errors if unsupported
      }
    });

    return response.text || "Unable to generate plan.";
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw error;
    console.error("Error generating value add plan:", error);
    return "Error contacting AI agent.";
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

    const response = await ai.models.generateContent({
      model: GENERATION_MODEL,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

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
