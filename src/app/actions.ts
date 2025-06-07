
// This file uses server-side code.
"use server";

import { z } from "zod";
import { generateExplanation, type GenerateExplanationInput } from "@/ai/flows/generate-explanation";

const AnalyzeUrlInputSchema = z.object({
  url: z.string().url({ message: "Invalid URL format. Please enter a valid URL (e.g., https://example.com)." }),
});

export interface UrlAnalysisResult {
  url: string;
  classification: 'safe' | 'phishing' | 'error';
  explanation: string | null;
  error?: string | null;
  submittedUrl: string;
  // We can also include the raw report for more detailed display if needed later
  // apiReport?: PhishingApiReport | null; 
}

// Interface for our mock Phishing Detection API report
interface PhishingApiReport {
  classification: 'safe' | 'phishing';
  confidenceScore?: number; // e.g., 0.0 to 1.0
  detectedFlags?: string[]; // e.g., ["known_phishing_domain", "suspicious_redirect"]
  threatType?: string; // e.g., "Deceptive Content", "Malware", "Social Engineering"
  errorMessage?: string; // If the API itself had an error
}

// Mock function to simulate calling an external Phishing Detection API
// This will now return a more detailed report
async function fetchRealtimePhishingAnalysis(url: string): Promise<PhishingApiReport> {
  // Simulate API call latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const lowerUrl = url.toLowerCase();
  const urlObj = new URL(url); // For easier parsing of hostname etc.

  // Specific test cases for mock API
  if (lowerUrl.includes("phishing.example.com") || lowerUrl.includes("malicious-site.org")) {
    return {
      classification: 'phishing',
      confidenceScore: 0.95,
      detectedFlags: ["known_phishing_domain", "suspicious_keywords_in_path", "reported_by_community"],
      threatType: "Deceptive Content/Known Phishing",
    };
  }
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(urlObj.hostname)) {
    return {
      classification: 'phishing',
      confidenceScore: 0.80,
      detectedFlags: ["ip_address_as_host", "no_ssl_on_sensitive_path_placeholder", "unusual_url_structure"],
      threatType: "Network Anomaly/Suspicious Infrastructure",
    };
  }
  if (lowerUrl.includes("safe.example.com") || lowerUrl.startsWith("https://google.com") || lowerUrl.startsWith("https://github.com")) {
    return {
      classification: 'safe',
      confidenceScore: 0.99,
      detectedFlags: ["trusted_domain", "valid_ssl", "good_reputation_score"],
      threatType: "None",
    };
  }
   if (url.length > 75 && (url.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g) || []).length > 5 && !url.startsWith("https://")) {
     return {
        classification: 'phishing',
        confidenceScore: 0.70,
        detectedFlags: ["long_url", "excessive_special_chars", "no_https", "obfuscated_path_elements"],
        threatType: "Suspicious URL Structure"
     };
  }
  if (lowerUrl.includes("login-very-secure-bank.com") && !lowerUrl.startsWith("https://actual-bank.com")){
      return {
        classification: 'phishing',
        confidenceScore: 0.90,
        detectedFlags: ["domain_impersonation_heuristic", "newly_registered_domain_placeholder", "urgent_call_to_action_placeholder"],
        threatType: "Brand Impersonation/Credential Theft",
      }
  }


  // Default mock response or more nuanced logic can be added here
  if (Math.random() > 0.7) { // Simulate occasional phishing detection for other URLs
    return {
      classification: 'phishing',
      confidenceScore: 0.65,
      detectedFlags: ["heuristic_detection", "uncommon_tld_placeholder", "suspicious_javascript_placeholder"],
      threatType: "Heuristic Analysis/Potential Malware Vector",
    };
  }

  // Default to safe if not caught by specific phishing rules
  return {
    classification: 'safe',
    confidenceScore: 0.85,
    detectedFlags: ["general_scan_ok", "moderate_domain_age"],
    threatType: "None",
  };
}


export async function analyzeUrlAction(prevState: any, formData: FormData): Promise<UrlAnalysisResult> {
  const rawUrl = formData.get("url");
  const validatedFields = AnalyzeUrlInputSchema.safeParse({ url: rawUrl });

  const submittedUrlString = typeof rawUrl === 'string' ? rawUrl : "";

  if (!validatedFields.success) {
    return {
      url: submittedUrlString,
      classification: 'error',
      explanation: "Invalid URL provided. " + validatedFields.error.errors.map(e => e.message).join(', '),
      error: validatedFields.error.errors.map(e => e.message).join(', '),
      submittedUrl: submittedUrlString,
    };
  }

  const url = validatedFields.data.url;

  try {
    // 1. Call the (mocked) enhanced Phishing Detection API
    const apiReport = await fetchRealtimePhishingAnalysis(url);

    if (apiReport.errorMessage) {
      // This case is if the API itself reports an operational error
      return {
        url,
        classification: 'error',
        explanation: `Analysis API Error: ${apiReport.errorMessage}`,
        error: apiReport.errorMessage,
        submittedUrl: url,
      };
    }

    // 2. Prepare input for the explanation generation flow
    // The 'features' will now be the detailed report from the API
    const explanationInput: GenerateExplanationInput = {
      url,
      classification: apiReport.classification, // 'safe' or 'phishing'
      features: apiReport as Record<string, any>, // Pass the whole API report as features
    };
    
    // 3. Generate Explanation using AI flow
    let explanationResultText = "No explanation generated.";
    if (apiReport.classification !== 'error') { // Only generate explanation if API call was successful
        const explanationResult = await generateExplanation(explanationInput);
        explanationResultText = explanationResult.explanation;
    } else {
        explanationResultText = apiReport.errorMessage || "Could not analyze URL due to an API error.";
    }


    return {
      url,
      classification: apiReport.classification,
      explanation: explanationResultText,
      error: null, // No error in this path, API error handled above
      submittedUrl: url,
      // apiReport: apiReport, // Optionally include the raw report in the result
    };

  } catch (error) {
    console.error("Error in analyzeUrlAction:", error);
    let errorMessage = "An unexpected error occurred during URL analysis.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
     // This catches errors in the overall action, not just the API call.
    return {
      url: url || submittedUrlString, // Use validated url if available
      classification: 'error',
      explanation: `Failed to analyze URL: ${errorMessage}`,
      error: errorMessage,
      submittedUrl: url || submittedUrlString,
    };
  }
}

