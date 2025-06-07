"use client";

import type React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, ShieldAlert, ShieldCheck, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface UrlResult {
  url: string;
  classification: 'safe' | 'phishing' | 'error' | null;
  explanation: string | null;
  submittedUrl: string;
}

interface UrlResultCardProps {
  result: UrlResult | null;
}

const UrlResultCard: React.FC<UrlResultCardProps> = ({ result }) => {
  if (!result || !result.classification) {
    return null;
  }

  const { classification, explanation, submittedUrl } = result;

  let IconComponent;
  let titleText;
  let badgeVariant: "default" | "destructive" | "secondary" = "secondary";
  let iconColorClass = "";

  switch (classification) {
    case 'safe':
      IconComponent = ShieldCheck;
      titleText = 'This URL appears to be Safe';
      badgeVariant = "default";
      iconColorClass = "text-green-600";
      break;
    case 'phishing':
      IconComponent = ShieldAlert;
      titleText = 'Warning: This URL is Potentially Phishing';
      badgeVariant = "destructive";
      iconColorClass = "text-red-600";
      break;
    case 'error':
      IconComponent = AlertTriangle;
      titleText = 'Error Analyzing URL';
      badgeVariant = "secondary";
      iconColorClass = "text-yellow-600";
      break;
    default:
      IconComponent = HelpCircle;
      titleText = 'Analysis Result';
      iconColorClass = "text-muted-foreground";
  }

  return (
    <Card className="w-full max-w-2xl animate-in fade-in-0 zoom-in-95 duration-500">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <IconComponent size={32} className={iconColorClass} />
          <div>
            <CardTitle className="font-headline text-xl">{titleText}</CardTitle>
            <CardDescription className="break-all">Analyzed URL: {submittedUrl}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-1">Classification:</h3>
            <Badge variant={badgeVariant} className="text-sm capitalize">{classification}</Badge>
          </div>
          {explanation && (
            <div>
              <h3 className="font-semibold text-lg mb-1">Explanation:</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{explanation}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UrlResultCard;
