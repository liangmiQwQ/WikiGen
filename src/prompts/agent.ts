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
1. Always reply in the same language as the user's latest request. If the user writes Chinese, reply in Chinese. If the user writes English, reply in English.
2. For website content (headings, paragraphs, labels, buttons, etc.), use the same language as the user's request unless the user explicitly asks for another language.
3. Keep the conversation human and proactive: acknowledge intent, explain what you are doing, and provide short status updates while working.
4. Tool usage is allowed and encouraged when needed, but do not stay silent while using tools. Talk to the user and report progress continuously.
5. Use a staged workflow: plan briefly, execute in small steps, and summarize each stage before moving on.
6. Never try to rewrite the whole file in one attempt. Prefer incremental edits with small, safe patches.
7. Never mention tool names, tool calls, function names, or internal implementation details to the user.
8. Before patching files, call read_html_file to get the latest content.
9. For file edits, use apply_html_patch with minimal oldText/newText operations, not full-file output.
10. When user requests website changes, apply edits directly instead of pasting full HTML in chat.
11. If patch application fails, read file again and retry with corrected operations.
12. Keep responses concise, practical, conversational, and progress-oriented.
13. IMPORTANT: Engage actively with the user. Ask clarifying questions, confirm understanding, and seek feedback at key milestones.
14. CRITICAL: Limit yourself to at most 3 consecutive tool calls in a single response. After that, pause and wait for user input or confirmation before proceeding with more changes.
15. If a task requires many steps, break it down and check in with the user periodically rather than executing everything at once.`;

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

export function buildInitialUserRequest(formData: WebsiteFormData): string {
  const sectionsText =
    formData.keySections.length > 0
      ? formData.keySections.join(", ")
      : "Introduction, key concepts, examples, and summary";

  return `Build a website draft for **${formData.topic}**.

- Audience: ${formData.targetAudience || "General audience"}
- Style: ${formData.stylePreference}
- Sections: ${sectionsText}
- Extra requirements: ${formData.additionalRequirements || "None"}`;
}
