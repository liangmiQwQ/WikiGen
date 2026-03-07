export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  extractedHtml?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
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
