import React, { useState } from 'react';
import { evaluateSheet } from '../api';
import ResultCard from './ResultCard';

function UploadForm() {
  const [answerSheet, setAnswerSheet] = useState([]);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    answerSheet.forEach(file => formData.append('answerSheet', file));
    if (questionPaper) formData.append('questionPaper', questionPaper);

    const res = await evaluateSheet(formData);
    setResult(res);
  };

  return (
    <div>
      <h2>Smart Grader MVP</h2>
      <form onSubmit={handleSubmit}>
        <label>Answer Sheet (PDF / Images)</label>
        <input type="file" multiple onChange={e => setAnswerSheet([...e.target.files])} />

        <label>Question Paper (PDF / Image)</label>
        <input type="file" onChange={e => setQuestionPaper(e.target.files[0])} />

        <button type="submit">Evaluate</button>
      </form>

      {result && <ResultCard result={result} />}
    </div>
  );
}

export default UploadForm;
