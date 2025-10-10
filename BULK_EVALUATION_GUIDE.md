# Bulk Evaluation Feature - User Guide

## 🎯 Overview

The Smart Grader now supports **Bulk Evaluation** - evaluate answer sheets from multiple students (40-50) simultaneously with intelligent concurrent processing.

---

## 🚀 Features

### ✅ What's New

1. **Upload Multiple Answer Sheets** - Drop 40-50 student answer sheets at once
2. **Concurrent Processing** - Intelligently processes 5-6 students at the same time
3. **Real-time Progress** - Watch evaluation progress live with status updates
4. **Individual Reports** - View and download each student's evaluation separately
5. **Smart Token Management** - Automatically adjusts concurrency based on PDF sizes
6. **Summary Statistics** - Get class-wide statistics (average, highest, lowest scores)

---

## 📋 How to Use

### Step 1: Start the Application

**Backend:**
```bash
cd /Users/rajuputta/smart-grader/backend
npm start
```

**Frontend:**
```bash
cd /Users/rajuputta/smart-grader/frontend/frontend
npm start
```

### Step 2: Switch to Bulk Mode

1. Open the app in your browser (http://localhost:3000)
2. Click the **"Switch to Bulk Evaluation"** button at the top
3. You'll see the bulk upload interface

### Step 3: Upload Files

1. **Upload Question Paper** (1 file)
   - Drag & drop or click to browse
   - Accepts PDF files only

2. **Upload Answer Sheets** (40-50 files)
   - Drag & drop all student answer sheets at once
   - Or select multiple files from file browser
   - Each PDF = 1 student's answer sheet
   - Files will be listed with numbers

3. Click **"Start Bulk Evaluation"** button

### Step 4: Monitor Progress

You'll see a progress dashboard showing:

- **Overall Progress Bar** - Percentage complete
- **Statistics** - Completed, Processing, Queued, Failed counts
- **Individual Sheet Status** - Each student's current status:
  - 🟡 Queued - Waiting to start
  - ⏳ Processing - Currently being evaluated
  - ✅ Complete - Evaluation finished
  - ❌ Failed - Error occurred

### Step 5: View Results

- Click **"View Report"** next to any completed student
- Modal opens showing:
  - Student information
  - Overall score and grade
  - Question-by-question breakdown
- Click **"Download Full Report"** to save as JSON

---

## 🏗️ Technical Architecture

### Backend Components

```
backend/
├── controllers/
│   └── bulkEvaluationController.js    # Main bulk controller
├── utils/
│   ├── tokenEstimator.js              # Estimates token usage
│   ├── bulkJobManager.js              # Manages job queue
│   └── concurrentProcessor.js         # Processes sheets concurrently
└── routes/
    └── bulkEvaluation.js              # API routes
```

### Frontend Components

```
frontend/src/components/
├── BulkUploadForm.js                  # Bulk upload UI
├── BulkProgressTracker.js             # Progress monitoring
└── BulkUploadForm.css                 # Styling
```

---

## 🔧 API Endpoints

### 1. Start Bulk Evaluation
```
POST /api/evaluate-bulk
Content-Type: multipart/form-data

Body:
- questionPaper: File (1 PDF)
- answerSheets: File[] (multiple PDFs)

Response:
{
  "jobId": "bulk_1760123456789",
  "totalSheets": 45,
  "status": "processing",
  "estimatedTime": {...}
}
```

### 2. Get Job Status
```
GET /api/evaluate-bulk/:jobId

Response:
{
  "jobId": "...",
  "status": "processing",
  "progress": {...},
  "sheets": [...]
}
```

### 3. Get Individual Result
```
GET /api/evaluate-bulk/:jobId/result/:sheetId

Response:
{
  "student": {...},
  "evaluation": {...},
  "questions": [...]
}
```

### 4. Get All Results Summary
```
GET /api/evaluate-bulk/:jobId/results

Response:
{
  "results": [...],
  "summary": {
    "averageScore": 75.5,
    "highestScore": 95,
    "lowestScore": 45,
    "gradeDistribution": {...}
  }
}
```

---

## ⚡ Performance

### Token-Aware Concurrency

The system automatically calculates optimal concurrency based on:
- PDF page counts
- OpenAI rate limits (30,000 TPM)
- Safety buffer (75%)

**Examples:**

| PDF Size | Pages | Tokens/Sheet | Concurrent | Total Time (45 sheets) |
|----------|-------|--------------|------------|------------------------|
| Small    | 10    | ~8,000       | 3          | ~15 minutes            |
| Medium   | 30    | ~24,000      | 1-2        | ~20 minutes            |
| Large    | 50    | ~40,000      | 1 + batching| ~25 minutes          |

### Smart Batching

For large PDFs that exceed token limits:
- Automatically switches to batched evaluation
- Evaluates 6 questions at a time
- Combines results seamlessly

---

## 📊 Results Storage

Results are stored in:
```
backend/results/bulk_jobs/
└── [jobId]/
    ├── job_metadata.json
    ├── sheet_0_result.json
    ├── sheet_1_result.json
    └── ...
```

Each result file contains:
- Student information
- Complete evaluation
- Question-by-question analysis
- Scores and feedback

---

## 🐛 Troubleshooting

### Issue: "Rate limit exceeded"

**Solution:** The system should handle this automatically by:
- Reducing concurrency
- Adding delays between batches
- Using batched evaluation for large PDFs

If it persists, your OpenAI account needs to reach Tier 1 ($5 spending).

### Issue: "Some sheets failed"

**Reasons:**
- Corrupted PDF file
- Unreadable handwriting
- Network timeout

**Solution:**
- Check the error message
- Re-upload the failed sheet individually
- Try single evaluation mode for that sheet

### Issue: "Progress stuck at X%"

**Solution:**
- Wait - large PDFs take longer
- Check backend console for errors
- Refresh the page (progress will resume)

---

## 💡 Tips for Best Results

1. **Name Files Clearly**
   - Use student names in filenames
   - Example: `Student_Raj_Math.pdf`, `Student_Priya_Math.pdf`

2. **Group Similar Sizes**
   - Process similar-sized PDFs together
   - System will optimize concurrency better

3. **Monitor First Batch**
   - Watch the first few completions
   - Verify results are accurate
   - Adjust if needed

4. **Download Results**
   - Download JSON for backup
   - Can import into spreadsheet software
   - Keep for records

---

## 🔮 Future Enhancements

- [ ] Export results to Excel/CSV
- [ ] Class-wide analytics dashboard
- [ ] Email notifications when complete
- [ ] Comparison between students
- [ ] Retry failed evaluations automatically

---

## 📞 Support

For issues or questions:
1. Check backend console logs
2. Review error messages in UI
3. Verify OpenAI API key is valid
4. Ensure sufficient API credits

---

**Happy Grading! 🎓**

