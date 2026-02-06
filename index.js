const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();
app.use(express.json());
app.use(cors());
// Connect to MongoDB
connectDB();
const port = 3000;  

app.get('/', (req, res) => {

res.send('🚀🚀🚀🚀')

}   )
app.use('/api/participants', require('./routes/participantRoutes'));


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});