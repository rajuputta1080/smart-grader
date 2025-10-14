/**
 * Bulk Evaluation Controller - Handles bulk evaluation requests
 */

const jobManager = require('../utils/bulkJobManager');
const { getProcessingStrategy } = require('../utils/tokenEstimator');
const { startJobAsync } = require('../utils/concurrentProcessor');

/**
 * Start bulk evaluation
 * POST /api/evaluate-bulk
 * 
 * Expects:
 * - questionPaper: single file
 * - answerSheets[]: array of files
 */
exports.startBulkEvaluation = async (req, res) => {
  try {
    const questionFiles = req.files?.['questionPaper'] || [];
    const answerFiles = req.files?.['answerSheets'] || [];
    
    // Validation
    if (questionFiles.length === 0) {
      return res.status(400).json({ 
        error: 'Question paper is required' 
      });
    }
    
    if (questionFiles.length > 1) {
      return res.status(400).json({ 
        error: 'Only one question paper allowed' 
      });
    }
    
    if (answerFiles.length === 0) {
      return res.status(400).json({ 
        error: 'At least one answer sheet is required' 
      });
    }
    
    const questionPaper = questionFiles[0];
    
    console.log('\n📦 Bulk Evaluation Request Received');
    console.log(`   Question Paper: ${questionPaper.originalname}`);
    console.log(`   Answer Sheets: ${answerFiles.length} files`);
    
    // For now, estimate pages (you can enhance this with actual PDF page detection)
    // Assuming average pages for estimation (more realistic values)
    const avgQuestionPages = 1;  // Typical question paper
    const avgAnswerPages = 7;    // Typical answer sheet
    
    // Calculate processing strategy
    const strategy = getProcessingStrategy(
      avgQuestionPages,
      avgAnswerPages,
      answerFiles.length
    );
    
    console.log(`\n📊 Processing Strategy:`);
    console.log(`   Tokens per sheet: ${strategy.tokensPerSheet}`);
    console.log(`   Concurrency: ${strategy.concurrency}`);
    console.log(`   Use batching: ${strategy.useBatching}`);
    console.log(`   Estimated time: ${strategy.estimatedTime.formatted}`);
    
    // Create job
    const jobId = jobManager.createJob(questionPaper, answerFiles, strategy);
    
    // Start processing asynchronously (don't wait for completion)
    startJobAsync(jobId);
    
    // Return immediately with job ID
    res.json({
      success: true,
      jobId: jobId,
      totalSheets: answerFiles.length,
      status: 'processing',
      estimatedTime: strategy.estimatedTime,
      message: `Bulk evaluation started. Processing ${answerFiles.length} answer sheets.`
    });
    
  } catch (error) {
    console.error('Bulk evaluation error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error during bulk evaluation' 
    });
  }
};

/**
 * Get job status
 * GET /api/evaluate-bulk/:jobId
 */
exports.getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = jobManager.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found' 
      });
    }
    
    // Return job status with sheet details
    res.json({
      jobId: job.id,
      status: job.status,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      progress: job.progress,
      strategy: {
        concurrency: job.strategy.concurrency,
        useBatching: job.strategy.useBatching,
        estimatedTime: job.strategy.estimatedTime
      },
      sheets: job.sheets.map(sheet => ({
        id: sheet.id,
        filename: sheet.filename,
        status: sheet.status,
        result: sheet.result, // Summary only
        error: sheet.error,
        startedAt: sheet.startedAt,
        completedAt: sheet.completedAt
      }))
    });
    
  } catch (error) {
    console.error('Get job status error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
};

/**
 * Get individual sheet result
 * GET /api/evaluate-bulk/:jobId/result/:sheetId
 */
exports.getSheetResult = async (req, res) => {
  try {
    const { jobId, sheetId } = req.params;
    
    const result = jobManager.getSheetResult(jobId, sheetId);
    
    if (!result) {
      return res.status(404).json({ 
        error: 'Result not found or not yet available' 
      });
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Get sheet result error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
};

/**
 * Get all results for a job (summary)
 * GET /api/evaluate-bulk/:jobId/results
 */
exports.getAllResults = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const job = jobManager.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ 
        error: 'Job not found' 
      });
    }
    
    // Get all completed sheet results
    const results = job.sheets
      .filter(sheet => sheet.status === 'complete' && sheet.result)
      .map(sheet => ({
        sheetId: sheet.id,
        filename: sheet.filename,
        studentName: sheet.result.studentName,
        score: sheet.result.score,
        maxScore: sheet.result.maxScore,
        percentage: sheet.result.percentage,
        grade: sheet.result.grade,
        questionsEvaluated: sheet.result.questionsEvaluated,
        completedAt: sheet.completedAt
      }));
    
    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      results: results,
      summary: {
        totalStudents: results.length,
        averageScore: results.length > 0 
          ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(2)
          : 0,
        highestScore: results.length > 0 
          ? Math.max(...results.map(r => r.percentage))
          : 0,
        lowestScore: results.length > 0 
          ? Math.min(...results.map(r => r.percentage))
          : 0,
        gradeDistribution: calculateGradeDistribution(results)
      }
    });
    
  } catch (error) {
    console.error('Get all results error:', error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
};

/**
 * Calculate grade distribution
 * @param {Array} results 
 * @returns {Object}
 */
function calculateGradeDistribution(results) {
  const distribution = {
    'A+': 0,
    'A': 0,
    'B+': 0,
    'B': 0,
    'C': 0,
    'D': 0,
    'F': 0
  };
  
  results.forEach(result => {
    if (distribution.hasOwnProperty(result.grade)) {
      distribution[result.grade]++;
    }
  });
  
  return distribution;
}

/**
 * Retry a failed evaluation for a specific sheet
 */
exports.retryFailedSheet = async (req, res) => {
  const { jobId, sheetId } = req.params;
  
  try {
    const job = jobManager.getJob(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    const sheet = job.sheets.find(s => s.id === sheetId);
    if (!sheet) {
      return res.status(404).json({ error: 'Sheet not found' });
    }
    
    if (sheet.status !== 'failed') {
      return res.status(400).json({ error: 'Sheet is not in failed status' });
    }
    
    // Reset sheet status to queued for retry
    sheet.status = 'queued';
    sheet.error = null;
    sheet.resultPath = null;
    
    // Save updated job state
    jobManager.saveJobState(job);
    
    // Import and start the processor
    const { processBulkJob } = require('../utils/concurrentProcessor');
    
    // Start processing this specific sheet (the processor will handle retries)
    processBulkJob(jobId)
      .catch(error => console.error(`Error retrying sheet ${sheetId} in job ${jobId}:`, error));
    
    res.json({
      message: 'Retry initiated successfully',
      jobId: jobId,
      sheetId: sheetId,
      status: 'queued'
    });
    
  } catch (error) {
    console.error('Error retrying failed sheet:', error);
    res.status(500).json({ error: error.message || 'Failed to retry sheet' });
  }
};

// Note: Functions are already exported using exports.functionName syntax above
// No need for module.exports at the end

