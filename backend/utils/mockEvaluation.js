exports.mockEvaluate = (answerFiles, questionFiles) => {
  // Mock result for MVP with detailed structure
  return {
    student: {
      name: "Ramesh Kumar",
      class: "Class 10",
      rollNumber: "2024001"
    },
    exam: {
      name: "Mathematics Midterm Examination",
      date: "2024-10-02",
      duration: "3 hours",
      totalMarks: 50
    },
    evaluation: {
      totalScore: 38,
      maxScore: 50,
      percentage: 76,
      grade: "B+",
      overallFeedback: "Good understanding of concepts with some calculation errors. Focus on accuracy in arithmetic operations."
    },
    questions: [
      {
        questionId: "Q1",
        questionText: "Solve the quadratic equation: 2x² + 3x - 5 = 0",
        maxMarks: 8,
        scoreAwarded: 6,
        studentAnswer: "I used the quadratic formula: x = (-b ± √(b²-4ac))/2a. Substituting: a=2, b=3, c=-5. x = (-3 ± √(9+40))/4 = (-3 ± √49)/4 = (-3 ± 7)/4. So x = 1 or x = -2.5",
        referenceAnswer: "Using quadratic formula: x = (-3 ± √(9+40))/4 = (-3 ± 7)/4. Therefore, x = 1 or x = -5/2",
        steps: [
          {
            stepText: "Applied quadratic formula correctly",
            score: 2,
            explanation: "Correct formula used with proper substitution"
          },
          {
            stepText: "Calculated discriminant: b²-4ac = 9+40 = 49",
            score: 2,
            explanation: "Discriminant calculation is correct"
          },
          {
            stepText: "Found roots: x = 1 and x = -2.5",
            score: 2,
            explanation: "Roots calculated correctly, though -2.5 should be -5/2 for exact form"
          },
          {
            stepText: "Presentation and final answer",
            score: 0,
            explanation: "Minor deduction for not expressing -2.5 as -5/2"
          }
        ]
      },
      {
        questionId: "Q2", 
        questionText: "Factorize: x² - 9",
        maxMarks: 5,
        scoreAwarded: 5,
        studentAnswer: "x² - 9 = (x-3)(x+3)",
        referenceAnswer: "x² - 9 = (x-3)(x+3) using difference of squares",
        steps: [
          {
            stepText: "Recognized difference of squares pattern",
            score: 2,
            explanation: "Correctly identified a²-b² pattern"
          },
          {
            stepText: "Applied formula: (a-b)(a+b)",
            score: 2,
            explanation: "Correct application of difference of squares formula"
          },
          {
            stepText: "Final factorization",
            score: 1,
            explanation: "Perfect factorization with correct signs"
          }
        ]
      },
      {
        questionId: "Q3",
        questionText: "Find the area of a circle with radius 7 cm",
        maxMarks: 6,
        scoreAwarded: 4,
        studentAnswer: "Area = πr² = π × 7² = π × 49 = 153.86 cm²",
        referenceAnswer: "Area = πr² = π × 7² = 49π cm² (exact) or 153.94 cm² (approximate)",
        steps: [
          {
            stepText: "Used correct formula: A = πr²",
            score: 2,
            explanation: "Correct area formula applied"
          },
          {
            stepText: "Substituted radius: r = 7",
            score: 1,
            explanation: "Correct substitution of radius value"
          },
          {
            stepText: "Calculation: 7² = 49",
            score: 1,
            explanation: "Squaring done correctly"
          },
          {
            stepText: "Final answer and units",
            score: 0,
            explanation: "Minor error in π calculation (used 3.14 instead of more precise value)"
          }
        ]
      },
      {
        questionId: "Q4",
        questionText: "Solve: 3x + 7 = 22",
        maxMarks: 4,
        scoreAwarded: 4,
        studentAnswer: "3x + 7 = 22. Subtracting 7: 3x = 15. Dividing by 3: x = 5",
        referenceAnswer: "3x + 7 = 22 → 3x = 15 → x = 5",
        steps: [
          {
            stepText: "Isolated variable term",
            score: 1,
            explanation: "Correctly subtracted 7 from both sides"
          },
          {
            stepText: "Simplified: 3x = 15",
            score: 1,
            explanation: "Correct arithmetic"
          },
          {
            stepText: "Solved for x: x = 5",
            score: 1,
            explanation: "Correct division by 3"
          },
          {
            stepText: "Verification and presentation",
            score: 1,
            explanation: "Clear step-by-step solution"
          }
        ]
      },
      {
        questionId: "Q5",
        questionText: "Find the value of sin 30°",
        maxMarks: 3,
        scoreAwarded: 3,
        studentAnswer: "sin 30° = 1/2",
        referenceAnswer: "sin 30° = 1/2",
        steps: [
          {
            stepText: "Recalled standard value",
            score: 2,
            explanation: "Correctly remembered standard trigonometric value"
          },
          {
            stepText: "Final answer",
            score: 1,
            explanation: "Perfect answer"
          }
        ]
      }
    ],
    timestamp: new Date().toISOString(),
    evaluationTime: "2.3 seconds"
  };
};
