export interface DocumentChunk {
  id: string;
  docId: string;
  chunkIndex: number;
  content: string;
  tokensCount: number;
}

export interface KnowledgeDoc {
  id: string;
  title: string;
  category?: string;
  sizeBytes?: number;
  chunksCount: number;
  status: "processing" | "indexed" | "failed";
  uploadedAt: string;
}

export interface SopQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface SopModule {
  id: string;
  title: string;
  description: string;
  passingScore: number;
  questions: SopQuizQuestion[];
}
