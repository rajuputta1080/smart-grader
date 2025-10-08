const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Build evaluation prompt for GPT-4o Vision API (ALL questions at once)
 * @param {Array} questionPaperImages - Images from question paper
 * @param {Array} answerSheetImages - Images from answer sheet
 * @returns {string} Formatted prompt
 */
function buildCompleteEvaluationPrompt() {
  return `You are an expert educational evaluator and grader. Your task is to evaluate ALL questions from a student's answer sheet by looking at the provided images.

**YOUR TASK:**
1. SCAN THE ENTIRE QUESTION PAPER - from top to bottom, including all margins and edges
2. Identify ALL questions in every section (Section I, II, III, IV, etc.)
3. Look at the answer sheet images to find the student's answers for each question
4. Extract student information (name, class, roll number) if available
5. Evaluate EVERY single question with step-by-step scoring
6. Provide constructive feedback for each question

**CRITICAL INSTRUCTIONS FOR FINDING ALL QUESTIONS:**
- Scan the FULL page area - top, middle, AND bottom edges
- Questions can appear in multiple sections with different patterns (1., 2., 3... OR Q1, Q2, Q3... OR a), b), c...)
- Look for section headers like "I. Solve the problems", "II. Answer any", "III. Choose the correct answer"
- Count total questions carefully - if you see sections worth 4×2=8, that means 4 questions
- Do NOT stop scanning until you've reached the absolute bottom of the last page
- Include fill-in-the-blank questions, MCQs, and all other question types

**IMPORTANT NOTES:**
- Skip instruction/cover pages - only evaluate actual questions
- If a student didn't attempt a question, include it with 0 marks
- Read handwriting carefully - be generous if intent is clear
- Look for mathematical formulas, diagrams, and step-by-step solutions
- Be fair and consistent in grading

**CRITICAL - QUESTION NUMBERING RULES:**
⚠️ THIS IS THE MOST IMPORTANT INSTRUCTION - READ VERY CAREFULLY:

**How to get the correct questionId:**
1. Look at the ANSWER SHEET where the student wrote their answer
2. The student writes the question number before their answer (like "1.", "2.", "8.", "Q5", etc.)
3. Use EXACTLY that number as the questionId
4. DO NOT create your own sequential numbering (1, 2, 3, 4...)
5. If you see the student wrote "8." before their answer, use questionId: "Q8" (NOT "Q7" or any other number)

**Common mistake to AVOID:**
❌ WRONG: Counting "this is the 7th question I'm evaluating, so questionId = Q7"
✅ CORRECT: Reading "student wrote '8.' before the answer, so questionId = Q8"

**Why gaps in numbering are OK:**
- Student may skip optional questions (like Q7 in "Answer any 2 of 3")
- So you might evaluate: Q1, Q2, Q3, Q4, Q5, Q6, Q8, Q9, Q10, Q11 (Q7 missing)
- This is CORRECT - do not renumber to make it sequential!

**Examples:**
- Answer sheet shows: "1. answer...", "2. answer...", "8. answer..." → use Q1, Q2, Q8 (NOT Q1, Q2, Q3)
- If you evaluate 10 questions but they are numbered 1-6, 8-11 → that's correct! (Q7 was skipped)
- Section III starts with question 8 → use Q8, Q9, Q10, Q11 (NOT Q1, Q2, Q3, Q4)

**OUTPUT FORMAT (JSON):**
Return your evaluation in the following JSON format:
{
  "student": {
    "name": "Student Name (or 'Unknown' if not found)",
    "class": "Class/Grade (or 'Not specified')",
    "rollNumber": "Roll Number (or 'Not specified')"
  },
  "exam": {
    "name": "Exam name from question paper",
    "date": "Date if available or current date",
    "totalMarks": total_marks_for_entire_exam
  },
  "evaluation": {
    "totalScore": total_marks_student_scored,
    "maxScore": total_maximum_marks_possible,
    "percentage": percentage_score,
    "grade": "A+/A/B+/B/C/D/F based on percentage",
    "overallFeedback": "2-3 sentence summary of student's overall performance"
  },
  "questions": [
    {
      "questionId": "MUST be exact number from question paper - if paper shows '8.', use 'Q8' or '8', NOT 'Q7'",
      "questionText": "Full question text from question paper",
      "maxMarks": maximum_marks_for_this_question,
      "scoreAwarded": marks_given_to_student,
      "studentAnswer": "What the student wrote (transcribe if handwritten)",
      "referenceAnswer": "Expected/ideal answer",
      "steps": [
        {
          "stepText": "Description of this evaluation step",
          "score": marks_for_this_step,
          "explanation": "Why these marks were awarded or deducted"
        }
      ]
    }
  ],
  "timestamp": "${new Date().toISOString()}"
}

**Example with gaps in numbering:**
If student answered questions 1, 2, 5, 8, 9 from the paper (skipped 3, 4, 6, 7):
{
  "questions": [
    {"questionId": "Q1", "questionText": "...", ...},
    {"questionId": "Q2", "questionText": "...", ...},
    {"questionId": "Q5", "questionText": "...", ...},  ← Q3, Q4 skipped - this is correct!
    {"questionId": "Q8", "questionText": "...", ...},  ← Q6, Q7 skipped - preserve Q8!
    {"questionId": "Q9", "questionText": "...", ...}
  ]
}

**EVALUATION GUIDELINES:**
- Be fair and consistent in grading
- Award partial credit for partially correct answers
- Provide constructive, encouraging feedback
- If answer is completely correct, award full marks
- If answer shows understanding but has minor errors, award 70-90%
- If answer has major conceptual errors, award 30-60%
- If answer is completely wrong or missing, award 0-20%
- Break down each question into logical steps with individual scores

**CRITICAL - SCORING:**
- evaluation.maxScore = SUM of ALL individual question maxMarks
- evaluation.totalScore = SUM of ALL individual question scoreAwarded
- evaluation.maxScore MUST equal exam.totalMarks (if exam paper says "Total: 20 marks", then maxScore should be 20)
- Double-check your arithmetic!
- If maxScore doesn't match totalMarks, you likely missed some questions - scan again!

**SELF-VERIFICATION BEFORE SUBMITTING:**
1. Count your evaluated questions - does it match the question paper?
2. Sum all maxMarks - does it equal the exam's total marks?
3. Did you scan to the absolute bottom of the question paper?
4. If something doesn't add up, you missed questions - go back and scan more carefully!

**IMPORTANT:** Return ONLY valid JSON. No markdown, no code blocks, just pure JSON.`;
}

