import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface ContentBlock {
  type: 'text' | 'code' | 'warning' | 'info' | 'reminder';
  content: string;
  language?: string;
}

export interface SubStep {
  id: string;
  title: string;
  isAdditional?: boolean;
  contentBlocks?: ContentBlock[];
}

export interface Step {
  id: string;
  title: string;
  description: string;
  subSteps: SubStep[];
  contentBlocks?: ContentBlock[];
}

export interface ChecklistData {
  id: string;
  title: string;
  fileName: string;
  createdAt: number;
  steps: Step[];
  completedSteps: string[];
  completedSubSteps: string[];
}

export async function extractStepsFromDocument(
  content: { fileData?: string; mimeType?: string; text?: string }
): Promise<Step[]> {
  const parts: any[] = [];

  if (content.fileData && content.mimeType) {
    parts.push({
      inlineData: {
        data: content.fileData,
        mimeType: content.mimeType,
      },
    });
  } else if (content.text) {
    parts.push({
      text: content.text,
    });
  }

  parts.push({
    text: `Analyze the provided document and extract a highly detailed, actionable checklist. 
    The goal is to provide enough detail that the user NEVER needs to refer back to the original document.
    
    For each main step:
    1. Identify the primary action.
    2. Break it down into logical sub-steps.
    3. CRITICAL: Analyze if there are implicit or "additional" steps needed.
    4. DETAILED CONTENT: For each step and sub-step, extract any relevant:
       - Code snippets or commands (type: 'code')
       - Warnings or safety precautions (type: 'warning')
       - Important reminders or tips (type: 'reminder')
       - General helpful information (type: 'info')
       - Detailed explanatory text (type: 'text')
    
    Format the output as a JSON list of objects. Each object must have:
    - 'id': unique string
    - 'title': clear, concise action
    - 'description': detailed explanation of the step
    - 'contentBlocks': array of { type, content, language? }
    - 'subSteps': a list of objects, each with 'id', 'title', 'isAdditional', and 'contentBlocks'.`,
  });

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            contentBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ['text', 'code', 'warning', 'info', 'reminder'] },
                  content: { type: Type.STRING },
                  language: { type: Type.STRING },
                },
                required: ["type", "content"],
              },
            },
            subSteps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  isAdditional: { type: Type.BOOLEAN },
                  contentBlocks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, enum: ['text', 'code', 'warning', 'info', 'reminder'] },
                        content: { type: Type.STRING },
                        language: { type: Type.STRING },
                      },
                      required: ["type", "content"],
                    },
                  },
                },
                required: ["id", "title"],
              },
            },
          },
          required: ["id", "title", "description", "subSteps"],
        },
      },
    },
  });

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return [];
  }
}
