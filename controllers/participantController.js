const uuid = require('uuid');
const Participant = require('../models/Participants');
exports.createParticipant = async (req, res) => {
try {
    const { name, email, phone } = req.body;
    if(!name || !email){
        return res.status(400).json({ message: "Name, email and phone are required" });
    }
    const qrCode = uuid.v4();
    const emailExists = await Participant.findOne({ email });
    if (emailExists) {
        return res.status(400).json({ message: "Email already exists" });
    }
    const newParticipant = new Participant({
        name,
        email,
        phone,
        qrCode
    });
    await newParticipant.save();
    res.status(201).json({ message: "Participant created successfully", participant: newParticipant
    
    });
  

} catch (error) {
    console.error("Error creating participant:", error);
    res.status(500).json({ message: "Server error" });
}

}

exports.scanParticipant = async (req, res) => {

  try {

    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(200).json({
        success: false,
        result: "invalid_qrcode",
        message: "QR code is required"
      });
    }

    const participant = await Participant.findOne({ qrCode });

    // Invalid QR
    if (!participant) {
      return res.status(200).json({
        success: false,
        result: "invalid_qrcode",
        message: "Invalid QR Code"
      });
    }

    // Already checked-in
    if (participant.checkedIn) {
      return res.status(200).json({
        success: false,
        result: "already_checked_in",
        message: "Participant already checked in",
        participant
      });
    }

    // ⭐ Get last checked-in participant
    const lastCheckedIn = await Participant
      .findOne({ listNumber: { $ne: null } })
      .sort({ listNumber: -1 });

    // ⭐ Assign next list number
    const nextListNumber = lastCheckedIn
      ? lastCheckedIn.listNumber + 1
      : 1;

    // ⭐ Update participant
    participant.checkedIn = true;
    participant.checkedInAt = new Date();
    participant.listNumber = nextListNumber;

    await participant.save();

    return res.status(200).json({
      success: true,
      result: "success",
      message: "Check-in successful",
      participant
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      result: "server_error",
      message: "Server error"
    });

  }

};


exports.getParticipantsData = async(req,res) => {
    try {
        const totalRegistarion = await Participant.countDocuments();
        const checkedInParticipants = await Participant.countDocuments({ checkedIn: true });
        const notCheckedInParticipants = totalRegistarion - checkedInParticipants;
        const participantsList = await Participant.find({checkedIn: true}).sort({listNumber: 1});
        res.status(200).json({
            totalRegistarion,
            checkedInParticipants,
            notCheckedInParticipants,
            participantsList
        });
    } catch (error) {
        console.error("Error fetching participants data:", error);
        res.status(500).json({ message: "Server error" });
    }
}