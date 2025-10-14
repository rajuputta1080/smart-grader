/**
 * Token Estimator - Calculates exact token usage for PDFs
 * Used to determine optimal concurrency for bulk processing
 */

const { calculateEvaluationTokens, countTokens } = require('./exactTokenCounter');

// Pre-calculate the prompt tokens (this is the same for all evaluations)
let CACHED_PROMPT_TOKENS = null;

/**
 * Get the exact prompt tokens (cached)
 */
function getPromptTokens() {
  if (!CACHED_PROMPT_TOKENS) {
    // Import the prompt builder
    const { buildCompleteEvaluationPrompt } = require('./simpleVisionEvaluation');
    const prompt = buildCompleteEvaluationPrompt();
    CACHED_PROMPT_TOKENS = countTokens(prompt);
    console.log(`📊 Exact prompt tokens calculated: ${CACHED_PROMPT_TOKENS}`);
  }
  return CACHED_PROMPT_TOKENS;
}

/**
 * Calculate exact tokens for a single evaluation
 * @param {number} questionPaperPages - Number of pages in question paper
 * @param {number} answerSheetPages - Number of pages in answer sheet
 * @returns {number} Exact total tokens
 */
function estimateTokensForEvaluation(questionPaperPages, answerSheetPages) {
  const promptTokens = getPromptTokens();
  const imageTokens = (questionPaperPages + answerSheetPages) * 500; // OpenAI standard
  const expectedResponseTokens = 3000; // Conservative estimate
  
  const totalTokens = promptTokens + imageTokens + expectedResponseTokens;
  
  return Math.ceil(totalTokens);
}

/**
 * Calculate optimal concurrency based on token limits
 * @param {number} estimatedTokensPerEvaluation - Estimated tokens for one evaluation
 * @param {number} tokenLimit - TPM limit (default 30000)
 * @returns {number} Optimal number of concurrent evaluations
 */
function calculateOptimalConcurrency(estimatedTokensPerEvaluation, tokenLimit = 500000) {
  // For bulk processing, be more aggressive with concurrency
  // Even if individual requests exceed limit, we can process multiple students
  // because they don't all hit the API at exactly the same moment
  
  // Calculate based on 50% of limit (more aggressive)
  const effectiveLimit = tokenLimit * 0.5;
  const maxConcurrent = Math.floor(effectiveLimit / estimatedTokensPerEvaluation);
  
  // Force minimum concurrency for bulk processing
  // Minimum 3: Always process at least 3 students concurrently
  // Maximum 24: Optimal balance of speed and stability
  return Math.max(3, Math.min(24, maxConcurrent));
}

/**
 * Determine if evaluation needs batching (for large PDFs)
 * @param {number} estimatedTokens - Estimated tokens for evaluation
 * @param {number} tokenLimit - TPM limit
 * @returns {boolean} Always false - we use single evaluation only
 */
function needsBatching(estimatedTokens, tokenLimit = 500000) {
  // Always use single evaluation to maintain consistency
  return false;
}

/**
 * Get processing strategy recommendation
 * @param {number} questionPaperPages 
 * @param {number} answerSheetPages 
 * @param {number} totalSheets - Number of answer sheets to process
 * @param {number} tokenLimit 
 * @returns {Object} Strategy object with concurrency and batching info
 */
function getProcessingStrategy(questionPaperPages, answerSheetPages, totalSheets, tokenLimit = 500000) {
  const tokensPerSheet = estimateTokensForEvaluation(questionPaperPages, answerSheetPages);
  const concurrency = calculateOptimalConcurrency(tokensPerSheet, tokenLimit);
  const useBatching = needsBatching(tokensPerSheet, tokenLimit);
  
  // Calculate estimated time (always single evaluation)
  const avgTimePerEvaluation = 60; // seconds per evaluation
  const totalBatches = Math.ceil(totalSheets / concurrency);
  const estimatedTimeSeconds = totalBatches * avgTimePerEvaluation;
  
  return {
    tokensPerSheet,
    concurrency,
    useBatching: false, // Always use single evaluation
    estimatedTime: {
      seconds: estimatedTimeSeconds,
      minutes: Math.ceil(estimatedTimeSeconds / 60),
      formatted: formatTime(estimatedTimeSeconds)
    },
    totalBatches,
    strategy: 'single-call-evaluation' // Always single evaluation
  };
}

/**
 * Format time in human-readable format
 * @param {number} seconds 
 * @returns {string}
 */
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds} seconds`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 
    ? `${minutes}m ${remainingSeconds}s`
    : `${minutes} minutes`;
}

module.exports = {
  estimateTokensForEvaluation,
  calculateOptimalConcurrency,
  needsBatching,
  getProcessingStrategy,
  getPromptTokens
};

