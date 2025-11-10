import { GoogleGenAI, Type, Part } from "@google/genai";
import { AnalysisResult } from "../types";

function resolveApiKey(): string | null {
  // Check Vite env var (import.meta.env.VITE_GEMINI_API_KEY) - automatically exposed by Vite
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (viteKey && viteKey.trim()) return viteKey.trim();
  
  // Check window scoped API key
  const windowKey = (globalThis as any)?.API_KEY as string | undefined;
  if (windowKey && windowKey.trim()) return windowKey.trim();
  
  // Check localStorage as fallback
  try {
    const stored = localStorage.getItem('GEMINI_API_KEY');
    if (stored && stored.trim()) return stored.trim();
  } catch {}
  return null;
}
let cachedClientKey: string | null = null;
let cachedAi: GoogleGenAI | null = null;

export function getAiClient(): GoogleGenAI {
  const key = resolveApiKey();
  if (!key) {
    console.error('API key is missing. Please set VITE_GEMINI_API_KEY environment variable.');
    throw new Error("SERVICE_UNAVAILABLE");
  }
  if (cachedAi && cachedClientKey === key) return cachedAi;
  cachedClientKey = key;
  cachedAi = new GoogleGenAI({ apiKey: key });
  return cachedAi;
}

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description:
        "A concise summary of the legal document in simple, clear language for a non-lawyer.",
    },
    // Optional: indicate if the document appears to be a legal document (true/false)
    isLegal: {
      type: Type.BOOLEAN,
      description:
        "True if the model determines the attachment is a legal document (contract, agreement, NDA, policy, etc.).",
    },
    // Optional: authenticity assessment
    authenticity: {
      type: Type.STRING,
      description:
        "One of 'real', 'fake', or 'unknown' to indicate whether the document appears authentic/forged.",
    },
    pros: {
      type: Type.ARRAY,
      description:
        "A list of clauses or aspects of the document that are beneficial or advantageous to the user.",
      items: { type: Type.STRING },
    },
    cons: {
      type: Type.ARRAY,
      description:
        "A list of clauses or aspects that could be disadvantageous, risky, or impose significant obligations on the user.",
      items: { type: Type.STRING },
    },
    potentialLoopholes: {
      type: Type.ARRAY,
      description:
        "A list of ambiguous, vague, or potentially exploitable clauses that could lead to disputes.",
      items: { type: Type.STRING },
    },
    potentialChallenges: {
      type: Type.ARRAY,
      description:
        "A list of potential legal challenges or disputes that could arise from the document's terms.",
      items: { type: Type.STRING },
    },
  },
  required: [
    "summary",
    "pros",
    "cons",
    "potentialLoopholes",
    "potentialChallenges",
  ],
};

// Converts a File object to a GoogleGenAI.Part object.
async function fileToGenerativePart(file: File): Promise<Part> {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}

export const analyzeDocument = async (file: File | File[], responseLanguageName: string = 'English'): Promise<AnalysisResult> => {
  const ai = getAiClient();
  const model = "gemini-2.5-pro";

  const prompt = `You are LexiGem, an expert AI legal analyst. Your task is to analyze the attached legal document (e.g., contract, agreement, NDA, policy). Provide a structured analysis in simple, easy-to-understand language for a non-lawyer.

  IMPORTANT: Respond only in ${responseLanguageName}. The JSON string values must be written in ${responseLanguageName}.

  Based on the document, provide a detailed analysis covering:
  1.  **Summary:** A brief overview of the document's purpose and key terms.
  2.  **Pros:** What are the benefits for the user in this agreement?
  3.  **Cons:** What are the risks, obligations, or downsides for the user?
  4.  **Potential Loopholes:** Identify any vague, ambiguous, or potentially exploitable clauses.
  5.  **Potential Challenges:** What disputes or legal issues could realistically arise from this document?
  
  Please provide the output in the specified JSON format.`;

  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
  const isRateLimited = (msg: string) => /quota|rate|429|resource exhausted/i.test(msg);

  try {
    // Handle both single file and array of files (for password-protected PDFs converted to images)
    const files = Array.isArray(file) ? file : [file];
    
    // Validate files before processing
    if (files.length === 0) {
      throw new Error('No files provided for analysis');
    }
    
    // Check file sizes
    for (const f of files) {
      if (!f || f.size === 0) {
        throw new Error('One or more files are empty or invalid');
      }
    }
    
    console.log(`Processing ${files.length} file(s) for analysis`);
    const fileParts = await Promise.all(files.map(f => fileToGenerativePart(f)));
    
    // Validate file parts were created
    if (fileParts.length === 0 || fileParts.some(part => !part || !part.inlineData)) {
      throw new Error('Failed to process files for analysis');
    }
    
    const contents = { parts: [{ text: prompt }, ...fileParts] };

    let lastErr: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: analysisSchema,
          },
        });
        const jsonText = (response as any)?.text?.trim?.() ?? "";
        if (!jsonText) throw new Error("Empty response from AI model.");
        const cleanedJson = jsonText.replace(/^```json\s*|```$/g, "");
        const parsedResult: AnalysisResult = JSON.parse(cleanedJson);
        return parsedResult;
      } catch (err: any) {
        lastErr = err;
        const msg = (err instanceof Error ? err.message : String(err)) || '';
        if (isRateLimited(msg) && attempt < 2) {
          // exponential backoff: 1s, 2s
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        throw err;
      }
    }
    throw lastErr ?? new Error('Unknown error');
  } catch (error) {
    console.error("Error analyzing document with Gemini:", error);
    const message = error instanceof Error ? error.message : String(error);
    // Handle API key errors silently - don't expose to UI
    if (message.includes('API key') || message.includes('Missing API key')) {
      console.error('API key is missing. Please set VITE_GEMINI_API_KEY environment variable.');
      throw new Error("SERVICE_UNAVAILABLE");
    }
    if (message.toLowerCase().includes('quota') || message.toLowerCase().includes('rate') || message.includes('429')) {
      throw new Error("Model quota/rate limit reached. Retried automatically; please try again in a moment or adjust your quota.");
    }
    if (message.toLowerCase().includes('unsupported') || message.toLowerCase().includes('mime')) {
      throw new Error("Unsupported file type. Please upload PDF, DOCX, PNG, or JPG.");
    }
    // Check for password-protected PDF errors
    if (message.includes('no pages') || message.includes('document has no pages')) {
      throw new Error("The document appears to be password-protected or corrupted. If this is an Aadhaar PDF, please enter the password when prompted.");
    }
    throw new Error("Failed to analyze the document. The AI model could not process the request. Please ensure you've uploaded a clear document (PDF, DOCX, PNG, JPG).");
  }
};
