import React, { useState, useEffect } from 'react';
import UploadForm from './components/UploadForm';
import ResultCard from './components/ResultCard';
import ProcessingPage from './components/ProcessingPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Check if we're on the results page
    if (window.location.pathname === '/results') {
      setCurrentPage('results');
    }
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
