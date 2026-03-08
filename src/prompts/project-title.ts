import type { WebsiteFormData } from "../types";

export const PROJECT_TITLE_FALLBACK = "Untitled Wiki Project";

export function buildProjectTitlePrompt(
  formData: WebsiteFormData,
  html: string,
): string {
  const sections =
    formData.keySections.length > 0
      ? formData.keySections.join(", ")
      : "introduction, key concepts, examples, summary";
  const htmlSnippet = html.trim().slice(0, 1200);

  return `Generate a concise project title for a generated website.

Requirements:
- Return only the title text.
- Max 8 words, ideally 3-6 words.
- No quotes, no punctuation suffix, no markdown.
- Clear and specific to the topic and audience.

Inputs:
- Topic: ${formData.topic}
- Target audience: ${formData.targetAudience || "General audience"}
- Style preference: ${formData.stylePreference}
- Key sections: ${sections}
- Additional requirements: ${formData.additionalRequirements || "None"}

Website snippet:
${htmlSnippet || "(not available yet)"}`;
}