/**
 * Evaluate answer sheet using GPT-4o Vision API (single call for all questions)
 * @param {Array} questionPaperImages - Images from question paper
 * @param {Array} answerSheetImages - Images from answer sheet
 * @returns {Promise<Object>} Complete evaluation result
 */
async function evaluateWithVision(questionPaperImages, answerSheetImages) {
  try {
    console.log('\n🚀 Starting complete evaluation (no batching)...');
    console.log(`📄 Question paper: ${questionPaperImages.length} pages`);
    console.log(`📝 Answer sheet: ${answerSheetImages.length} pages`);
    console.log(`🎯 Sending all images in ONE API call...`);

    const startTime = Date.now();
    const prompt = buildCompleteEvaluationPrompt();

    // Build the messages array with all images at once
    const messageContent = [
      {
        type: "text",
        text: prompt
      }
    ];

    // Add all question paper images
    console.log(`📸 Adding ${questionPaperImages.length} question paper images...`);
    questionPaperImages.forEach((img, index) => {
      messageContent.push({
        type: "image_url",
        image_url: img.image_url
      });
      console.log(`   ✅ Question paper page ${index + 1} added`);
    });

    // Add all answer sheet images
    console.log(`📸 Adding ${answerSheetImages.length} answer sheet images...`);
    answerSheetImages.forEach((img, index) => {
      messageContent.push({
        type: "image_url",
        image_url: img.image_url
      });
      console.log(`   ✅ Answer sheet page ${index + 1} added`);
    });

    console.log(`\n⏳ Waiting for GPT-4o to evaluate all questions...`);

    // Single API call with timeout
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Evaluation timeout after 180 seconds')), 180000)
    );

    const apiPromise = openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational evaluator. Always return valid JSON with accurate scoring.'
        },
        {
          role: 'user',
          content: messageContent
        }
      ],
      temperature: 0.2,
      max_tokens: 16000,
      response_format: { type: "json_object" }
    });

    const response = await Promise.race([apiPromise, timeoutPromise]);

    const endTime = Date.now();
    const evaluationTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Evaluation complete!`);
    console.log(`⏱️  Time: ${evaluationTime} seconds`);
    console.log(`💰 Tokens used: ${response.usage.total_tokens}`);
    console.log(`   - Prompt tokens: ${response.usage.prompt_tokens}`);
    console.log(`   - Completion tokens: ${response.usage.completion_tokens}`);

    const result = JSON.parse(response.choices[0].message.content);

    // Debug: Log question IDs received
    console.log(`\n🔍 DEBUG - Question IDs received from GPT:`);
    result.questions.forEach((q, idx) => {
      console.log(`   ${idx + 1}. questionId: "${q.questionId}" - ${q.questionText.substring(0, 50)}...`);
    });

    // Validate the result
    validateEvaluationResult(result);

    // Add metadata
    result.evaluationTime = `${evaluationTime} seconds`;
    result.tokensUsed = response.usage.total_tokens;
    result.method = 'vision-api-complete';

    console.log(`📊 Results:`);
    console.log(`   - Questions evaluated: ${result.questions.length}`);
    console.log(`   - Score: ${result.evaluation.totalScore}/${result.evaluation.maxScore} (${result.evaluation.percentage}%)`);
    console.log(`   - Grade: ${result.evaluation.grade}`);

    return result;

  } catch (error) {
    console.error('\n❌ Evaluation error:', error.message);
    throw error;
  }
}

/**
 * Validate evaluation result structure
 * @param {Object} result - Evaluation result to validate
 */
function validateEvaluationResult(result) {
  const required = ['student', 'exam', 'evaluation', 'questions'];
  for (const key of required) {
    if (!(key in result)) {
      throw new Error(`Invalid evaluation result: missing key "${key}"`);
    }
  }
  if (!Array.isArray(result.questions)) {
    throw new Error('Invalid evaluation result: "questions" is not an array');
  }
  if (result.questions.length === 0) {
    throw new Error('Invalid evaluation result: no questions found');
  }
}

module.exports = {
  evaluateWithVision
};
