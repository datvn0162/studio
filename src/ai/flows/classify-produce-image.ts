
// This file is machine-generated - edit at your own risk.

'use server';

/**
 * @fileOverview An AI agent that classifies images of agricultural products.
 * It can optionally use custom examples provided by the user to improve classification for specific types.
 * It also determines if the input image is likely an agricultural product.
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
  isProduce: z.boolean().describe('True if the image is determined to be an agricultural product, false otherwise.'),
  classification: z.string().describe('The classification of the produce item. If not produce, this will indicate so (e.g., "Không phải nông sản").'),
  confidence: z.number().optional().describe('The confidence score of the classification (0-1), only present if isProduce is true and a valid classification is made.'),
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
  prompt: `You are an expert in agricultural product recognition. Your primary task is to determine if the provided image contains an agricultural product and then classify it.

First, analyze the main image to determine if it is an agricultural product (e.g., fruit, vegetable, grain, root, etc.).
- If the image IS NOT an agricultural product (e.g., it's a rock, an animal, a manufactured object), set \`isProduce\` to false, set \`classification\` to "Không phải nông sản", and you may omit \`confidence\`.
- If the image IS an agricultural product, set \`isProduce\` to true and then proceed to classify it.

{{#if customExamples}}
When classifying, you have been provided with custom examples of specific produce types. Please prioritize these examples.
These are the custom types and their examples:
{{#each customExamples}}
Custom Type: "{{this.label}}"
Examples for "{{this.label}}":
{{#each this.exampleImageUris}}
- Example Image: {{media url=this}}
{{/each}}
---
{{/each}}
Now, analyze the main image below. If it's an agricultural product, determine what specific product it is, strongly considering the custom examples provided. If the image clearly matches one of the custom types, use that label for the \`classification\`. Otherwise, provide your best general classification for the \`classification\` field and a \`confidence\` score (from 0.0 to 1.0).
{{else}}
If the main image is an agricultural product, analyze it and determine what agricultural product it is. Provide your classification in the \`classification\` field and a \`confidence\` score (from 0.0 to 1.0).
{{/if}}

Return your findings according to the output schema.

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
    // Ensure output is not null, especially if the model might return empty in edge cases.
    // If output is null, provide a default "error" like response that fits the schema.
    if (!output) {
        return {
            isProduce: false,
            classification: "Không thể xử lý hình ảnh",
            confidence: undefined,
        };
    }
    return output;
  }
);

