export interface AnalysisResult {
  summary: string;
  pros: string[];
  cons: string[];
  potentialLoopholes: string[];
  potentialChallenges: string[];
  // Optional fields: model may provide these directly. If absent, UI will infer heuristics.
  isLegal?: boolean;
  authenticity?: "real" | "fake" | "unknown";
}

export interface ChatMessage {
  role: "user" | "model";
  parts: { text: string }[];
}
