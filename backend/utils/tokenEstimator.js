/**
 * Token Estimator - Estimates token usage for PDFs
 * Used to determine optimal concurrency for bulk processing
 */

const TOKENS_PER_IMAGE = 800; // Approximate tokens per page image
const PROMPT_BASE_TOKENS = 2000; // Base prompt overhead
const RESPONSE_TOKENS = 4000; // Expected response tokens

/**
 * Estimate tokens for a single evaluation
 * @param {number} questionPaperPages - Number of pages in question paper
 * @param {number} answerSheetPages - Number of pages in answer sheet
 * @returns {number} Estimated total tokens
 */
function estimateTokensForEvaluation(questionPaperPages, answerSheetPages) {
  const imageTokens = (questionPaperPages + answerSheetPages) * TOKENS_PER_IMAGE;
  const totalTokens = PROMPT_BASE_TOKENS + imageTokens + RESPONSE_TOKENS;
  
  return Math.ceil(totalTokens);
}

/**
 * Calculate optimal concurrency based on token limits
 * @param {number} estimatedTokensPerEvaluation - Estimated tokens for one evaluation
 * @param {number} tokenLimit - TPM limit (default 30000)
 * @returns {number} Optimal number of concurrent evaluations
 */
function calculateOptimalConcurrency(estimatedTokensPerEvaluation, tokenLimit = 30000) {
  const SAFETY_BUFFER = 0.75; // Use only 75% of limit to be safe
  const effectiveLimit = tokenLimit * SAFETY_BUFFER;
  
  // Calculate max concurrent requests
  const maxConcurrent = Math.floor(effectiveLimit / estimatedTokensPerEvaluation);
  
  // Clamp between 1 and 6
  // Minimum 1: Always process at least one
  // Maximum 6: Don't overwhelm the API even with small PDFs
  return Math.max(1, Math.min(6, maxConcurrent));
}

/**
 * Determine if evaluation needs batching (for large PDFs)
 * @param {number} estimatedTokens - Estimated tokens for evaluation
 * @param {number} tokenLimit - TPM limit
 * @returns {boolean} Always false - we use single evaluation only
 */
function needsBatching(estimatedTokens, tokenLimit = 30000) {
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
function getProcessingStrategy(questionPaperPages, answerSheetPages, totalSheets, tokenLimit = 30000) {
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
  getProcessingStrategy
};

