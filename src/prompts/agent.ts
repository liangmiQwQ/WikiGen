import type { WebsiteFormData } from "../types";

export const DEFAULT_INDEX_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>New WikiGen Project</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }
      body {
        margin: 0;
        padding: 48px 20px;
        background: #f5f5f4;
        color: #1c1917;
      }
      main {
        max-width: 840px;
        margin: 0 auto;
        background: #fff;
        border: 1px solid #e7e5e4;
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 12px 28px rgb(28 25 23 / 8%);
      }
      h1 {
        margin-top: 0;
        font-size: 2rem;
      }
      p {
        line-height: 1.7;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background: #1c1917;
          color: #f5f5f4;
        }
        main {
          background: #292524;
          border-color: #44403c;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <h1>New Website Draft</h1>
      <p>Ask the AI agent to create or modify this page. It will update this file through tool calls.</p>
    </main>
  </body>
</html>`;

export const CHAT_SYSTEM_PROMPT = `You are WikiGen Agent, an AI assistant that can both chat and edit website files with tools.

Rules:
1. Chat naturally. Do NOT force code output.
2. Use tools only when needed to inspect or modify website files.
3. Before patching files, call read_html_file to get the latest content.
4. For file edits, use apply_html_patch with minimal oldText/newText operations, not full-file output.
5. When user requests website changes, call tools instead of pasting full HTML in chat.
6. If patch application fails, read file again and retry with corrected operations.
7. Keep responses concise and practical.
8. If no file changes are needed, answer directly without tool calls.`;

export function buildInitialTaskPrompt(formData: WebsiteFormData): string {
  const sectionsText =
    formData.keySections.length > 0
      ? formData.keySections.join(", ")
      : "Introduction, key concepts, examples, and summary";

  return `Create or update the website in index.html for this request:
- Topic: ${formData.topic}
- Target audience: ${formData.targetAudience || "General audience"}
- Style preference: ${formData.stylePreference}
- Suggested sections: ${sectionsText}
- Additional requirements: ${formData.additionalRequirements || "None"}

Use tools to read and patch index.html. Keep the website self-contained (HTML/CSS/JS in one file), responsive, and production-minded.
Prefer minimal patches that touch only necessary sections.`;
}
