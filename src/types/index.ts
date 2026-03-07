export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  extractedHtml?: string;
}

export interface WebsiteVersion {
  version: number;
  html: string;
  changeDescription: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  website?: {
    name: string;
    description: string;
    currentHtml: string;
    versions: WebsiteVersion[];
    createdAt: number;
  };
  status: "creating" | "generating" | "completed";
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  html: string;
  conversationId: string;
  createdAt: number;
}

export interface Settings {
  provider: "kimi" | "deepseek";
  apiKey: string;
}

export type AIProvider = "kimi" | "deepseek";

export interface WebsiteFormData {
  topic: string;
  targetAudience: string;
  keySections: string[];
  stylePreference: "modern" | "classic" | "minimal" | "colorful";
  additionalRequirements: string;
}
