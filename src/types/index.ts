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
  initialFormData?: WebsiteFormData;
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

export interface ApiKeys {
  deepseek: string;
  "moonshot-cn": string;
  moonshot: string;
}

export interface Settings {
  provider: AIProvider;
  apiKeys: ApiKeys;
}

export type AIProvider = "deepseek" | "moonshot-cn" | "moonshot";

export interface WebsiteFormData {
  topic: string;
  targetAudience: string;
  keySections: string[];
  stylePreference: "modern" | "classic" | "minimal" | "colorful";
  additionalRequirements: string;
}
