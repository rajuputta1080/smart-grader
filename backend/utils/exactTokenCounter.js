/**
 * Exact Token Counter - Uses tiktoken to calculate precise token counts
 */

const { encoding_for_model } = require('tiktoken');

// Cache the encoder to avoid recreating it each time
let encoder = null;

/**
 * Get or create the encoder for GPT-5
 */
function getEncoder() {
  if (!encoder) {
    try {
      // GPT-5 uses the same encoding as GPT-4
      encoder = encoding_for_model('gpt-4o');
    } catch (error) {
      console.error('Error creating encoder:', error);
      throw error;
    }
  }
  return encoder;
}

/**
 * Calculate exact tokens for a text string
 * @param {string} text - The text to tokenize
 * @returns {number} Exact token count
 */
function countTokens(text) {
  try {
    const enc = getEncoder();
    const tokens = enc.encode(text);
    return tokens.length;
  } catch (error) {
    console.error('Error counting tokens:', error);
    // Fallback to rough estimation
    return Math.ceil(text.length / 4);
  }
}

/**
 * Calculate tokens for images
 * Images are processed differently - each image has a fixed token cost
 * @param {number} numImages - Number of images
 * @param {string} imageQuality - 'low', 'high', or 'auto'
 * @returns {number} Token count for images
 */
function countImageTokens(numImages, imageQuality = 'auto') {
  // Based on OpenAI's vision API pricing
  // Low quality: 85 tokens per image
  // High quality: 170 tokens per tile (512x512), with minimum of 255 tokens
  
  if (imageQuality === 'low') {
    return numImages * 85;
  } else {
    // High quality or auto - assume average of 500 tokens per image
    // This accounts for the base 85 + tiles
    return numImages * 500;
  }
}

/**
 * Calculate total tokens for an evaluation request
 * @param {string} promptText - The prompt text
 * @param {number} questionPaperImages - Number of QP images
 * @param {number} answerSheetImages - Number of AS images
 * @param {number} expectedResponseTokens - Expected response size (default 3000)
 * @returns {Object} Token breakdown
 */
function calculateEvaluationTokens(promptText, questionPaperImages, answerSheetImages, expectedResponseTokens = 3000) {
  const promptTokens = countTokens(promptText);
  const imageTokens = countImageTokens(questionPaperImages + answerSheetImages);
  const totalInputTokens = promptTokens + imageTokens;
  const totalTokens = totalInputTokens + expectedResponseTokens;
  
  return {
    promptTokens,
    imageTokens,
    totalInputTokens,
    expectedResponseTokens,
    totalTokens,
    breakdown: {
      prompt: promptTokens,
      images: imageTokens,
      expectedResponse: expectedResponseTokens,
      total: totalTokens
    }
  };
}

/**
 * Free the encoder (cleanup)
 */
function cleanup() {
  if (encoder) {
    encoder.free();
    encoder = null;
  }
}

module.exports = {
  countTokens,
  countImageTokens,
  calculateEvaluationTokens,
  cleanup
};

