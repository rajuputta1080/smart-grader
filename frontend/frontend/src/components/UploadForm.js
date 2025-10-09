import React, { useState } from 'react';
import './UploadForm.css';

const UploadForm = ({ onUploadStart, onUploadComplete }) => {
  const [questionPaper, setQuestionPaper] = useState(null);
  const [answerSheet, setAnswerSheet] = useState([]);
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
        setAnswerSheet(Array.from(e.dataTransfer.files));
      }
    }
  };

  const handleFileInput = (e, type) => {
    if (type === 'question') {
      setQuestionPaper(e.target.files[0]);
    } else {
      setAnswerSheet(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!questionPaper || answerSheet.length === 0) {
      alert('Please upload both question paper and answer sheet files');
      return;
    }

    setIsUploading(true);
    onUploadStart();

    const formData = new FormData();
    formData.append('questionPaper', questionPaper);
    answerSheet.forEach((file, index) => {
      formData.append('answerSheet', file);
    });

    try {
      const response = await fetch('https://api.smartgrader.in/api/evaluate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const result = await response.json();
      // Store result in localStorage for now, in a real app this would be in state management
      localStorage.setItem('evaluationResult', JSON.stringify(result));
      
      // Simulate processing time for better UX
      setTimeout(() => {
        onUploadComplete();
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
      setIsUploading(false);
      onUploadComplete();
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-header">
        <h1>Smart Grader</h1>
        <p>AI-powered evaluation of student answer sheets</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="upload-section">
          <h3>Question Paper</h3>
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
                accept=".pdf,.jpg,.jpeg,.png"
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

        <div className="upload-section">
          <h3>Answer Sheet</h3>
          <div
            className={`upload-area ${dragActive.answer ? 'drag-active' : ''}`}
            onDragEnter={(e) => handleDrag(e, 'answer')}
            onDragLeave={(e) => handleDrag(e, 'answer')}
            onDragOver={(e) => handleDrag(e, 'answer')}
            onDrop={(e) => handleDrop(e, 'answer')}
          >
            <div className="upload-content">
              <div className="upload-icon">📝</div>
              <p>Drag & drop answer sheet files here</p>
              <p className="upload-subtext">or click to browse (multiple files allowed)</p>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => handleFileInput(e, 'answer')}
                className="file-input"
              />
            </div>
          </div>
          {answerSheet.length > 0 && (
            <div className="files-preview">
              {answerSheet.map((file, index) => (
                <div key={index} className="file-preview">
                  <span>📝 {file.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setAnswerSheet(prev => prev.filter((_, i) => i !== index))}
                    className="remove-file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={!questionPaper || answerSheet.length === 0 || isUploading}
        >
          {isUploading ? 'Evaluating...' : 'Start Evaluation'}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
