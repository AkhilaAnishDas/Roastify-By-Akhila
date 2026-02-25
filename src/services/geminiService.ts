import { GoogleGenAI, Modality } from "@google/genai";
import { RoastOptions } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  async generateRoast(input: string, files: { data: string; mimeType: string }[], options: RoastOptions) {
    const { mood, language, gender, age } = options;
    
    const systemInstruction = `You are a witty, intelligent, and creative roast comedian named ROASTIFY.
Your job is to generate funny, clever, and playful roasts based on the user's input.
Rules:
- Keep roasts humorous, sarcastic, and creative.
- Focus on personality traits, habits, or situations instead of sensitive topics.
- Make the roast sound smart and original — not generic insults.
- Use modern humor and internet-style comedy.
- Keep each roast 1–2 sentences long.
- Output EXACTLY 2-3 unique roast lines.
- Respond in the language: ${language}.
- **CRITICAL**: The roasts MUST be highly relatable to Indian society, culture, stereotypes (harmless), and daily life (e.g., engineering students, overprotective parents, street food, traffic, wedding culture, etc.).
- Consider the user's context: Gender: ${gender}, Age: ${age}, Mood: ${mood}.
- If the mood is "Nuclear Roast", be extremely savage but still within safety guidelines.
- If the mood is "Cute Funny", be lighthearted and "aww" inducing but still a roast.`;

    const parts: any[] = [{ text: input || "Roast me based on what you see/hear." }];
    
    for (const file of files) {
      parts.push({
        inlineData: {
          data: file.data.split(',')[1],
          mimeType: file.mimeType
        }
      });
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction,
          temperature: 0.9,
        }
      });

      return response.text || "I'm too stunned by your presence to even roast you. Try again.";
    } catch (error) {
      console.error("Roast generation failed:", error);
      return "My funny bone is broken. (API Error)";
    }
  }

  async chatWithHappy(message: string, history: { role: "user" | "model"; parts: { text: string }[] }[]) {
    try {
      const chat = this.ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "Your name is Happy. You are a friendly, simple, and helpful AI assistant. You talk in simple and understandable words. You should be cheerful and supportive. You are slightly eccentric and funny. If the user asks for a roast, tell them to use the main Roastify tool, but you can give a very tiny, harmless 'happy' roast if they insist.",
        },
        history: history
      });

      const response = await chat.sendMessage({ message });
      return response.text || "I'm happy but speechless!";
    } catch (error) {
      console.error("Chat failed:", error);
      return "I'm having a little glitch, but I'm still happy!";
    }
  }

  async generateSpeech(text: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this in a funny, high-pitched, and cheerful way: ${text}` }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck is usually more energetic/funny
            },
          },
        },
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    } catch (error) {
      console.error("Speech generation failed:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
