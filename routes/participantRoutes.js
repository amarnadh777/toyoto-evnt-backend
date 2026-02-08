const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');

router.post("/create",participantController.createParticipant);
router.put("/:participantId",participantController.updateParticipant);
router.delete("/:participantId",participantController.deleteParticipant);
router.post("/scan",participantController.scanParticipant);
router.get("/list",participantController.getParticipantsData);
router.get("/list-all",participantController.getParticipantsDataForAdmin);
router.get("/pdf/:participantId",participantController.generatePdf);
module.exports = router;
