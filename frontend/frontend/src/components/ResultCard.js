import React, { useState } from 'react';
import './ResultCard.css';

const ResultCard = () => {
  const [expandedQuestions, setExpandedQuestions] = useState({});
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    // Get result from localStorage
    const savedResult = localStorage.getItem('evaluationResult');
    if (savedResult) {
      setResult(JSON.parse(savedResult));
    }
  }, []);

  const toggleQuestion = (questionId) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  const exportToPDF = () => {
    // Simple PDF export - in a real app, you'd use a library like jsPDF
    window.print();
  };

  const downloadJSON = () => {
    const dataStr = JSON.stringify(result, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `evaluation_result_${result?.student?.name || 'student'}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const goBack = () => {
    window.location.href = '/';
  };

  if (!result) {
    return (
      <div className="result-container">
        <div className="no-result">
          <h2>No evaluation result found</h2>
          <p>Please go back and upload files for evaluation.</p>
          <button onClick={goBack} className="back-btn">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="result-container">
      <div className="result-header">
        <button onClick={goBack} className="back-btn">← Back to Upload</button>
        <div className="header-actions">
          <button onClick={downloadJSON} className="action-btn">Download JSON</button>
          <button onClick={exportToPDF} className="action-btn primary">Export PDF</button>
        </div>
      </div>

      <div className="result-card">
        <div className="card-header">
          <div className="student-info">
            <h1>{result.student.name}</h1>
            <p className="class-info">{result.student.class} • Roll: {result.student.rollNumber}</p>
          </div>
          <div className="exam-info">
            <h2>{result.exam.name}</h2>
            <p>Date: {result.exam.date} • Duration: {result.exam.duration}</p>
          </div>
        </div>

        <div className="score-summary">
          <div className="score-main">
            <div className="score-circle">
              <span className="score-number">{result.evaluation.totalScore}</span>
              <span className="score-total">/{result.evaluation.maxScore}</span>
            </div>
            <div className="score-details">
              <h3>{result.evaluation.percentage}%</h3>
              <p className="grade">Grade: {result.evaluation.grade}</p>
            </div>
          </div>
          <div className="feedback">
            <h4>Overall Feedback</h4>
            <p>{result.evaluation.overallFeedback}</p>
          </div>
        </div>

        <div className="questions-section">
          <h3>Question-wise Evaluation</h3>
          {result.questions.map((question, index) => (
            <div key={question.questionId} className="question-card">
              <div 
                className="question-header"
                onClick={() => toggleQuestion(question.questionId)}
              >
                <div className="question-title">
                  <span className="question-number">{question.questionId}</span>
                  <span className="question-text">{question.questionText}</span>
                </div>
                <div className="question-score">
                  <span className="score-awarded">{question.scoreAwarded}</span>
                  <span className="score-max">/{question.maxMarks}</span>
                  <span className="expand-icon">
                    {expandedQuestions[question.questionId] ? '▼' : '▶'}
                  </span>
                </div>
              </div>

              {expandedQuestions[question.questionId] && (
                <div className="question-details">
                  <div className="answer-section">
                    <h4>Student Answer:</h4>
                    <div className="answer-text">{question.studentAnswer}</div>
                  </div>

                  <div className="reference-section">
                    <h4>Reference Answer:</h4>
                    <div className="reference-text">{question.referenceAnswer}</div>
                  </div>

                  <div className="steps-section">
                    <h4>Step-by-step Evaluation:</h4>
                    {question.steps.map((step, stepIndex) => (
                      <div key={stepIndex} className="step-item">
                        <div className="step-header">
                          <span className="step-text">{step.stepText}</span>
                          <span className="step-score">+{step.score}</span>
                        </div>
                        <div className="step-explanation">{step.explanation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="result-footer">
          <p>Evaluation completed on {new Date(result.timestamp).toLocaleString()}</p>
          <p>Processing time: {result.evaluationTime}</p>
        </div>
      </div>
    </div>
  );
};

export default ResultCard;
