import { useState } from "react";
import { Upload, FileText, Type, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadSectionProps {
  onAnalyze: (content: string, source: 'file' | 'text', docId?: string) => void;
}

const BACKEND_URL = process.env.VITE_BACKEND_URL || "http://localhost:8000";

export function UploadSection({ onAnalyze }: UploadSectionProps) {
  const [textContent, setTextContent] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragleave" || e.type === "dragover") {
      setDragActive(e.type === "dragenter" || e.type === "dragover");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const callAnalysisAPI = async ({ text, fileUrl, docId }: { text?: string; fileUrl?: string; docId: string }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, file_url: fileUrl, doc_id: docId }),
      });
      if (!res.ok) throw new Error("Failed to analyze document");
      const result = await res.json();
      return result;
    } catch (err: any) {
      toast({
        title: "Analysis failed",
        description: err.message || "Could not analyze document.",
        variant: "destructive",
      });
      return null;
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    const allowedTypes = ["application/pdf", "text/plain"]; // PDF and TXT
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or text file.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // Get user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error("User not authenticated");
      const userId = userData.user.id;
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${Date.now()}-${file.name}`;
      const { data: storageData, error: storageError } = await supabase.storage.from('uploads').upload(filePath, file, { upsert: false });
      if (storageError) throw storageError;
      // Get public URL (if needed, or use signed URL in production)
      const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(filePath);
      const fileUrl = urlData?.publicUrl || '';
      // Read file content (for text analysis)
      let content = "";
      if (file.type === "text/plain") {
        content = await file.text();
      } else if (file.type === "application/pdf") {
        // For PDFs, send to backend for extraction in next step
        content = "";
      }
      // Insert into documents table
      const { data: docData, error: docError } = await supabase.from('documents').insert([
        {
          user_id: userId,
          original_text: content || "PDF uploaded", // Placeholder for PDF, will be updated after backend analysis
        },
      ]).select();
      if (docError || !docData || !docData[0]) throw docError || new Error("Failed to create document");
      const documentId = docData[0].id;
      // Insert into files table
      const { error: fileDbError } = await supabase.from('files').insert([
        {
          document_id: documentId,
          file_name: file.name,
          file_size: file.size,
          file_url: fileUrl,
        },
      ]);
      if (fileDbError) throw fileDbError;
      toast({
        title: "File uploaded successfully!",
        description: "Your document is being analyzed...",
      });
      // Call backend for analysis
      const analysisResult = await callAnalysisAPI({
        text: content || undefined,
        fileUrl: file.type === "application/pdf" ? fileUrl : undefined,
        docId: documentId,
      });
      if (analysisResult) {
        // Save analysis result to Supabase
        const { error: updateError } = await supabase.from('documents').update({
          simplified_text: analysisResult.summary,
          explanations: analysisResult.explanations,
          risks: analysisResult.highlights,
        }).eq('id', documentId);
        if (updateError) {
          toast({
            title: "Failed to save analysis result",
            description: updateError.message,
            variant: "destructive",
          });
        }
        onAnalyze(analysisResult, 'file', documentId);
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "There was an error processing your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalyze = async () => {
    if (!textContent.trim()) {
      toast({
        title: "No content to analyze",
        description: "Please enter some terms & conditions text.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      // Get user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) throw new Error("User not authenticated");
      const userId = userData.user.id;
      // Insert into documents table
      const { data: docData, error: docError } = await supabase.from('documents').insert([
        {
          user_id: userId,
          original_text: textContent,
        },
      ]).select();
      if (docError || !docData || !docData[0]) throw docError || new Error("Failed to create document");
      const documentId = docData[0].id;
      toast({
        title: "Text submitted successfully!",
        description: "Your content is being analyzed...",
      });
      // Call backend for analysis
      const analysisResult = await callAnalysisAPI({
        text: textContent,
        docId: documentId,
      });
      if (analysisResult) {
        // Save analysis result to Supabase
        const { error: updateError } = await supabase.from('documents').update({
          simplified_text: analysisResult.summary,
          explanations: analysisResult.explanations,
          risks: analysisResult.highlights,
        }).eq('id', documentId);
        if (updateError) {
          toast({
            title: "Failed to save analysis result",
            description: updateError.message,
            variant: "destructive",
          });
        }
        onAnalyze(analysisResult, 'text', documentId);
      }
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message || "There was an error processing your text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-4 animate-gentle-fade">
        <h2 className="text-3xl font-bold text-foreground">
          Simplify Your Terms & Conditions
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload a document or paste your legal text, and we'll translate it into plain English 
          with clear explanations of potential risks.
        </p>
      </div>
      <Card className="shadow-trust animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>Add Your Document</span>
          </CardTitle>
          <CardDescription className="text-base">
            Choose how you'd like to provide your terms & conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="upload" className="text-base">
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="text" className="text-base">
                <Type className="h-4 w-4 mr-2" />
                Paste Text
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive 
                    ? 'border-primary bg-primary-light' 
                    : 'border-border hover:border-primary/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-medium">
                      Drag & drop your file here
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports PDF and text files • English language only
                    </p>
                  </div>
                  <div className="flex items-center justify-center">
                    <Label htmlFor="file-upload">
                      <Button variant="outline" className="cursor-pointer" disabled={loading}>
                        {loading ? "Processing..." : "Choose File"}
                      </Button>
                    </Label>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf,.txt"
                      onChange={handleFileInput}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="text" className="mt-6">
              <div className="space-y-4">
                <Label htmlFor="text-content" className="text-base font-medium">
                  Terms & Conditions Text
                </Label>
                <Textarea
                  id="text-content"
                  placeholder="Paste your terms & conditions, privacy policy, or any legal document here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  className="min-h-[200px] text-base resize-none"
                  disabled={loading}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>English language only</span>
                  </div>
                  <Button 
                    onClick={handleTextAnalyze}
                    className="bg-gradient-primary shadow-glow hover:shadow-trust"
                    disabled={!textContent.trim() || loading}
                  >
                    {loading ? "Processing..." : "Analyze Text"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}