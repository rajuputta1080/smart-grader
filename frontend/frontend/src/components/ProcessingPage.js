import React from 'react';
import './ProcessingPage.css';

const ProcessingPage = () => {
  return (
    <div className="processing-container">
      <div className="processing-content">
        <div className="processing-animation">
          <div className="spinner"></div>
        </div>
        <h2>Evaluating Answers...</h2>
        <p>Our AI is analyzing the answer sheet and generating detailed feedback.</p>
        <div className="processing-steps">
          <div className="step completed">
            <span className="step-icon">✓</span>
            <span>Files uploaded successfully</span>
          </div>
          <div className="step active">
            <span className="step-icon">⟳</span>
            <span>Processing answer sheets</span>
          </div>
          <div className="step">
            <span className="step-icon">⏳</span>
            <span>Generating evaluation</span>
          </div>
          <div className="step">
            <span className="step-icon">⏳</span>
            <span>Creating result card</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingPage;
