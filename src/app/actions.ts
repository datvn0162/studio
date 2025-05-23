'use server';
import { classifyProduceImage, type ClassifyProduceImageInput, type ClassifyProduceImageOutput } from '@/ai/flows/classify-produce-image';
import { summarizeClassificationResults, type ClassificationResult as AIClassificationResult, type SummarizeClassificationResultsInput } from '@/ai/flows/summarize-classification-results';

export interface ClassificationRequest {
  photoDataUri: string;
  fileId: string; 
  customExamples?: ClassifyProduceImageInput['customExamples']; // Optional custom examples
}

export interface ClassificationResponse {
  fileId: string;
  productName?: string;
  confidence?: number;
  error?: string;
}

export async function classifyImageAction(request: ClassificationRequest): Promise<ClassificationResponse> {
  try {
    if (!request.photoDataUri.startsWith('data:image/')) {
      throw new Error('Invalid data URI format. Ensure it includes a MIME type (e.g., data:image/jpeg;base64,...).');
    }

    const aiInput: ClassifyProduceImageInput = { 
      photoDataUri: request.photoDataUri 
    };

    if (request.customExamples && request.customExamples.length > 0) {
      aiInput.customExamples = request.customExamples;
    }

    const result: ClassifyProduceImageOutput = await classifyProduceImage(aiInput);
    
    return {
      fileId: request.fileId,
      productName: result.classification,
      confidence: result.confidence,
    };
  } catch (e: any) {
    console.error("Error classifying image:", e);
    // Try to provide a more specific error message if possible from the AI flow
    const errorMessage = e?.message || "Failed to classify image. The AI model might be unable to process this image or there was a connection issue.";
    return {
      fileId: request.fileId,
      error: errorMessage,
    };
  }
}

export async function summarizeResultsAction(input: AIClassificationResult[]): Promise<{ summary?: string; error?: string }> {
  if (!input || input.length === 0) {
    return { summary: "No results available to summarize." };
  }
  try {
    const summarizationInput: SummarizeClassificationResultsInput = { classificationResults: input };
    const result = await summarizeClassificationResults(summarizationInput);
    return { summary: result.summary };
  } catch (e: any) {
    console.error("Error summarizing results:", e);
    return { error: e.message || "Failed to summarize results." };
  }
}
