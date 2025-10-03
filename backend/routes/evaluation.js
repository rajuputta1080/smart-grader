const express = require('express');
const router = express.Router();
const multer = require('multer');
const { evaluateAnswerSheet } = require('../controllers/evaluationController');

const upload = multer({ dest: 'uploads/' });

router.post('/', upload.fields([
  { name: 'answerSheet', maxCount: 10 },
  { name: 'questionPaper', maxCount: 1 }
]), evaluateAnswerSheet);

module.exports = router;
