// This file uses server-side code.
'use server';

/**
 * @fileOverview Generates an explanation of why a URL was classified as phishing or safe.
 *
 * - generateExplanation - A function that generates the explanation.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationInputSchema = z.object({
  url: z.string().describe('The URL to explain the classification for.'),
  classification: z.enum(['safe', 'phishing']).describe('The classification of the URL.'),
  features: z.record(z.any()).describe('The features used to classify the URL.'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('The explanation of why the URL was classified as phishing or safe.'),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationPrompt',
  input: {schema: GenerateExplanationInputSchema},
  output: {schema: GenerateExplanationOutputSchema},
  prompt: `You are an AI expert in explaining URL classifications.

You are provided with the URL, its classification (safe or phishing), and the features used to classify the URL.

Your task is to generate a concise and understandable explanation of why the URL was classified as such, based on the provided features.

URL: {{{url}}}
Classification: {{{classification}}}
Features: {{{JSON.stringify features}}}

Explanation: `,
});

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
