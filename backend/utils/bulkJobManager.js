/**
 * Bulk Job Manager - Manages bulk evaluation jobs and results
 */

const fs = require('fs');
const path = require('path');

// In-memory job storage (in production, use Redis or database)
const jobs = new Map();

// Results directory
const RESULTS_DIR = path.join(__dirname, '../results/bulk_jobs');

/**
 * Initialize results directory
 */
function initializeResultsDirectory() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

/**
 * Generate unique job ID
 */
function generateJobId() {
  return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique sheet ID
 */
function generateSheetId(index) {
  return `sheet_${index}_${Date.now()}`;
}

/**
 * Create a new bulk evaluation job
 * @param {Object} questionPaper - Question paper file info
 * @param {Array} answerSheets - Array of answer sheet files
 * @param {Object} strategy - Processing strategy from tokenEstimator
 * @returns {string} Job ID
 */
function createJob(questionPaper, answerSheets, strategy) {
  const jobId = generateJobId();
  
  const job = {
    id: jobId,
    status: 'pending', // pending, processing, completed, failed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questionPaper: {
      filename: questionPaper.originalname,
      filepath: questionPaper.path,
      pages: questionPaper.pages || 0
    },
    strategy: strategy,
    progress: {
      total: answerSheets.length,
      completed: 0,
      processing: 0,
      queued: answerSheets.length,
      failed: 0,
      percentage: 0
    },
    sheets: answerSheets.map((sheet, index) => ({
      id: generateSheetId(index),
      index: index,
      filename: sheet.originalname,
      filepath: sheet.path,
      pages: sheet.pages || 0,
      status: 'queued', // queued, processing, complete, failed
      result: null,
      resultPath: null,
      error: null,
      startedAt: null,
      completedAt: null,
      tokensUsed: 0
    }))
  };
  
  jobs.set(jobId, job);
  
  // Create job directory
  const jobDir = path.join(RESULTS_DIR, jobId);
  if (!fs.existsSync(jobDir)) {
    fs.mkdirSync(jobDir, { recursive: true });
  }
  
  // Save job metadata
  saveJobMetadata(jobId);
  
  console.log(`📋 Created bulk job: ${jobId}`);
  console.log(`   Total sheets: ${answerSheets.length}`);
  console.log(`   Strategy: ${strategy.strategy}`);
  console.log(`   Concurrency: ${strategy.concurrency}`);
  console.log(`   Estimated time: ${strategy.estimatedTime.formatted}`);
  
  return jobId;
}

/**
 * Get job by ID
 * @param {string} jobId 
 * @returns {Object|null}
 */
function getJob(jobId) {
  return jobs.get(jobId) || null;
}

/**
 * Update job status
 * @param {string} jobId 
 * @param {string} status 
 */
function updateJobStatus(jobId, status) {
  const job = jobs.get(jobId);
  if (job) {
    job.status = status;
    job.updatedAt = new Date().toISOString();
    saveJobMetadata(jobId);
  }
}

/**
 * Update sheet status
 * @param {string} jobId 
 * @param {string} sheetId 
 * @param {string} status 
 */
function updateSheetStatus(jobId, sheetId, status) {
  const job = jobs.get(jobId);
  if (!job) return;
  
  const sheet = job.sheets.find(s => s.id === sheetId);
  if (!sheet) return;
  
  const oldStatus = sheet.status;
  sheet.status = status;
  
  // Update timestamps
  if (status === 'processing') {
    sheet.startedAt = new Date().toISOString();
  } else if (status === 'complete' || status === 'failed') {
    sheet.completedAt = new Date().toISOString();
  }
  
  // Update progress counters
  updateProgress(job, oldStatus, status);
  
  job.updatedAt = new Date().toISOString();
  saveJobMetadata(jobId);
  
  console.log(`   📄 Sheet ${sheet.filename}: ${oldStatus} → ${status}`);
}

/**
 * Update progress counters
 * @param {Object} job 
 * @param {string} oldStatus 
 * @param {string} newStatus 
 */
