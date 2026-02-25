import { Type } from "@google/genai";

export type Mood = 
  | "Funny" 
  | "Very Funny" 
  | "Sarcastic" 
  | "Cute Funny" 
  | "Relatable Funny" 
  | "Savage Funny" 
  | "Roasting Funny" 
  | "Rude Funny" 
  | "Nuclear Roast";

export type Language = 
  | "English" | "Hindi" | "Bengali" | "Telugu" | "Marathi" | "Tamil" 
  | "Urdu" | "Gujarati" | "Kannada" | "Malayalam" | "Punjabi" 
  | "Sanskrit" | "Bhojpuri";

export interface RoastOptions {
  mood: Mood;
  language: Language;
  gender: string;
  age: string;
}

export const MOODS: Mood[] = [
  "Funny", "Very Funny", "Sarcastic", "Cute Funny", "Relatable Funny", 
  "Savage Funny", "Roasting Funny", "Rude Funny", "Nuclear Roast"
];

export const LANGUAGES: Language[] = [
  "English", "Hindi", "Bengali", "Telugu", "Marathi", "Tamil", 
  "Urdu", "Gujarati", "Kannada", "Malayalam", "Punjabi", 
  "Sanskrit", "Bhojpuri"
];

export const DEFAULT_INPUTS = [
  "Roast my fashion sense based on this photo.",
  "What do you think of my bio: 'Living my best life'?",
  "Roast my music taste: I listen to heavy metal and jazz fusion.",
  "Tell me what's wrong with my morning routine: I wake up at 11 AM.",
  "Roast my LinkedIn profile: 'Passionate about synergy'."
];
