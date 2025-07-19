import { useState } from "react";
import { Download, FileText, AlertTriangle, HelpCircle, ChevronLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:8000";

interface AnalysisResultsProps {
  analysisResult: {
    summary: string;
    explanations: Record<string, string>;
    highlights: Array<{ text: string; type: string }>;
    doc_id: string;
    source?: 'file' | 'text';
  };
  onBack: () => void;
}

export function AnalysisResults({ analysisResult, onBack }: AnalysisResultsProps) {
  const [downloading, setDownloading] = useState<'txt' | 'pdf' | null>(null);
  const { toast } = useToast();
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const handleDownload = async (format: 'txt' | 'pdf') => {
    setDownloading(format);
    setDownloadFeedback(null);
    try {
      const res = await fetch(`${BACKEND_URL}/export/${analysisResult.doc_id}.${format}`);
      if (!res.ok) throw new Error("Failed to download file");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis_${analysisResult.doc_id}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setDownloadFeedback(`Download of ${format.toUpperCase()} started.`);
    } catch (err: any) {
      setDownloadFeedback("Download failed.");
      toast({
        title: "Download failed",
        description: err.message || "Could not download file.",
        variant: "destructive",
      });
    } finally {
      setDownloading(null);
    }
  };

  // Helper for risk highlighting (accessible)
  const highlightClass = (type: string) => {
    if (type === 'critical') return 'risk-highlight-critical p-2 rounded bg-red-100 border-l-4 border-red-500 flex items-center gap-2';
    if (type === 'warning') return 'risk-highlight-warning p-2 rounded bg-yellow-100 border-l-4 border-yellow-500 flex items-center gap-2';
    return 'p-2 rounded bg-muted/30 flex items-center gap-2';
  };

  const riskIcon = (type: string) => {
    if (type === 'critical') return <span aria-label="Critical risk" title="Critical risk" className="text-red-600 font-bold">🚨</span>;
    if (type === 'warning') return <span aria-label="Warning risk" title="Warning risk" className="text-yellow-600 font-bold">⚠️</span>;
    return <span aria-label="Info" title="Info" className="text-muted-foreground font-bold">ℹ️</span>;
  };

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
                disabled={downloading === 'txt'}
                aria-label="Download as TXT"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">TXT</span>
              </Button>
              <Button 
                onClick={() => handleDownload('pdf')}
                className="flex items-center space-x-2 bg-gradient-primary"
                disabled={downloading === 'pdf'}
                aria-label="Download as PDF"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
          <div aria-live="polite" className="sr-only">{downloadFeedback}</div>
        </div>
      </div>
      {/* Results Grid */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Summary */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span>Summary</span>
              </CardTitle>
              <CardDescription>
                The plain-English summary of your document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed">
                  {analysisResult.summary}
                </pre>
              </div>
            </CardContent>
          </Card>
          {/* Explanations & Highlights */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5 text-primary" />
                <span>Risks & Explanations</span>
              </CardTitle>
              <CardDescription className="flex items-center justify-between">
                <span>Risk highlights and plain-English explanations</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-warning bg-warning-light border-warning">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {analysisResult.highlights?.length || 0} Risks Found
                  </Badge>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none space-y-4 max-h-[600px] overflow-y-auto">
                <ul className="space-y-2 text-sm">
                  {analysisResult.highlights?.map((h, idx) => (
                    <li key={idx} className={highlightClass(h.type)}>
                      {riskIcon(h.type)}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className="cursor-help inline-flex items-center space-x-1 outline-none focus:ring-2 focus:ring-primary"
                              tabIndex={0}
                              aria-label={`Explanation for: ${h.text}`}
                            >
                              <strong>{h.text}</strong>
                              <HelpCircle className="h-3 w-3 inline ml-1" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs p-3 tooltip-appear" aria-live="polite">
                            <p className="text-sm">{analysisResult.explanations[h.text] || "No explanation available."}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}