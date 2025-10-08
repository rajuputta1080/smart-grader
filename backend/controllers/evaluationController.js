const { processFilesForVision, cleanupFiles } = require('../utils/visionFileParser');
const { evaluateWithVision } = require('../utils/simpleVisionEvaluation');

exports.evaluateAnswerSheet = async (req, res) => {
  let allFiles = [];
  
  try {
    const answerFiles = req.files?.['answerSheet'] || [];
    const questionFiles = req.files?.['questionPaper'] || [];
    allFiles = [...answerFiles, ...questionFiles];

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

    console.log('Processing uploaded files...');
    console.log(`Answer sheets: ${answerFiles.length}, Question papers: ${questionFiles.length}`);

    // Convert PDFs to images for Vision API
    console.log('\n📄 Processing Question Papers...');
    const parsedQuestionPapers = await processFilesForVision(questionFiles);
    
    console.log('\n📝 Processing Answer Sheets...');
    const parsedAnswerSheets = await processFilesForVision(answerFiles);

    // Combine all answer sheet images (in case of multiple pages)
    const answerSheetImages = parsedAnswerSheets
      .flatMap(file => file.images);

    // Combine all question paper images
    const questionPaperImages = parsedQuestionPapers
      .flatMap(file => file.images);

    console.log('\n📊 Vision Processing Summary:');
    console.log(`  Question Paper: ${questionPaperImages.length} pages (method: vision-api)`);
    console.log(`  Answer Sheet: ${answerSheetImages.length} pages (method: vision-api)`);
    
    // Save debug info
    const fs = require('fs');
    const debugDir = './debug_extractions';
    if (!fs.existsSync(debugDir)) {
      fs.mkdirSync(debugDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const debugFile = `${debugDir}/vision_debug_${timestamp}.txt`;
    
    const debugInfo = {
      timestamp: new Date().toISOString(),
      questionPaperPages: questionPaperImages.length,
      answerSheetPages: answerSheetImages.length,
      method: 'vision-api',
      totalImages: questionPaperImages.length + answerSheetImages.length
    };
    
    fs.writeFileSync(debugFile, JSON.stringify(debugInfo, null, 2));
    
    console.log(`\n💾 Debug: Vision processing info saved to: ${debugFile}`);
    
    if (answerSheetImages.length === 0) {
      console.error('❌ ERROR: No images could be extracted from answer sheet!');
      throw new Error('Failed to convert answer sheet to images');
    }

    // Evaluate using GPT-4o Vision API (single call, no batching)
    console.log('\n🎯 Starting complete vision-based evaluation...');
    const result = await evaluateWithVision(questionPaperImages, answerSheetImages);
    
    console.log('\n✅ Evaluation complete!');

    // Clean up uploaded files
    cleanupFiles(allFiles);

    res.json(result);
    
  } catch (error) {
    console.error('Evaluation error:', error);
    
    // Clean up files on error
    if (allFiles.length > 0) {
      cleanupFiles(allFiles);
    }
    
    res.status(500).json({ 
      error: error.message || 'Internal server error during evaluation' 
    });
  }
};
