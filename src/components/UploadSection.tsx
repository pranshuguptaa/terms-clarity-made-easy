import { useState } from "react";
import { Upload, FileText, Type, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface UploadSectionProps {
  onAnalyze: (content: string, source: 'file' | 'text') => void;
}

export function UploadSection({ onAnalyze }: UploadSectionProps) {
  const [textContent, setTextContent] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
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

  const handleFile = async (file: File) => {
    if (!file.type.includes('text') && !file.type.includes('pdf')) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or text file.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // TODO: Replace with actual file processing
      const content = "Sample Terms & Conditions content from uploaded file...";
      onAnalyze(content, 'file');
      
      toast({
        title: "File uploaded successfully!",
        description: "Your document is being analyzed...",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error processing your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTextAnalyze = () => {
    if (!textContent.trim()) {
      toast({
        title: "No content to analyze",
        description: "Please enter some terms & conditions text.",
        variant: "destructive",
      });
      return;
    }

    onAnalyze(textContent, 'text');
    toast({
      title: "Text submitted successfully!",
      description: "Your content is being analyzed...",
    });
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
                      accept=".pdf,.txt,.doc,.docx"
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
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4" />
                    <span>English language only</span>
                  </div>
                  <Button 
                    onClick={handleTextAnalyze}
                    className="bg-gradient-primary shadow-glow hover:shadow-trust"
                    disabled={!textContent.trim()}
                  >
                    Analyze Text
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