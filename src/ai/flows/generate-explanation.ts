
// This file uses server-side code.
'use server';


import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExplanationInputSchema = z.object({
  url: z.string().describe('The URL to explain the classification for.'),
  classification: z.enum(['safe', 'phishing']).describe('The classification of the URL, determined by an analysis process.'),
  features: z.record(z.any()).describe('The detailed analysis report from a threat intelligence API (simulating services like Google Safe Browsing). This includes fields like classification, confidenceScore, detectedFlags, and threatType.'),
});
export type GenerateExplanationInput = z.infer<typeof GenerateExplanationInputSchema>;

// Specific schema for the prompt's input, where features is a string
const GenerateExplanationPromptInternalInputSchema = z.object({
  url: z.string().describe('The URL to explain the classification for.'),
  classification: z.enum(['safe', 'phishing']).describe('The classification of the URL, determined by an analysis process.'),
  featuresString: z.string().describe('The JSON stringified detailed analysis report from a threat intelligence API. This includes fields like classification, confidenceScore, detectedFlags, and threatType.'),
});
type GenerateExplanationPromptInternalInput = z.infer<typeof GenerateExplanationPromptInternalInputSchema>;


const GenerateExplanationOutputSchema = z.object({
  explanation: z.string().describe('The comprehensive explanation of why the URL was classified as phishing or safe, including potential risks and attack vectors if applicable.'),
});
export type GenerateExplanationOutput = z.infer<typeof GenerateExplanationOutputSchema>;

export async function generateExplanation(input: GenerateExplanationInput): Promise<GenerateExplanationOutput> {
  return generateExplanationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExplanationPrompt',
  input: {schema: GenerateExplanationPromptInternalInputSchema}, // Use the internal schema
  output: {schema: GenerateExplanationOutputSchema},
  prompt: `You are a cybersecurity expert specializing in analyzing URLs and explaining their safety status to users in an easy-to-understand manner.
You have been provided with a URL, its classification ('safe' or 'phishing'), and a detailed analysis report (features) from a threat intelligence API, simulating services like Google Safe Browsing.

URL: {{{url}}}
Classification: {{{classification}}}
Analysis Report (Features): {{{featuresString}}}

Your task is to generate a comprehensive explanation.

**Important: Start your explanation by clearly stating the classification of the URL based on the 'Classification' field provided above.**

If the classification is 'phishing':
1.  Begin with a sentence like: "Warning: Based on our analysis, the URL '{{{url}}}' is classified as **phishing** and is considered potentially dangerous."
2.  Then, based on the 'Analysis Report (Features)', explain the SPECIFIC reasons WHY it's considered phishing. For example, if 'features.detectedFlags' includes 'known_phishing_domain', mention that it's a known malicious site. If 'features.threatType' is 'Deceptive Content', explain that it might try to trick the user. If the 'features.confidenceScore' is high, mention that the system is very confident in this assessment.
3.  Describe the POTENTIAL RISKS and common attack vectors associated with such a site. This includes:
    *   Credential Theft: Explain how the site might try to steal usernames, passwords, financial details (e.g., fake login pages, deceptive forms asking for sensitive information). Mention that stolen credentials can lead to unauthorized account access, financial loss, or identity theft.
    *   Malware Distribution: Explain if the site might attempt to install harmful software (like viruses, ransomware, spyware, keyloggers). Refer to flags like 'suspicious_javascript_placeholder' or 'drive_by_download_indicator' if present in the features, explaining they suggest malware.
    *   Social Engineering: Briefly explain that these sites often use manipulative tactics to trick users into performing actions or divulging information.
4.  Provide a strong warning and advise the user NOT to proceed to the website, click any links, download any files, or enter any personal information.

If the classification is 'safe':
1.  Begin with a sentence like: "Good news: Based on our analysis, the URL '{{{url}}}' is classified as **safe**."
2.  Then, briefly mention positive indicators from the 'Analysis Report (Features)' if available (e.g., "The site is recognized as a trusted domain," or "It uses a valid SSL certificate for secure communication," or "It has a good reputation score.").
3.  Conclude by reminding the user to always remain vigilant when browsing online, as no detection method is 100% infallible, and new threats emerge constantly. Advise them to look for HTTPS, be wary of unexpected requests for information, and keep their software updated.

Keep the explanation clear, user-friendly, and actionable. Aim for a helpful and informative tone. Avoid overly technical jargon where possible; if technical terms are necessary (like SSL, malware types), provide a brief, simple explanation.
The final output should be just the explanation string.
Explanation: `,
});

const generateExplanationFlow = ai.defineFlow(
  {
    name: 'generateExplanationFlow',
    inputSchema: GenerateExplanationInputSchema, // Flow's external input
    outputSchema: GenerateExplanationOutputSchema,
  },
  async (input: GenerateExplanationInput) => {
    // Prepare the payload for the prompt
    const promptInputPayload: GenerateExplanationPromptInternalInput = {
      url: input.url,
      classification: input.classification,
      featuresString: JSON.stringify(input.features, null, 2), // Stringify features here
    };

    // Log the input to the AI to help with debugging prompts
    // console.log('Generating explanation for (prompt payload):', JSON.stringify(promptInputPayload, null, 2));
    const {output} = await prompt(promptInputPayload);
    if (!output) {
      // Fallback or error handling if AI returns no output
      return { explanation: "Could not generate an explanation at this time. The URL classification stands as reported." };
    }
    return output;
  }
);