function updateProgress(job, oldStatus, newStatus) {
  // Decrement old status counter
  if (oldStatus === 'queued') job.progress.queued--;
  else if (oldStatus === 'processing') job.progress.processing--;
  
  // Increment new status counter
  if (newStatus === 'queued') job.progress.queued++;
  else if (newStatus === 'processing') job.progress.processing++;
  else if (newStatus === 'complete') job.progress.completed++;
  else if (newStatus === 'failed') job.progress.failed++;
  
  // Calculate percentage
  const finished = job.progress.completed + job.progress.failed;
  job.progress.percentage = Math.round((finished / job.progress.total) * 100);
}

/**
 * Save sheet result
 * @param {string} jobId 
 * @param {string} sheetId 
 * @param {Object} result - Evaluation result
 */
function saveSheetResult(jobId, sheetId, result) {
  const job = jobs.get(jobId);
  if (!job) return;
  
  const sheet = job.sheets.find(s => s.id === sheetId);
  if (!sheet) return;
  
  // Save result to file
  const jobDir = path.join(RESULTS_DIR, jobId);
  const resultPath = path.join(jobDir, `${sheetId}_result.json`);
  
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  
  sheet.result = {
    studentName: result.student?.name || 'Unknown',
    score: result.evaluation?.totalScore || 0,
    maxScore: result.evaluation?.maxScore || 0,
    percentage: result.evaluation?.percentage || 0,
    grade: result.evaluation?.grade || 'N/A',
    questionsEvaluated: result.questions?.length || 0
  };
  sheet.resultPath = resultPath;
  sheet.tokensUsed = result.tokensUsed || 0;
  
  updateSheetStatus(jobId, sheetId, 'complete');
  
  console.log(`   ✅ Result saved: ${sheet.filename} - ${sheet.result.score}/${sheet.result.maxScore} (${sheet.result.grade})`);
}

/**
 * Save sheet error
 * @param {string} jobId 
 * @param {string} sheetId 
 * @param {Error} error 
 */
function saveSheetError(jobId, sheetId, error) {
  const job = jobs.get(jobId);
  if (!job) return;
  
  const sheet = job.sheets.find(s => s.id === sheetId);
  if (!sheet) return;
  
  sheet.error = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
  
  updateSheetStatus(jobId, sheetId, 'failed');
  
  console.log(`   ❌ Error: ${sheet.filename} - ${error.message}`);
}

/**
 * Get sheet result by ID
 * @param {string} jobId 
 * @param {string} sheetId 
 * @returns {Object|null}
 */
function getSheetResult(jobId, sheetId) {
  const job = jobs.get(jobId);
  if (!job) return null;
  
  const sheet = job.sheets.find(s => s.id === sheetId);
  if (!sheet || !sheet.resultPath) return null;
  
  try {
    const resultData = fs.readFileSync(sheet.resultPath, 'utf-8');
    return JSON.parse(resultData);
  } catch (error) {
    console.error(`Error reading result file: ${error.message}`);
    return null;
  }
}

/**
 * Save job metadata to disk
 * @param {string} jobId 
 */
function saveJobMetadata(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;
  
  const jobDir = path.join(RESULTS_DIR, jobId);
  const metadataPath = path.join(jobDir, 'job_metadata.json');
  
  // Create a clean version without file paths for security
  const metadata = {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    questionPaper: {
      filename: job.questionPaper.filename,
      pages: job.questionPaper.pages
    },
    strategy: job.strategy,
    progress: job.progress,
    sheets: job.sheets.map(s => ({
      id: s.id,
      index: s.index,
      filename: s.filename,
      pages: s.pages,
      status: s.status,
      result: s.result,
      error: s.error,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      tokensUsed: s.tokensUsed
    }))
  };
  
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

/**
 * Get all sheets ready for processing (queued status)
 * @param {string} jobId 
 * @returns {Array}
 */
function getQueuedSheets(jobId) {
  const job = jobs.get(jobId);
  if (!job) return [];
  
  return job.sheets.filter(s => s.status === 'queued');
}

/**
 * Check if job is complete
 * @param {string} jobId 
 * @returns {boolean}
 */
function isJobComplete(jobId) {
  const job = jobs.get(jobId);
  if (!job) return false;
  
  const finished = job.progress.completed + job.progress.failed;
  return finished === job.progress.total;
}

// Initialize on module load
initializeResultsDirectory();

module.exports = {
  createJob,
  getJob,
  updateJobStatus,
  updateSheetStatus,
  saveSheetResult,
  saveSheetError,
  getSheetResult,
  getQueuedSheets,
  isJobComplete
};

