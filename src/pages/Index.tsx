import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { AuthForm } from "@/components/AuthForm";
import { UploadSection } from "@/components/UploadSection";
import { AnalysisResults } from "@/components/AnalysisResults";
import { HistoryPanel } from "@/components/HistoryPanel";
import { supabase } from "@/integrations/supabase/client";

type AppState = 'auth' | 'upload' | 'results';

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [analysisData, setAnalysisData] = useState<any>(null); // now stores analysis result object
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Check for session on mount and listen for auth changes
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setCurrentState(session ? 'upload' : 'auth');
    };
    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setCurrentState(session ? 'upload' : 'auth');
      if (!session) {
        setAnalysisData(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setCurrentState('upload');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentState('auth');
    setAnalysisData(null);
  };

  const handleAnalyze = (analysisResult: any, source: 'file' | 'text', docId?: string) => {
    setAnalysisData({ ...analysisResult, source, docId });
    setCurrentState('results');
  };

  const handleBackToUpload = () => {
    setCurrentState('upload');
    setAnalysisData(null);
  };

  const handleViewAnalysis = async (docId: string) => {
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, simplified_text, explanations, risks')
        .eq('id', docId)
        .single();
      if (error || !data) throw error || new Error('Document not found');
      setAnalysisData({
        summary: data.simplified_text,
        explanations: data.explanations || {},
        highlights: data.risks || [],
        doc_id: data.id,
        source: undefined,
      });
      setCurrentState('results');
    } catch (err: any) {
      setAnalysisError(err.message || 'Failed to load analysis');
    } finally {
      setLoadingAnalysis(false);
    }
  };

  if (!isAuthenticated) {
    return <AuthForm onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onShowHistory={() => setShowHistory(true)}
      />
      
      <main className="flex-1">
        {currentState === 'upload' && (
          <div className="py-8">
            <UploadSection onAnalyze={handleAnalyze} />
          </div>
        )}
        
        {currentState === 'results' && analysisData && (
          <>
            {loadingAnalysis ? (
              <div className="text-center py-8 text-muted-foreground">Loading analysis...</div>
            ) : analysisError ? (
              <div className="text-center py-8 text-destructive">{analysisError}</div>
            ) : (
              <AnalysisResults 
                analysisResult={analysisData}
                onBack={handleBackToUpload}
              />
            )}
          </>
        )}
      </main>

      <HistoryPanel
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onViewAnalysis={handleViewAnalysis}
      />
    </div>
  );
};

export default Index;
