# Smart Grader MVP

An AI-powered web application for evaluating student answer sheets with detailed feedback and scoring.

## Features

- **File Upload**: Drag-and-drop interface for question papers and answer sheets (PDF/images)
- **AI Evaluation**: Mock AI evaluation with detailed step-by-step feedback
- **Result Cards**: Comprehensive evaluation results with per-question breakdown
- **Export Options**: Download results as JSON or export to PDF
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React.js with Create React App
- **Backend**: Node.js with Express
- **File Upload**: Multer for handling file uploads
- **Styling**: Custom CSS with modern design

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation & Running

1. **Clone and navigate to the project**
   ```bash
   cd smart-grader
   ```

2. **Start the Backend Server**
   ```bash
   cd backend
   npm install
   npm start
   ```
   Backend will run on http://localhost:5000

3. **Start the Frontend Server** (in a new terminal)
   ```bash
   cd frontend/frontend
   npm install
   npm start
   ```
   Frontend will run on http://localhost:3000

4. **Open your browser**
   Navigate to http://localhost:3000

## Usage

1. **Upload Files**
   - Upload a question paper (PDF or images)
   - Upload answer sheet files (PDF or multiple images)
   - Use drag-and-drop or click to browse

2. **Evaluation Process**
   - Click "Start Evaluation"
   - Watch the processing animation
   - View detailed results

3. **View Results**
   - See overall score and grade
   - Expand questions for detailed feedback
   - View step-by-step evaluation
   - Export results as PDF or JSON

## Project Structure

```
smart-grader/
├── backend/
│   ├── controllers/     # API controllers
│   ├── routes/         # API routes
│   ├── utils/          # Mock evaluation logic
│   └── uploads/        # File storage
└── frontend/
    └── frontend/       # React application
        ├── src/
        │   ├── components/
        │   │   ├── UploadForm.js
        │   │   ├── ResultCard.js
        │   │   └── ProcessingPage.js
        │   └── App.js
        └── public/
```

## API Endpoints

- `POST /api/evaluate` - Upload and evaluate answer sheets
  - Body: FormData with 'questionPaper' and 'answerSheet' files
  - Returns: Detailed evaluation results

## Mock Evaluation

The current implementation uses mock evaluation data that includes:
- Student information
- Question-wise scoring
- Step-by-step feedback
- Reference answers
- Overall assessment

## Future Enhancements

- Real OCR integration (Tesseract, Google Vision)
- AI-powered evaluation (OpenAI GPT)
- Database storage (PostgreSQL)
- Multi-student batch processing
- User authentication
- Advanced PDF export

## Development

The project is structured for easy extension:
- Add real OCR in `backend/utils/`
- Integrate AI evaluation in `backend/controllers/`
- Enhance UI components in `frontend/frontend/src/components/`

## License

MIT License - feel free to use and modify for your needs.
