import { GoogleGenAI, Type } from "@google/genai";
import { Dimensions } from "../types";

// This service handles the AI estimation of item dimensions from images and text.
// It uses the latest @google/genai SDK.

export const analyzeItemImage = async (base64Image: string): Promise<{ dimensions: Dimensions; shape: 'box' | 'cylinder' | 'irregular'; confidence: number }> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning mock data.");
    return mockAnalyze();
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Analyze this image of an item to be packed for shipping.
      Estimate its physical dimensions (Length, Width, Height) in centimeters.
      Assume standard household context if no reference is present.
      Classify its shape as 'box', 'cylinder', or 'irregular'.
      Provide a confidence score from 0 to 1.
      Return the result in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            length: { type: Type.NUMBER, description: "Length in cm" },
            width: { type: Type.NUMBER, description: "Width in cm" },
            height: { type: Type.NUMBER, description: "Height in cm" },
            shape: { type: Type.STRING, enum: ['box', 'cylinder', 'irregular'] },
            confidence: { type: Type.NUMBER }
          },
          required: ['length', 'width', 'height', 'shape', 'confidence']
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const result = JSON.parse(text);
    return {
      dimensions: {
        length: result.length,
        width: result.width,
        height: result.height
      },
      shape: result.shape as any,
      confidence: result.confidence
    };

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return mockAnalyze();
  }
};

export const analyzeItemText = async (query: string): Promise<{ dimensions: Dimensions; weightKg: number; shape: 'box' | 'cylinder' | 'irregular'; confidence: number }> => {
  if (!process.env.API_KEY) {
      console.warn("API Key is missing. Returning mock text analysis.");
      return mockAnalyzeText(query);
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
      Estimate the physical shipping dimensions (Length, Width, Height in cm) and weight (kg) for a commercial product described as: "${query}".
      Assume standard packaging if applicable (e.g., a TV comes in a box).
      Classify shape as 'box', 'cylinder', or 'irregular'.
      Return JSON.
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    length: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                    weightKg: { type: Type.NUMBER },
                    shape: { type: Type.STRING, enum: ['box', 'cylinder', 'irregular'] },
                    confidence: { type: Type.NUMBER }
                },
                required: ['length', 'width', 'height', 'weightKg', 'shape', 'confidence']
            }
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text);
    return {
        dimensions: { length: result.length, width: result.width, height: result.height },
        weightKg: result.weightKg,
        shape: result.shape as any,
        confidence: result.confidence
    };

  } catch (e) {
      console.error("Gemini text analysis failed:", e);
      return mockAnalyzeText(query);
  }
};

const mockAnalyze = (): Promise<{ dimensions: Dimensions; shape: 'box' | 'cylinder' | 'irregular'; confidence: number }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        dimensions: {
          length: Math.floor(Math.random() * 30) + 10,
          width: Math.floor(Math.random() * 20) + 10,
          height: Math.floor(Math.random() * 20) + 5,
        },
        shape: Math.random() > 0.5 ? 'box' : 'irregular',
        confidence: 0.85
      });
    }, 1500);
  });
};

const mockAnalyzeText = (query: string): Promise<{ dimensions: Dimensions; weightKg: number; shape: 'box' | 'cylinder' | 'irregular'; confidence: number }> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                dimensions: { length: 50, width: 40, height: 15 },
                weightKg: 5.5,
                shape: 'box',
                confidence: 0.8
            });
        }, 1000);
    });
};