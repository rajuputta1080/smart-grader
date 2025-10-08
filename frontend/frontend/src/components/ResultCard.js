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
    // Expand all questions before printing to ensure all details are included in PDF
    const allQuestionIds = result.questions.map(q => q.questionId);
    const expandedState = {};
    allQuestionIds.forEach(id => {
      expandedState[id] = true;
    });
    
    // Temporarily expand all questions
    setExpandedQuestions(expandedState);
    
    // Add print-specific class to body for aggressive spacing reduction
    document.body.classList.add('print-mode');
    
    // Wait a moment for the UI to update, then print
    setTimeout(() => {
      window.print();
      
      // Clean up after printing
      setTimeout(() => {
        document.body.classList.remove('print-mode');
        setExpandedQuestions({});
      }, 1000);
    }, 500);
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
          <button onClick={exportToPDF} className="action-btn primary">Download Report</button>
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

                  {/* New detailed analysis section */}
                  {question.detailedAnalysis && (
                    <div className="detailed-analysis-section">
                      <h4>Detailed Analysis:</h4>
                      
                      {question.detailedAnalysis.pageReference && (
                        <div className="analysis-item">
                          <strong>Location:</strong> {question.detailedAnalysis.pageReference}
                        </div>
                      )}

                      {question.detailedAnalysis.studentWork && (
                        <div className="analysis-item">
                          <strong>Student's Work:</strong>
                          <div className="student-work">{question.detailedAnalysis.studentWork}</div>
                        </div>
                      )}

                      {question.detailedAnalysis.correctElements && question.detailedAnalysis.correctElements.length > 0 && (
                        <div className="analysis-item">
                          <strong>✅ What's Correct:</strong>
                          <ul>
                            {question.detailedAnalysis.correctElements.map((element, idx) => (
                              <li key={idx}>{element}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {question.detailedAnalysis.errors && question.detailedAnalysis.errors.length > 0 && (
                        <div className="analysis-item">
                          <strong>❌ Areas for Improvement:</strong>
                          <ul>
                            {question.detailedAnalysis.errors.map((error, idx) => (
                              <li key={idx}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {question.detailedAnalysis.mathematicalSteps && (
                        <div className="analysis-item">
                          <strong>Mathematical Steps:</strong>
                          <div className="math-steps">{question.detailedAnalysis.mathematicalSteps}</div>
                        </div>
                      )}

                      {question.detailedAnalysis.contentAnalysis && (
                        <div className="analysis-item">
                          <strong>Content Analysis:</strong>
                          <div className="content-analysis">{question.detailedAnalysis.contentAnalysis}</div>
                        </div>
                      )}

                      {question.detailedAnalysis.diagramAnalysis && (
                        <div className="analysis-item">
                          <strong>Diagram Analysis:</strong>
                          <div className="diagram-analysis">{question.detailedAnalysis.diagramAnalysis}</div>
                        </div>
                      )}

                      {question.detailedAnalysis.partialCreditReasoning && (
                        <div className="analysis-item">
                          <strong>Scoring Explanation:</strong>
                          <div className="scoring-explanation">{question.detailedAnalysis.partialCreditReasoning}</div>
                        </div>
                      )}

                      {question.detailedAnalysis.suggestions && (
                        <div className="analysis-item">
                          <strong>Suggestions:</strong>
                          <div className="suggestions">{question.detailedAnalysis.suggestions}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fallback to old steps format if detailedAnalysis not available */}
                  {!question.detailedAnalysis && question.steps && (
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
                  )}
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
