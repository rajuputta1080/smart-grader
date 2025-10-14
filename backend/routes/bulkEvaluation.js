/**
 * Bulk Evaluation Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const bulkEvaluationController = require('../controllers/bulkEvaluationController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 100 // Max 100 files (1 question + 99 answers)
  }
});

// Start bulk evaluation
router.post(
  '/',
  upload.fields([
    { name: 'questionPaper', maxCount: 1 },
    { name: 'answerSheets', maxCount: 99 }
  ]),
  bulkEvaluationController.startBulkEvaluation
);

// Get job status
router.get('/:jobId', bulkEvaluationController.getJobStatus);

// Get all results summary
router.get('/:jobId/results', bulkEvaluationController.getAllResults);

// Get individual sheet result
router.get('/:jobId/result/:sheetId', bulkEvaluationController.getSheetResult);

// Retry a failed sheet
router.post('/:jobId/retry/:sheetId', bulkEvaluationController.retryFailedSheet);

module.exports = router;

