// This file uses server-side code.
"use server";

import { z } from "zod";
import { generateExplanation, type GenerateExplanationInput } from "@/ai/flows/generate-explanation";

const AnalyzeUrlInputSchema = z.object({
  url: z.string().url({ message: "Invalid URL format." }),
});

export interface UrlAnalysisResult {
  url: string;
  classification: 'safe' | 'phishing' | 'error';
  explanation: string | null;
  error?: string | null;
  submittedUrl: string;
}

interface UrlFeatures {
  urlLength: number;
  hasHttps: boolean;
  subdomainCount: number;
  hasIpAddress: boolean;
  specialCharsCount: number;
  keywordsFound: string[];
}

// Mock feature extraction
function extractFeatures(url: string): UrlFeatures {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    // Handle cases where URL constructor fails (e.g. invalid URL not caught by Zod, though unlikely)
    // For simplicity, returning default/error features. A real scenario might throw or log.
    return {
      urlLength: url.length,
      hasHttps: false,
      subdomainCount: 0,
      hasIpAddress: false,
      specialCharsCount: (url.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g) || []).length,
      keywordsFound: [],
    };
  }
  
  const specialCharsRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g;
  const commonPhishingKeywords = ["login", "update", "verify", "secure", "account", "bank", "password", "confirm", "support"];
  
  return {
    urlLength: url.length,
    hasHttps: parsedUrl.protocol === "https:",
    subdomainCount: Math.max(0, parsedUrl.hostname.split(".").length - 2), // Approximation
    hasIpAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(parsedUrl.hostname),
    specialCharsCount: (url.match(specialCharsRegex) || []).length,
    keywordsFound: commonPhishingKeywords.filter(kw => url.toLowerCase().includes(kw)),
  };
}

// Mock classification logic
function classifyUrl(url: string, features: UrlFeatures): 'safe' | 'phishing' {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("phishing.example.com") || lowerUrl.includes("malicious-site.org")) {
    return 'phishing';
  }
  if (features.hasIpAddress) {
    return 'phishing';
  }
  if (features.keywordsFound.length >= 2 && !features.hasHttps) {
    return 'phishing';
  }
  if (features.urlLength > 75 && features.specialCharsCount > 5) {
     return 'phishing';
  }
  if (lowerUrl.includes("safe.example.com")) {
    return 'safe';
  }
  // Default to safe for this mock
  return 'safe';
}

export async function analyzeUrlAction(prevState: any, formData: FormData): Promise<UrlAnalysisResult> {
  const rawUrl = formData.get("url");
  const validatedFields = AnalyzeUrlInputSchema.safeParse({ url: rawUrl });

  if (!validatedFields.success) {
    return {
      url: typeof rawUrl === 'string' ? rawUrl : "",
      classification: 'error',
      explanation: "Invalid URL provided. Please enter a valid URL (e.g., https://example.com).",
      error: validatedFields.error.errors.map(e => e.message).join(', '),
      submittedUrl: typeof rawUrl === 'string' ? rawUrl : "",
    };
  }

  const url = validatedFields.data.url;

  try {
    // 1. Feature Extraction (mocked)
    const features = extractFeatures(url);

    // 2. Classification (mocked)
    const classification = classifyUrl(url, features);

    // 3. Generate Explanation using AI flow
    const explanationInput: GenerateExplanationInput = {
      url,
      classification,
      features: features as Record<string, any>, // Cast because Genkit schema is z.record(z.any())
    };
    
    const explanationResult = await generateExplanation(explanationInput);

    return {
      url,
      classification,
      explanation: explanationResult.explanation,
      error: null,
      submittedUrl: url,
    };

  } catch (error) {
    console.error("Error in analyzeUrlAction:", error);
    let errorMessage = "An unexpected error occurred during analysis.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      url,
      classification: 'error',
      explanation: `Failed to analyze URL: ${errorMessage}`,
      error: errorMessage,
      submittedUrl: url,
    };
  }
}
