import React from 'react';

function ResultCard({ result }) {
  return (
    <div>
      <h3>{result.student} - {result.exam}</h3>
      <p>Total Score: {result.totalScore} / {result.maxScore}</p>
      <hr />
      {result.questions.map(q => (
        <div key={q.qid}>
          <h4>Q{q.qid}: {q.question}</h4>
          <p><b>Student Answer:</b> {q.studentAnswer}</p>
          <p><b>Marks:</b> {q.awardedMarks} / {q.maxMarks}</p>
          <p><b>Explanation:</b> {q.explanation}</p>
          <hr />
        </div>
      ))}
    </div>
  );
}

export default ResultCard;
