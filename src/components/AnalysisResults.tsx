import { useState } from "react";
import { Download, FileText, AlertTriangle, HelpCircle, ChevronLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResultsProps {
  originalContent: string;
  onBack: () => void;
}

// Mock simplified content with risk highlights
const mockSimplifiedContent = `
# Your Terms & Conditions - Plain English Summary

## What You're Agreeing To

**In simple terms:** This website provides a service, and by using it, you agree to follow their rules.

## Key Points to Know

### 1. Your Account and Data
- You can create an account to save your work
- <span class="risk-highlight-warning">⚠️ **RISK**: They can delete your account at any time without warning</span>
- Your personal data will be stored and may be shared with partners

### 2. What You Can and Can't Do
- You can use the service for personal and business purposes
- <span class="risk-highlight-critical">🚨 **CRITICAL RISK**: You cannot sue them if something goes wrong - you must use arbitration instead</span>
- You're responsible for keeping your password safe

### 3. Payment and Refunds
- Some features require payment
- <span class="risk-highlight-warning">⚠️ **RISK**: Refunds are only available within 7 days and only for unused services</span>
- Prices can change with 30 days notice

### 4. If Things Go Wrong
- <span class="risk-highlight-critical">🚨 **CRITICAL RISK**: The company limits how much they'll pay if their service causes you problems (maximum $100)</span>
- You agree not to join class-action lawsuits against them

## Bottom Line
This is a fairly standard agreement, but be aware that you're giving up some legal rights, especially around lawsuits and compensation if things go wrong.
`;

const riskExplanations = {
  "delete account": "This means the company can terminate your account without giving you a reason or advance notice. You could lose access to your data and any paid services immediately.",
  "arbitration": "Instead of going to court, you must resolve disputes through arbitration - a private process that often favors companies and limits your legal options.",
  "limited refunds": "You have a very short window to get your money back, and only if you haven't used the service at all. This is stricter than many consumer protection laws.",
  "liability limit": "If their service causes you significant financial loss, they'll only pay up to $100 regardless of the actual damage. This could leave you vulnerable to larger losses."
};

export function AnalysisResults({ originalContent, onBack }: AnalysisResultsProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDownload = (format: 'txt' | 'pdf') => {
    // TODO: Implement actual download functionality
    toast({
      title: `Downloading ${format.toUpperCase()}...`,
      description: "Your simplified summary is being prepared for download.",
    });
  };

  const RiskTooltip = ({ riskKey, children }: { riskKey: string, children: React.ReactNode }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help inline-flex items-center space-x-1">
            {children}
            <HelpCircle className="h-3 w-3 inline ml-1" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs p-3 tooltip-appear">
          <p className="text-sm">{riskExplanations[riskKey as keyof typeof riskExplanations]}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
                <ChevronLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">Analysis Complete</h1>
                <p className="text-sm text-muted-foreground">Your plain-English summary is ready!</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={() => handleDownload('txt')}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">TXT</span>
              </Button>
              <Button 
                onClick={() => handleDownload('pdf')}
                className="flex items-center space-x-2 bg-gradient-primary"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Original Document */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span>Original Document</span>
              </CardTitle>
              <CardDescription>
                The original terms & conditions as provided
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {originalContent}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Simplified Summary */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-primary" />
                <span>Plain English Summary</span>
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>Simplified with risk highlights and explanations</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-warning bg-warning-light border-warning">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    2 Risks Found
                  </Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none space-y-4 max-h-[600px] overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">What You're Agreeing To</h3>
                    <p className="text-muted-foreground">
                      This website provides a service, and by using it, you agree to follow their rules.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Key Points to Know</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">1. Your Account and Data</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• You can create an account to save your work</li>
                          <li className="risk-highlight-warning p-2 rounded">
                            <RiskTooltip riskKey="delete account">
                              <span>⚠️ <strong>RISK</strong>: They can delete your account at any time without warning</span>
                            </RiskTooltip>
                          </li>
                          <li>• Your personal data will be stored and may be shared with partners</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">2. What You Can and Can't Do</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• You can use the service for personal and business purposes</li>
                          <li className="risk-highlight-critical p-2 rounded">
                            <RiskTooltip riskKey="arbitration">
                              <span>🚨 <strong>CRITICAL RISK</strong>: You cannot sue them if something goes wrong - you must use arbitration instead</span>
                            </RiskTooltip>
                          </li>
                          <li>• You're responsible for keeping your password safe</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">3. Payment and Refunds</h4>
                        <ul className="space-y-2 text-sm">
                          <li>• Some features require payment</li>
                          <li className="risk-highlight-warning p-2 rounded">
                            <RiskTooltip riskKey="limited refunds">
                              <span>⚠️ <strong>RISK</strong>: Refunds are only available within 7 days and only for unused services</span>
                            </RiskTooltip>
                          </li>
                          <li>• Prices can change with 30 days notice</li>
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">4. If Things Go Wrong</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="risk-highlight-critical p-2 rounded">
                            <RiskTooltip riskKey="liability limit">
                              <span>🚨 <strong>CRITICAL RISK</strong>: The company limits how much they'll pay if their service causes you problems (maximum $100)</span>
                            </RiskTooltip>
                          </li>
                          <li>• You agree not to join class-action lawsuits against them</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-primary-light p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Bottom Line</h4>
                    <p className="text-sm">
                      This is a fairly standard agreement, but be aware that you're giving up some legal rights, 
                      especially around lawsuits and compensation if things go wrong.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}