const uuid = require('uuid');
const Participant = require('../models/Participants');
const QRCode = require('qrcode');   
const puppeteer = require('puppeteer');
const getBrowser = require('../utils/browser');
const fs = require('fs');
const path = require('path');
const templatePath = path.join(__dirname, "../pdfTemplate/qrCode.html");


const logoPath = path.join(__dirname, "../pdfTemplate/Group 122.png");
const bgPath = path.join(__dirname, "../pdfTemplate/RAV4 2026 Invitation_Selected 1.jpg");






const logoBase64 = fs.readFileSync(path.join(__dirname, "../pdfTemplate/Group 122.png"), "base64");
const bgBase64 = fs.readFileSync(path.join(__dirname, "../pdfTemplate/RAV4 2026 Invitation_Selected 1.jpg"), "base64");
const descriptionTextBase64 = fs.readFileSync(path.join(__dirname, "../pdfTemplate/image_text_main.png"), "base64");
const scanTextBase64 = fs.readFileSync(path.join(__dirname, "../pdfTemplate/text_under_Car.svg"), "base64");
const footerSloganBase64 = fs.readFileSync(path.join(__dirname, "../pdfTemplate/bottom_text.svg"), "base64");
// const logoUrl = `file://${logoPath}`;
// const bgUrl = `file://${bgPath}`;
const bgUrl = `data:image/jpeg;base64,${bgBase64}`;

const logoUrl = `data:image/png;base64,${logoBase64}`;
const descriptionTextUrl = `data:image/png;base64,${descriptionTextBase64}`;
const scanTextUrl =`data:image/svg+xml;base64,${scanTextBase64}`;
const footerSlogan = `data:image/svg+xml;base64,${footerSloganBase64}`

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
    console.log("Generating Ticket PDF...", participantId);
    
    // Fetch participant
    const participant = await Participant.findById(participantId);

    if (!participant) {
      return res.status(404).send("Participant not found");
    }

    // Generate QR image as a base64 Data URL
   const qrImage = await QRCode.toDataURL(
    participant.qrCode || participant._id.toString(), 
    {
        margin: 1,      // Tightens the white border around the code
        width: 400,     // Higher resolution for PDF printing
        color: {
            dark: '#FFFFFF',  // Makes the QR dots/squares WHITE
            light: '#00000000' // Makes the background TRANSPARENT
        }
    }
);

    const cleanName = participant.name
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");

    const fileName = `${cleanName}_ToyotaEvent2026.pdf`;
    
    // Get shared browser
    const browser = await getBrowser();

    // Create new page
    page = await browser.newPage();

    // Set viewport to match mobile screen ticket dimensions
    await page.setViewport({
      width: 428,
      height: 926,
      deviceScaleFactor: 2
    });

    // Read and replace HTML content dynamically
    let htmlContent = fs.readFileSync(templatePath, "utf-8");
    htmlContent = htmlContent
      .replace("{{LOGO}}", logoUrl)
      .replace("{{BACKGROUND}}", bgUrl)
      .replace("{{NAME}}", participant.name)
      .replace("{{DESC_IMAGE}}", descriptionTextUrl)
      .replace("{{SCAN_TEXT}}", scanTextUrl)
    .replace("{{FOOTER_SLOGAN}}", footerSlogan)
       .replace("{{QR_CODE}}", qrImage); 

      
    await page.setContent(htmlContent, {
      waitUntil: "networkidle0" // Waits until all resources are fully loaded
    });

    // Generate PDF with ZERO margins and forced CSS Page Size
    const pdfBuffer = await page.pdf({
      width: "428px",
      height: "926px",
      printBackground: true,
      preferCSSPageSize: true, // IMPORTANT: Forces Puppeteer to respect the CSS @page size
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    });

    // Close page only
    await page.close();

    // Send PDF
    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": pdfBuffer.length,
      "Content-Disposition": `attachment; filename=ticket-${fileName}.pdf`
    });

    res.send(pdfBuffer);

  } catch (error) {
    console.error("PDF Generation Error:", error);

    if (page) await page.close();

    res.status(500).json({
      message: "Error generating PDF"
    });
  }
};