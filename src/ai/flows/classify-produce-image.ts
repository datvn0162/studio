// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview An AI agent that classifies images of agricultural products.
 * It can optionally use custom examples provided by the user to improve classification for specific types.
 *
 * - classifyProduceImage - A function that handles the image classification process.
 * - ClassifyProduceImageInput - The input type for the classifyProduceImage function.
 * - ClassifyProduceImageOutput - The return type for the classifyProduceImage function.
 * - CustomExample - Represents a custom produce type with example images.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomExampleSchema = z.object({
  label: z.string().describe('The custom label for this type of produce.'),
  exampleImageUris: z.array(z.string().describe( // No .url() as it's a data URI
    "A data URI of an example image for this custom label. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  )).min(1).max(10).describe('A list of 1 to 10 example images (data URIs) for this custom label.'),
});
export type CustomExample = z.infer<typeof CustomExampleSchema>;

const ClassifyProduceImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a produce item to classify, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  customExamples: z.array(CustomExampleSchema).optional().describe('Optional list of custom produce examples to guide the classification.'),
});
export type ClassifyProduceImageInput = z.infer<typeof ClassifyProduceImageInputSchema>;

const ClassifyProduceImageOutputSchema = z.object({
  classification: z.string().describe('The classification of the produce item.'),
  confidence: z.number().describe('The confidence score of the classification (0-1).'),
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

{{#if customExamples}}
You have been provided with custom examples of specific produce types. Please prioritize these examples when classifying the main image.
These are the custom types and their examples:
{{#each customExamples}}
Custom Type: "{{this.label}}"
Examples for "{{this.label}}":
{{#each this.exampleImageUris}}
- Example Image: {{media url=this}}
{{/each}}
---
{{/each}}
Now, analyze the main image below. Determine what agricultural product it is, strongly considering the custom examples provided. If the image clearly matches one of the custom types, use that label for the classification. Otherwise, provide your best general classification.
{{else}}
Analyze the image below and determine what agricultural product it is.
{{/if}}

Return the classification (as a string) and a confidence score (from 0.0 to 1.0) of your classification.

Main Image to Classify: {{media url=photoDataUri}}
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
