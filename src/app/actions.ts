
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

interface PhishingApiReport {
  classification: 'safe' | 'phishing';
  confidenceScore?: number;
  detectedFlags?: string[];
  threatType?: string;
  errorMessage?: string;
}

// Mock function to simulate calling an external Phishing Detection API
async function fetchRealtimePhishingAnalysis(url: string): Promise<PhishingApiReport> {
  // Simulate API call latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const lowerUrl = url.toLowerCase();
  
  // Specific test cases for mock API
  if (lowerUrl.includes("phishing.example.com") || lowerUrl.includes("malicious-site.org")) {
    return {
      classification: 'phishing',
      confidenceScore: 0.95,
      detectedFlags: ["known_phishing_domain", "suspicious_keywords_in_path"],
      threatType: "Deceptive Content",
    };
  }
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(new URL(url).hostname)) {
    return {
      classification: 'phishing',
      confidenceScore: 0.80,
      detectedFlags: ["ip_address_as_host", "no_ssl_on_sensitive_path_placeholder"], // Placeholder, actual SSL check is harder
      threatType: "Network Anomaly",
    };
  }
  if (lowerUrl.includes("safe.example.com") || lowerUrl.startsWith("https://google.com")) {
    return {
      classification: 'safe',
      confidenceScore: 0.99,
      detectedFlags: ["trusted_domain", "valid_ssl"],
    };
  }
  if (url.length > 75 && (url.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g) || []).length > 5 && !url.startsWith("https://")) {
     return {
        classification: 'phishing',
        confidenceScore: 0.70,
        detectedFlags: ["long_url", "excessive_special_chars", "no_https"],
        threatType: "Suspicious URL Structure"
     };
  }

  // Default mock response or more nuanced logic can be added here
  // For simplicity, default to safe if not caught by specific phishing rules
  // In a real API, it might return 'unknown' or require more analysis
  if (Math.random() > 0.8) { // Simulate occasional phishing detection for other URLs
    return {
      classification: 'phishing',
      confidenceScore: 0.65,
      detectedFlags: ["heuristic_detection", "uncommon_tld_placeholder"],
      threatType: "Heuristic Analysis",
    };
  }

  return {
    classification: 'safe',
    confidenceScore: 0.85,
    detectedFlags: ["general_scan_ok"],
  };
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
    // 1. Call the (mocked) Phishing Detection API
    const apiReport = await fetchRealtimePhishingAnalysis(url);

    if (apiReport.errorMessage) {
      return {
        url,
        classification: 'error',
        explanation: `API Error: ${apiReport.errorMessage}`,
        error: apiReport.errorMessage,
        submittedUrl: url,
      };
    }

    // 2. Prepare input for the explanation generation flow
    // The 'features' will now be the report from the API
    const explanationInput: GenerateExplanationInput = {
      url,
      classification: apiReport.classification,
      features: apiReport as Record<string, any>, // Pass the whole API report as features
    };
    
    // 3. Generate Explanation using AI flow
    const explanationResult = await generateExplanation(explanationInput);

    return {
      url,
      classification: apiReport.classification,
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
    // Check if the error is from the API mock itself (e.g. network error simulation)
    // For this example, we'll assume any catch here is a general processing error.
    return {
      url,
      classification: 'error',
      explanation: `Failed to analyze URL: ${errorMessage}`,
      error: errorMessage,
      submittedUrl: url,
    };
  }
}
