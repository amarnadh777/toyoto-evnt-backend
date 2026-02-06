const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');

router.post("/create",participantController.createParticipant);
router.post("/scan",participantController.scanParticipant);
router.get("/list",participantController.getParticipantsData);
module.exports = router;
