const { mockEvaluate } = require('../utils/mockEvaluation');

exports.evaluateAnswerSheet = async (req, res) => {
  try {
    const answerFiles = req.files?.['answerSheet'] || [];
    const questionFiles = req.files?.['questionPaper'] || [];

    // Validate that we have files
    if (answerFiles.length === 0) {
      return res.status(400).json({ 
        error: 'Answer sheet files are required' 
      });
    }

    if (questionFiles.length === 0) {
      return res.status(400).json({ 
        error: 'Question paper files are required' 
      });
    }

    // In MVP, just return mock evaluation
    const result = mockEvaluate(answerFiles, questionFiles);

    res.json(result);
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({ 
      error: 'Internal server error during evaluation' 
    });
  }
};
