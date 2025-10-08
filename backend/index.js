require('dotenv').config();
const express = require('express');
const cors = require('cors');
const evaluationRoutes = require('./routes/evaluation');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/evaluate', evaluationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`OpenAI Model: ${process.env.OPENAI_MODEL || 'gpt-4o'}`);
});
