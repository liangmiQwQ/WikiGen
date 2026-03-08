export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  extractedHtml?: string;
  kind?: "text" | "tool-run";
  toolRun?: ToolRun;
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
  workspace: {
    files: Record<string, string>;
  };
  htmlSnapshots: Record<
    string,
    {
      html: string;
      versionCount: number;
      timestamp: number;
    }
  >;
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
  status: "draft" | "done";
  conversationId: string;
  createdAt: number;
}

export interface ApiKeys {
  deepseek: string;
}

export interface Settings {
  apiKeys: ApiKeys;
}

export type AIProvider = "deepseek";

export interface WebsiteFormData {
  topic: string;
  targetAudience: string;
  keySections: string[];
  stylePreference: "modern" | "classic" | "minimal" | "colorful";
  additionalRequirements: string;
}

export interface ToolRunStep {
  id: string;
  title: string;
  detail: string;
  status: "running" | "done" | "error";
  timestamp: number;
}

export interface ToolRun {
  id: string;
  status: "running" | "done" | "error";
  title: string;
  steps: ToolRunStep[];
  startedAt: number;
  updatedAt: number;
}
