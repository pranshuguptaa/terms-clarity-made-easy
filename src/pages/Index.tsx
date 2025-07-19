import { useState } from "react";
import { Header } from "@/components/Header";
import { AuthForm } from "@/components/AuthForm";
import { UploadSection } from "@/components/UploadSection";
import { AnalysisResults } from "@/components/AnalysisResults";
import { HistoryPanel } from "@/components/HistoryPanel";

type AppState = 'auth' | 'upload' | 'results';

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [analysisData, setAnalysisData] = useState<{content: string, source: 'file' | 'text'} | null>(null);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setCurrentState('upload');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentState('auth');
    setAnalysisData(null);
  };

  const handleAnalyze = (content: string, source: 'file' | 'text') => {
    setAnalysisData({ content, source });
    setCurrentState('results');
  };

  const handleBackToUpload = () => {
    setCurrentState('upload');
    setAnalysisData(null);
  };

  const handleViewAnalysis = (item: any) => {
    // TODO: Load actual analysis data
    setAnalysisData({ 
      content: "Sample terms and conditions content...", 
      source: 'file' 
    });
    setCurrentState('results');
    setShowHistory(false);
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
          <AnalysisResults 
            originalContent={analysisData.content}
            onBack={handleBackToUpload}
          />
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
