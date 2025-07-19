import { useState } from "react";
import { FileText, Calendar, Download, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  riskCount: number;
  type: 'file' | 'text';
  fileName?: string;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onViewAnalysis: (item: HistoryItem) => void;
}

// Mock history data
const mockHistory: HistoryItem[] = [
  {
    id: "1",
    title: "Website Terms of Service",
    date: "2024-01-15",
    riskCount: 3,
    type: 'file',
    fileName: "website-tos.pdf"
  },
  {
    id: "2",
    title: "Privacy Policy Analysis",
    date: "2024-01-14",
    riskCount: 1,
    type: 'text',
  },
  {
    id: "3",
    title: "Software License Agreement",
    date: "2024-01-12",
    riskCount: 5,
    type: 'file',
    fileName: "license.txt"
  },
  {
    id: "4",
    title: "Employment Contract",
    date: "2024-01-10",
    riskCount: 2,
    type: 'file',
    fileName: "contract.pdf"
  }
];

export function HistoryPanel({ isOpen, onClose, onViewAnalysis }: HistoryPanelProps) {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRiskBadgeVariant = (count: number) => {
    if (count === 0) return "secondary";
    if (count <= 2) return "outline";
    return "destructive";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex">
      <div className="ml-auto w-full max-w-md bg-background shadow-xl border-l animate-slide-in-right">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">Analysis History</h2>
            <p className="text-sm text-muted-foreground">Your recent simplifications</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-3">
            {mockHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No analyses yet</p>
                <p className="text-sm text-muted-foreground">
                  Your simplified documents will appear here
                </p>
              </div>
            ) : (
              mockHistory.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base line-clamp-2">{item.title}</CardTitle>
                        <CardDescription className="flex items-center space-x-2 mt-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.date)}</span>
                          {item.type === 'file' && item.fileName && (
                            <>
                              <span>•</span>
                              <span className="truncate">{item.fileName}</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <Badge variant={getRiskBadgeVariant(item.riskCount)}>
                        {item.riskCount} risks
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => onViewAnalysis(item)}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}