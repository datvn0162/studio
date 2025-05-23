// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview An AI agent that classifies images of agricultural products.
 *
 * - classifyProduceImage - A function that handles the image classification process.
 * - ClassifyProduceImageInput - The input type for the classifyProduceImage function.
 * - ClassifyProduceImageOutput - The return type for the classifyProduceImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClassifyProduceImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a produce item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ClassifyProduceImageInput = z.infer<typeof ClassifyProduceImageInputSchema>;

const ClassifyProduceImageOutputSchema = z.object({
  classification: z.string().describe('The classification of the produce item.'),
  confidence: z.number().describe('The confidence score of the classification.'),
});
export type ClassifyProduceImageOutput = z.infer<typeof ClassifyProduceImageOutputSchema>;

export async function classifyProduceImage(
  input: ClassifyProduceImageInput
): Promise<ClassifyProduceImageOutput> {
  return classifyProduceImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'classifyProduceImagePrompt',
  input: {schema: ClassifyProduceImageInputSchema},
  output: {schema: ClassifyProduceImageOutputSchema},
  prompt: `You are an expert in agricultural product recognition.

  Analyze the image and determine what agricultural product it is. Return the classification and a confidence score (0-1) of your classification.

  Image: {{media url=photoDataUri}}
  `,
});

const classifyProduceImageFlow = ai.defineFlow(
  {
    name: 'classifyProduceImageFlow',
    inputSchema: ClassifyProduceImageInputSchema,
    outputSchema: ClassifyProduceImageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
