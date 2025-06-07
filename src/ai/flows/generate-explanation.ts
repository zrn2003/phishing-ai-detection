
// This file uses server-side code.
'use server';

/**
 * @fileOverview Generates an explanation of why a URL was classified as phishing or safe,
 * based on analysis data likely from a security API.
 *
 * - generateExplanation - A function that generates the explanation.
 * - GenerateExplanationInput - The input type for the generateExplanation function.
 * - GenerateExplanationOutput - The return type for the generateExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationInputSchema = z.object({
  url: z.string().describe('The URL to explain the classification for.'),
  classification: z.enum(['safe', 'phishing']).describe('The classification of the URL, determined by an analysis process.'),
  features: z.record(z.any()).describe('The detailed analysis report from a threat intelligence API (simulating services like Google Safe Browsing). This includes fields like classification, confidenceScore, detectedFlags, and threatType.'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('The comprehensive explanation of why the URL was classified as phishing or safe, including potential risks and attack vectors if applicable.'),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationPrompt',
  input: {schema: GenerateExplanationInputSchema},
  output: {schema: GenerateExplanationOutputSchema},
  prompt: `You are a cybersecurity expert specializing in analyzing URLs and explaining their safety status to users in an easy-to-understand manner.
You have been provided with a URL, its classification ('safe' or 'phishing'), and a detailed analysis report (features) from a threat intelligence API, simulating services like Google Safe Browsing.

URL: {{{url}}}
Classification: {{{classification}}}
Analysis Report (Features): {{{JSON.stringify features}}}

Your task is to generate a comprehensive explanation.

If the classification is 'phishing':
1.  Clearly state that the URL is potentially dangerous. Use strong but clear language.
2.  Based on the 'Analysis Report (Features)', explain the SPECIFIC reasons WHY it's considered phishing. For example, if 'features.detectedFlags' includes 'known_phishing_domain', mention that it's a known malicious site. If 'features.threatType' is 'Deceptive Content', explain that it might try to trick the user. If the 'features.confidenceScore' is high, mention that the system is very confident in this assessment.
3.  Describe the POTENTIAL RISKS and common attack vectors associated with such a site. This includes:
    *   Credential Theft: Explain how the site might try to steal usernames, passwords, financial details (e.g., fake login pages, deceptive forms asking for sensitive information). Mention that stolen credentials can lead to unauthorized account access, financial loss, or identity theft.
    *   Malware Distribution: Explain if the site might attempt to install harmful software (like viruses, ransomware, spyware, keyloggers). Refer to flags like 'suspicious_javascript_placeholder' or 'drive_by_download_indicator' if present in the features, explaining they suggest malware.
    *   Social Engineering: Briefly explain that these sites often use manipulative tactics to trick users into performing actions or divulging information.
4.  Provide a strong warning and advise the user NOT to proceed to the website, click any links, download any files, or enter any personal information.

If the classification is 'safe':
1.  Reassure the user that the URL appears to be safe based on the current analysis.
2.  Briefly mention positive indicators from the 'Analysis Report (Features)' if available (e.g., "The site is recognized as a trusted domain," or "It uses a valid SSL certificate for secure communication," or "It has a good reputation score.").
3.  Conclude by reminding the user to always remain vigilant when browsing online, as no detection method is 100% infallible, and new threats emerge constantly. Advise them to look for HTTPS, be wary of unexpected requests for information, and keep their software updated.

Keep the explanation clear, user-friendly, and actionable. Aim for a helpful and informative tone. Avoid overly technical jargon where possible; if technical terms are necessary (like SSL, malware types), provide a brief, simple explanation.
The final output should be just the explanation string.
Explanation: `,
});

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema,
    outputSchema: GenerateExplanationOutputSchema,
  },
  async input => {
    // Log the input to the AI to help with debugging prompts
    // console.log('Generating explanation for:', JSON.stringify(input, null, 2));
    const {output} = await prompt(input);
    if (!output) {
      // Fallback or error handling if AI returns no output
      return { explanation: "Could not generate an explanation at this time. The URL classification stands as reported." };
    }
    return output;
  }
);

