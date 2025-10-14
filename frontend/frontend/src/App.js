import React, { useState, useEffect } from 'react';
import UploadForm from './components/UploadForm';
import BulkProgressTracker from './components/BulkProgressTracker';
import ResultCard from './components/ResultCard';
import ProcessingPage from './components/ProcessingPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkJobId, setBulkJobId] = useState(null);

  useEffect(() => {
    // Check if we're on the results page
    if (window.location.pathname === '/results') {
      setCurrentPage('results');
    }
    
    // Set up global handler for bulk evaluation
    window.onBulkEvaluationStart = (result) => {
      setBulkJobId(result.jobId);
      setCurrentPage('bulk-progress');
    };
    
    return () => {
      window.onBulkEvaluationStart = null;
    };
  }, []);

  const handleUploadStart = () => {
    setIsProcessing(true);
    setCurrentPage('processing');
  };

  const handleUploadComplete = () => {
    setIsProcessing(false);
    setCurrentPage('results');
    // Update URL without page reload
    window.history.pushState({}, '', '/results');
  };

  const handleBackToUpload = () => {
    setCurrentPage('upload');
    setBulkJobId(null);
    // Clear any stored results
    localStorage.removeItem('evaluationResult');
    // Update URL
    window.history.pushState({}, '', '/');
  };

  // Simple routing based on current page state
  if (currentPage === 'processing') {
    return <ProcessingPage />;
  }

  if (currentPage === 'results') {
    return <ResultCard onBack={handleBackToUpload} />;
  }

  if (currentPage === 'bulk-progress') {
    return (
      <div className="App">
        <div className="back-btn-container">
          <button className="back-btn" onClick={handleBackToUpload}>
            ← Back to Upload
          </button>
        </div>
        <BulkProgressTracker jobId={bulkJobId} />
      </div>
    );
  }

  return (
    <div className="App">
      <UploadForm 
        onUploadStart={handleUploadStart}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
}

export default App;
