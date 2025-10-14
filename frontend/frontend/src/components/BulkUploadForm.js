import React, { useState } from 'react';
import './BulkUploadForm.css';

const BulkUploadForm = ({ onEvaluationStart }) => {
  const [questionPaper, setQuestionPaper] = useState(null);
  const [answerSheets, setAnswerSheets] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState({ question: false, answer: false });

  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (type === 'question') {
        setQuestionPaper(e.dataTransfer.files[0]);
      } else {
        setAnswerSheets(Array.from(e.dataTransfer.files));
      }
    }
  };

  const handleFileInput = (e, type) => {
    if (type === 'question') {
      setQuestionPaper(e.target.files[0]);
    } else {
      setAnswerSheets(Array.from(e.target.files));
    }
  };

  const removeAnswerSheet = (index) => {
    setAnswerSheets(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!questionPaper || answerSheets.length === 0) {
      alert('Please upload question paper and at least one answer sheet');
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append('questionPaper', questionPaper);
    answerSheets.forEach((file) => {
      formData.append('answerSheets', file);
    });

    try {
      const response = await fetch('http://localhost:5000/api/evaluate-bulk', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      
      // Notify parent component
      onEvaluationStart(result);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
      setIsUploading(false);
    }
  };

  return (
    <div className="bulk-upload-container">
      <div className="bulk-upload-header">
        <h1>Smart Grader - Bulk Evaluation</h1>
        <p>Upload one question paper and multiple student answer sheets for automated evaluation</p>
      </div>

      <form onSubmit={handleSubmit} className="bulk-upload-form">
        {/* Question Paper Upload */}
        <div className="upload-section">
          <h3>Question Paper (1 file)</h3>
          <div
            className={`upload-area ${dragActive.question ? 'drag-active' : ''}`}
            onDragEnter={(e) => handleDrag(e, 'question')}
            onDragLeave={(e) => handleDrag(e, 'question')}
            onDragOver={(e) => handleDrag(e, 'question')}
            onDrop={(e) => handleDrop(e, 'question')}
          >
            <div className="upload-content">
              <div className="upload-icon">📄</div>
              <p>Drag & drop question paper here</p>
              <p className="upload-subtext">or click to browse</p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => handleFileInput(e, 'question')}
                className="file-input"
              />
            </div>
          </div>
          {questionPaper && (
            <div className="file-preview">
              <span>📄 {questionPaper.name}</span>
              <button 
                type="button" 
                onClick={() => setQuestionPaper(null)}
                className="remove-file"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* Answer Sheets Upload */}
        <div className="upload-section">
          <h3>Student Answer Sheets ({answerSheets.length} files)</h3>
          <div
            className={`upload-area ${dragActive.answer ? 'drag-active' : ''}`}
            onDragEnter={(e) => handleDrag(e, 'answer')}
            onDragLeave={(e) => handleDrag(e, 'answer')}
            onDragOver={(e) => handleDrag(e, 'answer')}
            onDrop={(e) => handleDrop(e, 'answer')}
          >
            <div className="upload-content">
              <div className="upload-icon">📚</div>
              <p>Drag & drop answer sheets here</p>
              <p className="upload-subtext">Multiple files allowed (up to 50 students)</p>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => handleFileInput(e, 'answer')}
                className="file-input"
              />
            </div>
          </div>
          {answerSheets.length > 0 && (
            <div className="files-list">
              <div className="files-list-header">
                <span>Uploaded Answer Sheets:</span>
                <span className="file-count">{answerSheets.length} files</span>
              </div>
              <div className="files-preview-container">
                {answerSheets.map((file, index) => (
                  <div key={index} className="file-preview">
                    <span className="file-number">{index + 1}.</span>
                    <span className="file-name">📝 {file.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeAnswerSheet(index)}
                      className="remove-file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={!questionPaper || answerSheets.length === 0 || isUploading}
        >
          {isUploading ? 'Starting Evaluation...' : `Start Bulk Evaluation (${answerSheets.length} sheets)`}
        </button>
      </form>
    </div>
  );
};

export default BulkUploadForm;

