/**
 * Concurrent Processor - Manages concurrent evaluation of multiple answer sheets
 */

const { processFilesForVision } = require('./visionFileParser');
const { evaluateWithVision } = require('./simpleVisionEvaluation');
const jobManager = require('./bulkJobManager');

/**
 * Process a batch of sheets concurrently
 * @param {string} jobId 
 * @param {Object} questionPaperImages - Already processed question paper images
 * @param {Array} sheets - Array of sheet objects to process
 * @returns {Promise<Array>} Results of evaluations
 */
async function processBatch(jobId, questionPaperImages, sheets) {
  console.log(`\n🔄 Processing batch of ${sheets.length} sheets...`);
  
  // Create an array of promises for concurrent processing
  const evaluationPromises = sheets.map(sheet => 
    evaluateSheet(jobId, questionPaperImages, sheet)
  );
  
  // Wait for all evaluations in this batch to complete
  // Using allSettled to handle failures gracefully
  const results = await Promise.allSettled(evaluationPromises);
  
  return results;
}

/**
 * Evaluate a single answer sheet
 * @param {string} jobId 
 * @param {Object} questionPaperImages 
 * @param {Object} sheet 
 * @returns {Promise<Object>}
 */
async function evaluateSheet(jobId, questionPaperImages, sheet) {
  try {
    console.log(`\n📝 Starting evaluation: ${sheet.filename}`);
    
    // Update status to processing
    jobManager.updateSheetStatus(jobId, sheet.id, 'processing');
    
    const startTime = Date.now();
    
    // Convert answer sheet PDF to images
    console.log(`   🖼️  Converting PDF to images...`);
    const answerSheetFiles = await processFilesForVision([{
      path: sheet.filepath,
      originalname: sheet.filename
    }]);
    
    const answerSheetImages = answerSheetFiles.flatMap(file => file.images);
    
    console.log(`   ✅ Converted ${answerSheetImages.length} pages`);
    
    // Always use single evaluation (your original function that works correctly)
    console.log(`   🎯 Using single evaluation (same as individual processing)...`);
    const result = await evaluateWithVision(questionPaperImages, answerSheetImages);
    
    const endTime = Date.now();
    const evaluationTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`   ✅ Evaluation complete in ${evaluationTime}s`);
    console.log(`   📊 Score: ${result.evaluation.totalScore}/${result.evaluation.maxScore} (${result.evaluation.grade})`);
    
    // Save result
    jobManager.saveSheetResult(jobId, sheet.id, result);
    
    return {
      sheetId: sheet.id,
      filename: sheet.filename,
      success: true,
      result: result
    };
    
  } catch (error) {
    console.error(`   ❌ Evaluation failed: ${error.message}`);
    
    // Save error
    jobManager.saveSheetError(jobId, sheet.id, error);
    
    return {
      sheetId: sheet.id,
      filename: sheet.filename,
      success: false,
      error: error.message
    };
  }
}

/**
 * Process all answer sheets in a job with optimal concurrency
 * @param {string} jobId 
 * @returns {Promise<Object>} Summary of results
 */
async function processJob(jobId) {
  const job = jobManager.getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  console.log(`\n🚀 Starting bulk evaluation job: ${jobId}`);
  console.log(`   Total sheets: ${job.progress.total}`);
  console.log(`   Concurrency: ${job.strategy.concurrency}`);
  console.log(`   Strategy: ${job.strategy.strategy}`);
  console.log(`   Estimated time: ${job.strategy.estimatedTime.formatted}`);
  
  const overallStartTime = Date.now();
  
  // Update job status
  jobManager.updateJobStatus(jobId, 'processing');
  
  try {
    // Convert question paper to images once (reuse for all answer sheets)
    console.log(`\n📄 Converting question paper to images...`);
    const questionPaperFiles = await processFilesForVision([{
      path: job.questionPaper.filepath,
      originalname: job.questionPaper.filename
    }]);
    
    const questionPaperImages = questionPaperFiles.flatMap(file => file.images);
    console.log(`   ✅ Question paper: ${questionPaperImages.length} pages converted`);
    
    // Get all queued sheets
    const queuedSheets = jobManager.getQueuedSheets(jobId);
    const concurrency = job.strategy.concurrency;
    
    console.log(`\n📦 Processing ${queuedSheets.length} sheets in batches of ${concurrency}...`);
    console.log(`   Using single evaluation (same as individual processing)`);
    
    // Process sheets in concurrent batches
    let totalProcessed = 0;
    for (let i = 0; i < queuedSheets.length; i += concurrency) {
      const batch = queuedSheets.slice(i, i + concurrency);
      const batchNum = Math.floor(i / concurrency) + 1;
      const totalBatches = Math.ceil(queuedSheets.length / concurrency);
      
      console.log(`\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} sheets)...`);
      
      // Process this batch concurrently
      await processBatch(jobId, questionPaperImages, batch);
      
      totalProcessed += batch.length;
      console.log(`\n✅ Batch ${batchNum} complete. Progress: ${totalProcessed}/${queuedSheets.length}`);
      
      // Small delay between batches to avoid rate limit issues
      if (i + concurrency < queuedSheets.length) {
        console.log(`   ⏸️  Waiting 2 seconds before next batch...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    const overallEndTime = Date.now();
    const totalTime = ((overallEndTime - overallStartTime) / 1000).toFixed(2);
    
    // Update job status
    jobManager.updateJobStatus(jobId, 'completed');
    
    // Get final job state
    const finalJob = jobManager.getJob(jobId);
    
    console.log(`\n🎉 Bulk evaluation complete!`);
    console.log(`   Total time: ${totalTime} seconds`);
    console.log(`   Completed: ${finalJob.progress.completed}/${finalJob.progress.total}`);
    console.log(`   Failed: ${finalJob.progress.failed}`);
    
    return {
      jobId: jobId,
      status: 'completed',
      totalTime: totalTime,
      progress: finalJob.progress
    };
    
  } catch (error) {
    console.error(`\n❌ Job failed: ${error.message}`);
    jobManager.updateJobStatus(jobId, 'failed');
    throw error;
  }
}

/**
 * Start processing a job asynchronously (don't wait for completion)
 * @param {string} jobId 
 */
function startJobAsync(jobId) {
  // Process job in background without blocking
  processJob(jobId)
    .then(result => {
      console.log(`\n✅ Job ${jobId} completed successfully`);
    })
    .catch(error => {
      console.error(`\n❌ Job ${jobId} failed:`, error.message);
    });
}

module.exports = {
  processJob,
  startJobAsync,
  processBatch,
  evaluateSheet
};

