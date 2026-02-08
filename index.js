const express = require('express');
const app = express();
const cors = require('cors');
const connectDB = require('./config/db');
const fs = require("fs");
const https = require("https"); // ✅ import https
require('dotenv').config();

app.use(express.json());

app.use(cors({}));

// Connect to MongoDB
connectDB();

const port = 3000;

// Test route
app.get('/', (req, res) => {
  res.send('🚀🚀🚀🚀 HTTPS Backend Running');
});

// Routes
app.use('/api/participants', require('./routes/participantRoutes'));

// SSL options
const sslOptions = {
  key: fs.readFileSync("./key.pem"),
  cert: fs.readFileSync("./cert.pem"),
};

// ✅ Create HTTPS server (IMPORTANT FIX)
https.createServer(sslOptions, app).listen(port, '0.0.0.0', () => {
  console.log(`🔐 HTTPS Server running on https://localhost:${port}`);
});
