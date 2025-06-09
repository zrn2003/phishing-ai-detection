
// This file uses server-side code.
"use server";

import { z } from "zod";
import { generateExplanation, type GenerateExplanationInput } from "@/ai/flows/generate-explanation";

const AnalyzeUrlInputSchema = z.object({
  url: z.string().url({ message: "Invalid URL format. Please enter a valid URL (e.g., https://example.com)." }),
});

export interface UrlAnalysisResult {
  url: string;
  classification: 'safe' | 'phishing' | 'error' | null; // Allow null for initial state
  explanation: string | null;
  error?: string | null;
  submittedUrl: string;
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
async function fetchRealtimePhishingAnalysis(url: string): Promise<PhishingApiReport> {
  console.log("--- fetchRealtimePhishingAnalysis ---");
  console.log("Analyzing URL:", url);

  // Simulate API call latency
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  const lowerUrl = url.toLowerCase();
  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch (e) {
    console.log("Error parsing URL:", e);
    return {
      classification: 'phishing',
      confidenceScore: 0.5,
      detectedFlags: ["invalid_url_structure"],
      threatType: "Invalid URL",
      errorMessage: "The provided URL was malformed.",
    };
  }

  // Specific test cases for mock API
  if (lowerUrl.includes("phishing.example.com") || lowerUrl.includes("malicious-site.org")) {
    console.log("Condition met: specific phishing domain");
    return {
      classification: 'phishing',
      confidenceScore: 0.95,
      detectedFlags: ["known_phishing_domain", "suspicious_keywords_in_path", "reported_by_community"],
      threatType: "Deceptive Content/Known Phishing",
    };
  }

  // Check for IP address as hostname
  if (urlObj.hostname && /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(urlObj.hostname)) {
    console.log("Condition met: IP address as host");
    return {
      classification: 'phishing',
      confidenceScore: 0.80,
      detectedFlags: ["ip_address_as_host", "no_ssl_on_sensitive_path_placeholder", "unusual_url_structure"],
      threatType: "Network Anomaly/Suspicious Infrastructure",
    };
  }

  // Specific safe cases
  if (lowerUrl.includes("safe.example.com") || lowerUrl.startsWith("https://google.com") || lowerUrl.startsWith("https://github.com")) {
    console.log("Condition met: specific safe domain");
    return {
      classification: 'safe',
      confidenceScore: 0.99,
      detectedFlags: ["trusted_domain", "valid_ssl", "good_reputation_score"],
      threatType: "None",
    };
  }

  // Heuristic: Long URL, many special characters, no HTTPS
   if (url.length > 75 && (url.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/g) || []).length > 5 && !url.startsWith("https://")) {
     console.log("Condition met: long URL, special chars, no HTTPS heuristic");
     return {
        classification: 'phishing',
        confidenceScore: 0.70,
        detectedFlags: ["long_url", "excessive_special_chars", "no_https", "obfuscated_path_elements"],
        threatType: "Suspicious URL Structure"
     };
  }

  // Heuristic: Domain impersonation
  if (lowerUrl.includes("login-very-secure-bank.com") && !lowerUrl.startsWith("https://actual-bank.com")){
      console.log("Condition met: domain impersonation heuristic");
      return {
        classification: 'phishing',
        confidenceScore: 0.90,
        detectedFlags: ["domain_impersonation_heuristic", "newly_registered_domain_placeholder", "urgent_call_to_action_placeholder"],
        threatType: "Brand Impersonation/Credential Theft",
      }
  }

  // Default mock response or more nuanced logic can be added here
  const randomNumber = Math.random();
  console.log("Random chance check for phishing. Math.random() was:", randomNumber);
  // 50% chance of phishing for URLs not caught by specific rules
  if (randomNumber > 0.5) { 
    console.log("Condition met: random chance marked as phishing");
    return {
      classification: 'phishing',
      confidenceScore: 0.65,
      detectedFlags: ["heuristic_detection", "uncommon_tld_placeholder", "suspicious_javascript_placeholder"],
      threatType: "Heuristic Analysis/Potential Malware Vector",
    };
  }

  console.log("Defaulting to safe classification");
  return {
    classification: 'safe',
    confidenceScore: 0.85,
    detectedFlags: ["general_scan_ok", "moderate_domain_age"],
    threatType: "None",
  };
}


export async function analyzeUrlAction(prevState: any, formData: FormData): Promise<UrlAnalysisResult> {
  console.log("\n--- analyzeUrlAction ---");
  const rawUrl = formData.get("url");
  const submittedUrlString = typeof rawUrl === 'string' ? rawUrl : "";
  console.log("Received URL for analysis:", submittedUrlString);

  const validatedFields = AnalyzeUrlInputSchema.safeParse({ url: rawUrl });

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.errors.map(e => e.message).join(', ');
    console.log("Validation failed:", errorMessages);
    const result: UrlAnalysisResult = {
      url: submittedUrlString,
      classification: 'error',
      explanation: "Invalid URL provided. " + errorMessages,
      error: errorMessages,
      submittedUrl: submittedUrlString,
    };
    console.log("Returning validation error result:", JSON.stringify(result, null, 2));
    return result;
  }

  const url = validatedFields.data.url;
  console.log("Validated URL:", url);

  try {
    console.log("Calling fetchRealtimePhishingAnalysis...");
    const apiReport = await fetchRealtimePhishingAnalysis(url);
    console.log("Received API Report:", JSON.stringify(apiReport, null, 2));

    if (apiReport.errorMessage && apiReport.classification !== 'safe' && apiReport.classification !== 'phishing') {
      console.log("API reported an operational error:", apiReport.errorMessage);
      const result: UrlAnalysisResult = {
        url,
        classification: 'error',
        explanation: `Analysis API Error: ${apiReport.errorMessage}`,
        error: apiReport.errorMessage,
        submittedUrl: url,
      };
      console.log("Returning API operational error result:", JSON.stringify(result, null, 2));
      return result;
    }

    console.log("Preparing input for generateExplanation AI flow...");
    const explanationInput: GenerateExplanationInput = {
      url,
      classification: apiReport.classification,
      features: apiReport as Record<string, any>,
    };
    
    let explanationResultText = "No explanation generated.";
    if (apiReport.classification === 'safe' || apiReport.classification === 'phishing') { 
        console.log("Calling generateExplanation AI flow...");
        const explanationResult = await generateExplanation(explanationInput);
        explanationResultText = explanationResult.explanation;
        console.log("Received explanation from AI:", explanationResultText);
    } else {
        explanationResultText = apiReport.errorMessage || "Could not analyze URL due to an API error or indeterminate classification.";
        console.log("Skipped AI explanation due to API error/classification:", explanationResultText);
    }

    const finalResult: UrlAnalysisResult = {
      url,
      classification: apiReport.classification,
      explanation: explanationResultText,
      error: apiReport.classification === 'error' ? (apiReport.errorMessage || "API error") : null,
      submittedUrl: url,
    };
    console.log("Returning final success result:", JSON.stringify(finalResult, null, 2));
    return finalResult;

  } catch (error) {
    console.error("Error in analyzeUrlAction:", error);
    let errorMessage = "An unexpected error occurred during URL analysis.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    const errorResult: UrlAnalysisResult = {
      url: url || submittedUrlString,
      classification: 'error',
      explanation: `Failed to analyze URL: ${errorMessage}`,
      error: errorMessage,
      submittedUrl: url || submittedUrlString,
    };
    console.log("Returning caught error result:", JSON.stringify(errorResult, null, 2));
    return errorResult;
  }
}
