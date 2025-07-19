import { useEffect, useState } from "react";
import { FileText, Calendar, Download, Eye, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  onViewAnalysis: (docId: string) => void;
}

export function HistoryPanel({ isOpen, onClose, onViewAnalysis }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) throw new Error("User not authenticated");
        const userId = userData.user.id;
        const { data, error: docError } = await supabase
          .from('documents')
          .select('id, original_text, simplified_text, risks, uploaded_at, files:file_id(file_name)')
          .eq('user_id', userId)
          .order('uploaded_at', { ascending: false });
        if (docError) throw docError;
        const items: HistoryItem[] = (data || []).map((doc: any) => ({
          id: doc.id,
          title: doc.files?.file_name || doc.original_text?.split(' ').slice(0, 8).join(' ') + (doc.original_text?.split(' ').length > 8 ? '...' : ''),
          date: doc.uploaded_at,
          riskCount: Array.isArray(doc.risks) ? doc.risks.length : (doc.risks ? Object.keys(doc.risks).length : 0),
          type: doc.files?.file_name ? 'file' : 'text',
          fileName: doc.files?.file_name,
        }));
        setHistory(items);
      } catch (err: any) {
        setError(err.message || "Failed to load history");
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [isOpen]);

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

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      // Delete document (RLS ensures only user's own)
      const { error: docError } = await supabase.from('documents').delete().eq('id', docId);
      if (docError) throw docError;
      setHistory((prev) => prev.filter((item) => item.id !== docId));
      toast({
        title: "Document deleted",
        description: "The document and its analysis have been removed.",
      });
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.message || "Could not delete document.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  if (!isOpen) return null;

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
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : error ? (
              <div className="text-center py-8 text-destructive">{error}</div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No analyses yet</p>
                <p className="text-sm text-muted-foreground">
                  Your simplified documents will appear here
                </p>
              </div>
            ) : (
              history.map((item) => (
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
                        onClick={() => onViewAnalysis(item.id)}
                        disabled={deletingId === item.id}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmDeleteId(item.id)}
                        disabled={deletingId === item.id}
                        title="Delete document"
                      >
                        {deletingId === item.id ? (
                          <span className="animate-spin"><Trash2 className="h-3 w-3" /></span>
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                  {/* Confirmation dialog */}
                  {confirmDeleteId === item.id && (
                    <div className="p-4 bg-destructive/10 rounded flex flex-col items-center space-y-2">
                      <div className="text-sm text-destructive font-semibold">Delete this document?</div>
                      <div className="flex space-x-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                        >
                          Yes, Delete
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={deletingId === item.id}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}