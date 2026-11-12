import { apiGet, apiPost } from "@/services/api";

export interface TrainingSessionItem {
  id: string;
  intern_name: string;
  intern_email: string | null;
  question: string;
  response: string;
  comprehension_score: number;
  feedback_notes: string;
  created_at: string;
}

export async function uploadTrainingDocApi(doc: {
  title: string;
  content: string;
  category: "SALES_PLAYBOOK" | "SOP" | "CUSTOMER_FAQ" | "PRODUCT_MANUAL";
  accessScope?: "INTERNAL_TRAINING" | "PUBLIC";
}): Promise<{ success: boolean; message: string; docId: string }> {
  return apiPost("/training/docs", doc);
}

export async function askTrainingMentorApi(question: string, internName?: string): Promise<{ success: boolean; mentorResponse: string }> {
  return apiPost("/training/ask", { question, internName });
}

export async function listTrainingSessionsApi(limit = 30): Promise<{ success: boolean; count: number; sessions: TrainingSessionItem[] }> {
  return apiGet(`/training/sessions?limit=${limit}`);
}

