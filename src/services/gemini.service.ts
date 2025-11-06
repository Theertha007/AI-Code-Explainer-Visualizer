import { Injectable } from '@angular/core';
import { GoogleGenAI, Type } from '@google/genai';

export interface AnalysisResult {
  explanation: string;
  mermaidGraph: string;
}

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // This is a placeholder for the API key. In a real environment, this should be handled securely.
    // The Applet environment will provide process.env.API_KEY.
    const apiKey = (window as any).process?.env?.API_KEY;
    if (!apiKey) {
      console.error('API_KEY not found. Please ensure it is set in your environment.');
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_API_KEY' });
  }

  async analyzeCode(code: string): Promise<AnalysisResult> {
    const prompt = `You are an expert code analyst. Analyze the following code snippet. 
Provide a step-by-step execution flow explanation and a Mermaid syntax flowchart representing the logic. 
Respond ONLY with a valid JSON object.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        explanation: {
          type: Type.STRING,
          description: "A step-by-step, narrative description of the code's execution flow, formatted using Markdown. Use headings, bold text, italics, and lists to improve readability. Identify the entry point, describe the sequence of calls, and summarize the logic of each major step."
        },
        mermaidGraph: {
          type: Type.STRING,
          description: "A string containing the complete and valid Mermaid syntax for a flowchart (graph TD) that visually represents the code's logic and structure. Ensure the syntax is complete, does not contain any errors, and does NOT use semicolons at the end of lines."
        },
      },
      required: ["explanation", "mermaidGraph"]
    };

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          { role: 'user', parts: [{ text: prompt }] },
          { role: 'user', parts: [{ text: "Here is the code:" }] },
          { role: 'user', parts: [{ text: '```\n' + code + '\n```' }] },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: responseSchema,
        },
      });

      const jsonString = response.text.trim();
      return JSON.parse(jsonString) as AnalysisResult;

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to get a valid response from the AI model.');
    }
  }
}