
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { ChatMessage, GroundingSource } from "./types";

/**
 * Fetches travel advice from Gemini using Google Search and Maps grounding.
 */
export const getTravelAdvice = async (
  prompt: string, 
  history: ChatMessage[] = [],
  location?: { latitude: number; longitude: number },
  imageData?: string // Base64 string
): Promise<{ text: string, sources: GroundingSource[], mapLinks: GroundingSource[] }> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Using gemini-2.5-flash as it is the recommended model for Google Maps grounding
    const modelName = 'gemini-2.5-flash';

    const contents: any[] = history.map(msg => ({
      role: msg.role,
      parts: [
        ...(msg.image ? [{ inlineData: { mimeType: 'image/jpeg', data: msg.image } }] : []),
        { text: msg.text }
      ]
    }));
    
    const currentParts: any[] = [];
    if (imageData) {
      currentParts.push({ inlineData: { mimeType: 'image/jpeg', data: imageData } });
    }
    currentParts.push({ text: prompt || "Identify this landmark and help me find my way there." });

    contents.push({
      role: 'user',
      parts: currentParts
    });

    const response = await ai.models.generateContent({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: `You are 'Sherpa', the wise and helpful AI guide for Nepal. 
        You speak with the warmth and authority of an experienced mountain climber and cultural expert.
        
        GOAL: Help travelers navigate Nepal, from the lowlands of the Terai to the peaks of the Himalayas.
        
        LANGUAGE: You are fluent in English and Nepali (Romanized and Devanagari). Use friendly phrases like 'Namaste' and 'Ma khojchu' (I search/let's look) when appropriate.
        
        LANDMARK IDENTIFICATION: If an image is provided, identify the landmark (mountain, temple, city). Provide its name, history, and altitude.
        
        DIRECTIONS & MAPS: Use the googleMaps tool to provide location links for any landmark you mention. 
        Provide clear route advice. If current location is known, estimate travel time.
        
        ITINERARIES: When asked for a plan, provide a clear Day-by-Day breakdown.
        
        Current User Location: ${location ? `Lat ${location.latitude}, Long ${location.longitude}` : 'Unknown'}.`,
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        toolConfig: location ? {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        } : undefined,
      }
    });
    
    // Direct access to .text property per guidelines
    const text = response.text || "I'm sorry, I couldn't find information for that. Please try again.";
    
    const sources: GroundingSource[] = [];
    const mapLinks: GroundingSource[] = [];
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
        if (chunk.maps) {
          mapLinks.push({ title: chunk.maps.title || "View on Map", uri: chunk.maps.uri });
        }
      });
    }

    return { text, sources, mapLinks };
  } catch (error: any) {
    console.error("AI Guide Error:", error);
    // Re-throw specific key selection errors to trigger UI reset in App.tsx
    if (error?.message?.includes("Requested entity was not found.")) {
      throw error;
    }
    return { 
      text: "Sherpa is having trouble connecting to the peak. Please try again in a few moments.", 
      sources: [],
      mapLinks: []
    };
  }
};

/**
 * Generates a video route guide using the Veo model.
 */
export const generateRouteVideo = async (
  origin: string,
  destination: string,
  onProgress?: (status: string) => void
): Promise<string> => {
  // Re-creating instance right before call for Veo requirement to ensure latest API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Realistic 3D satellite map navigation video from ${origin} to ${destination} in Nepal. 
  Follow the main roads and show the blue navigation line clearly. 
  Include mountain views and local landmarks along the way. 
  The camera should follow the road like a drone. High definition, natural lighting.`;

  try {
    if (onProgress) onProgress("Searching for satellite path...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      if (onProgress) onProgress("Sherpa is preparing your route video...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generation failed");
    // Appending API key to download link per guidelines
    return `${downloadLink}&key=${process.env.API_KEY}`;
  } catch (error) {
    console.error("Veo error:", error);
    throw error;
  }
};
