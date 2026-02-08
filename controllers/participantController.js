const uuid = require('uuid');
const Participant = require('../models/Participants');
const QRCode = require('qrcode');   
const puppeteer = require('puppeteer');
const getBrowser = require('../utils/browser');
const fs = require('fs');
const path = require('path');
exports.createParticipant = async (req, res) => {
try {
    const { name, email, phone } = req.body;
    console.log(name, email, phone)
    if(!name || !email){
        return res.status(400).json({ message: "Name, email and phone are required" });
    }
    const qrCode = uuid.v4();
     const qrImage = await QRCode.toDataURL(qrCode);
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
      ,
      qrCodeImage: qrImage
    
    });
  

} catch (error) {
    console.error("Error creating participant:", error);
    res.status(500).json({ message: "Server error" });
}

}




exports.updateParticipant = async (req, res) => {

  try {

    const participantId = req.params.participantId;

    const {
      name,
      email,
      phone,
      checkedIn
    } = req.body;

    // Find participant
    const participant = await Participant.findById(participantId);

    if (!participant) {
      return res.status(404).json({
        message: "Participant not found"
      });
    }

    // Email duplicate check
    if (email && email !== participant.email) {

      const emailExists = await Participant.findOne({
        email,
        _id: { $ne: participantId }
      });

      if (emailExists) {
        return res.status(400).json({
          message: "Email already exists"
        });
      }

      participant.email = email;

    }

    // Update basic fields
    if (name !== undefined)
      participant.name = name;

    if (phone !== undefined)
      participant.phone = phone;

    // Handle check-in / check-out
    if (checkedIn !== undefined) {

      participant.checkedIn = checkedIn;

      if (checkedIn === true) {

        // Set check-in time if not already set
        participant.checkedInAt =
          participant.checkedInAt || new Date();

      }
      else {

        // Reset check-in time on checkout
        participant.checkedInAt = null;

      }

    }

    await participant.save();

    res.status(200).json({

      message: "Participant updated successfully",

      participant

    });

  }
  catch (error) {

    console.error("Update error:", error);

    res.status(500).json({
      message: "Server error"
    });

  }

};


exports.deleteParticipant = async (req, res) => {

  try {

    const participantId = req.params.participantId;

    // Check if participant exists
    const participant = await Participant.findById(participantId);

    if (!participant) {
      return res.status(404).json({
        message: "Participant not found"
      });
    }

    // Optional safety check (recommended)
    if (participant.checkedIn) {

      return res.status(400).json({
        message: "Cannot delete participant who already checked in"
      });

    }

    // Delete participant
    await Participant.findByIdAndDelete(participantId);

    res.status(200).json({

      message: "Participant deleted successfully",

      deletedParticipantId: participantId

    });

  }
  catch (error) {

    console.error("Delete error:", error);

    res.status(500).json({
      message: "Server error"
    });

  }

};




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


exports.getParticipantsDataForAdmin = async(req,res) => { 
    try {
        const totalRegistarion = await Participant.countDocuments();
        const checkedInParticipants = await Participant.countDocuments({ checkedIn: true });
        const notCheckedInParticipants = totalRegistarion - checkedInParticipants;
        const participantsList = await Participant.find().sort({listNumber: 1});
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




exports.generatePdf = async (req, res) => {

  let page = null;

  try {



    const participantId = req.params.participantId;
    console.log("Generating Ticket PDF...",participantId);
    // Fetch participant
    const participant = await Participant.findById(participantId);

    if (!participant) {
      return res.status(404).send("Participant not found");
    }

    // Generate QR image
    const qrImage = await QRCode.toDataURL(
      participant.qrCode || participant._id.toString()
    );

    // HTML template
    const htmlContent = `
   <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<title>Event Ticket</title>

<style>

* {
  box-sizing: border-box;
}

body {

  margin: 0;
  padding: 0;

  background: linear-gradient(135deg, #0f172a, #1e293b);

  height: 100vh;

  display: flex;
  justify-content: center;
  align-items: center;

  font-family: "Segoe UI", Arial, sans-serif;

}


/* Ticket Card */
.ticket {

  width: 340px;

  background: white;

  border-radius: 20px;

  overflow: hidden;

  box-shadow:
    0 20px 40px rgba(0,0,0,0.25);

  position: relative;

}


/* Header */
.ticket-header {

  background: linear-gradient(90deg, #2563eb, #4f46e5);

  color: white;

  padding: 20px;

  text-align: center;

}

.ticket-header h1 {

  margin: 0;
  font-size: 22px;
  letter-spacing: 1px;

}

.ticket-header p {

  margin: 5px 0 0;
  font-size: 13px;
  opacity: 0.9;

}


/* Body */
.ticket-body {

  padding: 25px;

  text-align: center;

}


/* QR Box */
.qr-box {

  background: #f8fafc;

  border-radius: 16px;

  padding: 15px;

  border: 2px dashed #cbd5e1;

  display: inline-block;

  margin-bottom: 20px;

}



.qr-box img {

  width: 280px;
  height: 300px;

}




/* Participant Name */
.name {

  font-size: 22px;

  font-weight: bold;

  color: #0f172a;

}


/* Participant ID */
.id {

  font-size: 13px;

  color: #64748b;

  margin-top: 5px;

}


/* Divider */
.divider {

  margin: 20px 0;

  border-top: 1px dashed #e2e8f0;

}


/* Info Section */
.info {

  display: flex;

  justify-content: space-between;

  font-size: 12px;

  color: #334155;

}

.info div {

  text-align: center;

}


/* Footer */
.ticket-footer {

  background: #f1f5f9;

  padding: 15px;

  text-align: center;

  font-size: 12px;

  color: #475569;

}


/* Decorative circles */
.ticket::before,
.ticket::after {

  content: "";

  position: absolute;

  width: 20px;
  height: 20px;

  background: #0f172a;

  border-radius: 50%;

  top: 50%;

  transform: translateY(-50%);

}

.ticket::before {

  left: -10px;

}

.ticket::after {

  right: -10px;

}

</style>
</head>


<body>


<div class="ticket">


  <!-- Header -->
  <div class="ticket-header">

    <h1>EVENT PASS</h1>

    <p>Official Entry Ticket</p>

  </div>


  <!-- Body -->
  <div class="ticket-body">


    <!-- QR Code -->
    <div class="qr-box">

      <!-- Replace this src dynamically -->
      <img src="${qrImage}" />

    </div>


    <!-- Name -->
    <div class="name">

      ${participant.name}

    </div>


    <!-- ID -->
   


    <div class="divider"></div>



  </div>


  <!-- Footer -->
  <div class="ticket-footer">

    Please present this QR code at entry gate

  </div>


</div>


</body>
</html>

    `;

    // Get shared browser
    const browser = await getBrowser();

    // Create new page (IMPORTANT)
    page = await browser.newPage();

    await page.setViewport({
      width: 428,
      height: 926,
      deviceScaleFactor: 2
    });

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0"
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({

      width: "428px",
      height: "926px",
      printBackground: true

    });

    // Close page only (NOT browser)
    await page.close();

    // Send PDF
    res.set({

      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition":
        `attachment; filename=ticket-${participant.name}.pdf`

    });

    res.send(pdfBuffer);

  }
  catch (error) {

    console.error("PDF Generation Error:", error);

    if (page) await page.close();

    res.status(500).json({
      message: "Error generating PDF"
    });

  }

};