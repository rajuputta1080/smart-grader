import React, { useState, useEffect } from 'react';
import ResultCard from './ResultCard';
import './BulkProgressTracker.css';

const BulkProgressTracker = ({ jobId }) => {
  const [jobData, setJobData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Poll job status
  useEffect(() => {
    if (!jobId) return;

    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/evaluate-bulk/${jobId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch job status');
        }
        
        const data = await response.json();
        setJobData(data);
        setLoading(false);
        
        // Stop polling if job is completed or failed
        if (data.status === 'completed' || data.status === 'failed') {
          return;
        }
      } catch (err) {
        console.error('Error fetching job status:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchJobStatus();

    // Poll every 3 seconds while job is processing
    const interval = setInterval(() => {
      if (jobData?.status !== 'completed' && jobData?.status !== 'failed') {
        fetchJobStatus();
      } else {
        clearInterval(interval);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, jobData?.status]);

  const viewResult = async (sheetId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/evaluate-bulk/${jobId}/result/${sheetId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch result');
      }
      
      const result = await response.json();
      
      // Store in localStorage so ResultCard can access it
      localStorage.setItem('evaluationResult', JSON.stringify(result));
      setSelectedResult(result);
      setShowResultModal(true);
    } catch (err) {
      console.error('Error fetching result:', err);
      alert('Failed to load result: ' + err.message);
    }
  };

  const closeResultModal = () => {
    setShowResultModal(false);
    setSelectedResult(null);
    localStorage.removeItem('evaluationResult');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'queued': return '🟡';
      case 'processing': return '⏳';
      case 'complete': return '✅';
      case 'failed': return '❌';
      default: return '⚪';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'queued': return 'Queued';
      case 'processing': return 'Processing...';
      case 'complete': return 'Complete';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="progress-tracker-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading evaluation status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-tracker-container">
        <div className="error-message">
          <p>❌ Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!jobData) return null;

  const { progress, sheets, status } = jobData;

  return (
    <div className="progress-tracker-container">
      <div className="progress-header">
        <h2>Bulk Evaluation Progress</h2>
        <div className="job-status">
          <span className={`status-badge ${status}`}>{status.toUpperCase()}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-summary">
        <div className="progress-stats">
          <div className="stat">
            <span className="stat-value">{progress.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat">
            <span className="stat-value">{progress.processing}</span>
            <span className="stat-label">Processing</span>
          </div>
          <div className="stat">
            <span className="stat-value">{progress.queued}</span>
            <span className="stat-label">Queued</span>
          </div>
          <div className="stat">
            <span className="stat-value">{progress.failed}</span>
            <span className="stat-label">Failed</span>
          </div>
        </div>
        
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress.percentage}%` }}
          >
            {progress.percentage}%
          </div>
        </div>
        
        <p className="progress-text">
          {progress.completed + progress.failed} of {progress.total} sheets processed
        </p>
      </div>

      {/* Sheets List */}
      <div className="sheets-list">
        <h3>Answer Sheets ({sheets.length})</h3>
        <div className="sheets-container">
          {sheets.map((sheet, index) => (
            <div key={sheet.id} className={`sheet-item ${sheet.status}`}>
              <div className="sheet-info">
                <span className="sheet-number">{index + 1}.</span>
                <div className="sheet-details">
                  <span className="sheet-filename">{sheet.filename}</span>
                  {sheet.result && (
                    <span className="sheet-score">
                      Score: {sheet.result.score}/{sheet.result.maxScore} ({sheet.result.grade})
                    </span>
                  )}
                </div>
              </div>
              
              <div className="sheet-status">
                <span className="status-icon">{getStatusIcon(sheet.status)}</span>
                <span className="status-text">{getStatusText(sheet.status)}</span>
                
                {sheet.status === 'complete' && (
                  <button 
                    className="view-btn"
                    onClick={() => viewResult(sheet.id)}
                  >
                    View Report
                  </button>
                )}
                
                {sheet.status === 'failed' && sheet.error && (
                  <span className="error-text" title={sheet.error.message}>
                    ⚠️ Error
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Result Modal - Uses same ResultCard component as single evaluation */}
      {showResultModal && selectedResult && (
        <div className="modal-overlay-fullscreen" onClick={closeResultModal}>
          <div className="modal-content-fullscreen" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn-top" onClick={closeResultModal}>✕ Close</button>
            <ResultCard hideBackButton={true} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkProgressTracker;

