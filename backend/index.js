const express = require('express');
const cors = require('cors');
const evaluationRoutes = require('./routes/evaluation');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/evaluate', evaluationRoutes);

app.listen(5000, () => console.log('Backend running on port 5000'));
