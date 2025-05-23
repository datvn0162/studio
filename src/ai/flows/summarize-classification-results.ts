'use server';

/**
 * @fileOverview Summarizes the classification results of multiple agricultural product images.
 *
 * - summarizeClassificationResults - A function that summarizes the classification results.
 * - ClassificationResult - Represents the classification result for a single image.
 * - SummarizeClassificationResultsInput - The input type for the summarizeClassificationResults function.
 * - SummarizeClassificationResultsOutput - The return type for the summarizeClassificationResults function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassificationResultSchema = z.object({
  productName: z.string().describe('The name of the agricultural product identified in the image.'),
  confidenceScore: z.number().describe('The confidence score of the classification (0-1).'),
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;

const SummarizeClassificationResultsInputSchema = z.object({
  classificationResults: z.array(ClassificationResultSchema).describe('An array of classification results from multiple images.'),
});

export type SummarizeClassificationResultsInput = z.infer<typeof SummarizeClassificationResultsInputSchema>;

const SummarizeClassificationResultsOutputSchema = z.object({
  summary: z.string().describe('A summary of the classification results, highlighting the most common products and any anomalies.'),
});

export type SummarizeClassificationResultsOutput = z.infer<typeof SummarizeClassificationResultsOutputSchema>;

export async function summarizeClassificationResults(input: SummarizeClassificationResultsInput): Promise<SummarizeClassificationResultsOutput> {
  return summarizeClassificationResultsFlow(input);
}

const summarizeClassificationResultsPrompt = ai.definePrompt({
  name: 'summarizeClassificationResultsPrompt',
  input: {schema: SummarizeClassificationResultsInputSchema},
  output: {schema: SummarizeClassificationResultsOutputSchema},
  prompt: `You are an expert in agricultural product classification analysis.
  Given the following classification results, provide a concise summary highlighting the most common products identified, 
  any potential anomalies (e.g., unexpected products or low confidence scores), and any uncertainties in the classifications.

  Classification Results:
  {{#each classificationResults}}
  - Product: {{this.productName}}, Confidence: {{this.confidenceScore}}
  {{/each}}
  `,
});

const summarizeClassificationResultsFlow = ai.defineFlow(
  {
    name: 'summarizeClassificationResultsFlow',
    inputSchema: SummarizeClassificationResultsInputSchema,
    outputSchema: SummarizeClassificationResultsOutputSchema,
  },
  async input => {
    const {output} = await summarizeClassificationResultsPrompt(input);
    return output!;
  }
);
