"use client";

import type React from 'react';
import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, Search } from "lucide-react";
import PhishGuardLogo from "@/components/PhishGuardLogo";
import UrlResultCard, { type UrlResult } from "@/components/UrlResultCard";
import { analyzeUrlAction } from "./actions";
import { useToast } from "@/hooks/use-toast";


const initialState: UrlResult = {
  url: "",
  classification: null,
  explanation: null,
  error: null,
  submittedUrl: ""
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <Search className="mr-2 h-4 w-4" />
          Analyze URL
        </>
      )}
    </Button>
  );
}

export default function HomePage() {
  const [formState, formAction] = useActionState(analyzeUrlAction, initialState);
  const [currentUrl, setCurrentUrl] = useState('');
  const [displayResult, setDisplayResult] = useState<UrlResult | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (formState && formState.submittedUrl) { // Check if formState is populated
      setDisplayResult(formState);
      if (formState.classification === 'error' && formState.explanation) {
         toast({
           variant: "destructive",
           title: "Analysis Error",
           description: formState.explanation,
         });
      }
    }
  }, [formState, toast]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentUrl(event.target.value);
  };
  
  // Clear results when input changes after a submission
  useEffect(() => {
    if (displayResult && currentUrl !== displayResult.submittedUrl) {
      setDisplayResult(null);
    }
  }, [currentUrl, displayResult]);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-background to-secondary/30">
      <header className="mb-8 text-center">
        <PhishGuardLogo className="justify-center" iconSize={48} textSize="text-5xl" />
        <p className="mt-2 text-lg text-muted-foreground font-body">
          Your AI-powered shield against phishing attacks.
        </p>
      </header>

      <main className="w-full max-w-2xl space-y-8">
        <form action={formAction} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 items-start">
            <Input
              type="url"
              name="url"
              placeholder="Enter URL to analyze (e.g., https://example.com)"
              required
              className="flex-grow text-base md:text-sm"
              value={currentUrl}
              onChange={handleInputChange}
              aria-label="URL to analyze"
            />
            <SubmitButton />
          </div>
        </form>

        {displayResult && displayResult.classification && (
          <UrlResultCard result={displayResult} />
        )}
      </main>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} PhishGuard. Stay safe online.</p>
      </footer>
    </div>
  );
}
