const uuid = require("uuid");
const Participant = require("../models/Participants");
const QRCode = require("qrcode");
const puppeteer = require("puppeteer");
const getBrowser = require("../utils/browser");
const fs = require("fs");
const path = require("path");
const templatePath = path.join(__dirname, "../pdfTemplate/qrCode.html");
const englishTemplatePath = path.join(__dirname,"../pdfTemplate/qrCodeEnglish.html")
const archiver = require("archiver");
const logoPath = path.join(__dirname, "../pdfTemplate/Group 122.png");
const bgPath = path.join(
  __dirname,
  "../pdfTemplate/RAV4 2026 Invitation_Selected 1.jpg",
);

const logoBase64 = fs.readFileSync(
  path.join(__dirname, "../pdfTemplate/Group 122.png"),
  "base64",
);
const bgBase64 = fs.readFileSync(
  path.join(__dirname, "../pdfTemplate/RAV4 2026 Invitation_Selected 1.jpg"),
  "base64",
);
const descriptionTextBase64 = fs.readFileSync(
  path.join(__dirname, "../pdfTemplate/image_text_main.png"),
  "base64",
);
const scanTextBase64 = fs.readFileSync(
  path.join(__dirname, "../pdfTemplate/text_under_Car.svg"),
  "base64",
);
const footerSloganBase64 = fs.readFileSync(
  path.join(__dirname, "../pdfTemplate/bottom_text.svg"),
  "base64",
);

const rav4LogoBase64 =fs.readFileSync(
  path.join(__dirname, "../pdfTemplate/rav4logo.png"),
  "base64",
);
// const logoUrl = `file://${logoPath}`;
// const bgUrl = `file://${bgPath}`;
const bgUrl = `data:image/jpeg;base64,${bgBase64}`;

const logoUrl = `data:image/png;base64,${logoBase64}`;
const descriptionTextUrl = `data:image/png;base64,${descriptionTextBase64}`;
const scanTextUrl = `data:image/svg+xml;base64,${scanTextBase64}`;
const footerSlogan = `data:image/svg+xml;base64,${footerSloganBase64}`;
const rav4Logo = `data:image/png;base64,${rav4LogoBase64}`;


// exports.createParticipant = async (req, res) => {
//   try {
//     const { name, email, phone } = req.body;
//     console.log(name, email, phone);
//     if (!name || !email) {
//       return res
//         .status(400)
//         .json({ message: "Name, email and phone are required" });
//     }
//     const qrCode = uuid.v4();
//     const qrImage = await QRCode.toDataURL(qrCode);
//     const emailExists = await Participant.findOne({ email });
//     if (emailExists) {
//       return res.status(400).json({ message: "Email already exists" });
//     }
//     const newParticipant = new Participant({
//       name,
//       email,
//       phone,
//       qrCode,
//     });
//     await newParticipant.save();
//     res
//       .status(201)
//       .json({
//         message: "Participant created successfully",
//         participant: newParticipant,
//         qrCodeImage: qrImage,
//       });
//   } catch (error) {
//     console.error("Error creating participant:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };

exports.createParticipant = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    console.log(name, email, phone);

    // ✅ Only name required
    if (!name) {
      return res.status(400).json({
        message: "Name is required"
      });
    }

    // generate QR
    const qrCode = uuid.v4();
    const qrImage = await QRCode.toDataURL(qrCode);

    // ✅ check email only if provided
    if (email) {
      const emailExists = await Participant.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          message: "Email already exists"
        });
      }
    }

    // create participant
    const newParticipant = new Participant({
      name,
      email: email || null,
      phone: phone || null,
      qrCode
    });

    await newParticipant.save();

    res.status(201).json({
      message: "Participant created successfully",
      participant: newParticipant,
      qrCodeImage: qrImage
    });

  } catch (error) {
    console.error("Error creating participant:", error);
    res.status(500).json({
      message: "Server error"
    });
  }
};


// exports.updateParticipant = async (req, res) => {
//   try {
//     const participantId = req.params.participantId;

//     const { name, email, phone, checkedIn } = req.body;

//     // Find participant
//     const participant = await Participant.findById(participantId);

//     if (!participant) {
//       return res.status(404).json({
//         message: "Participant not found",
//       });
//     }

//     // Email duplicate check
//     if (email && email !== participant.email) {
//       const emailExists = await Participant.findOne({
//         email,
//         _id: { $ne: participantId },
//       });

//       if (emailExists) {
//         return res.status(400).json({
//           message: "Email already exists",
//         });
//       }

//       participant.email = email;
//     }

//     // Update basic fields
//     if (name !== undefined) participant.name = name;

//     if (phone !== undefined) participant.phone = phone;

//     // Handle check-in / check-out
//     if (checkedIn !== undefined) {
//       participant.checkedIn = checkedIn;

//       if (checkedIn === true) {
//         // Set check-in time if not already set
//         participant.checkedInAt = participant.checkedInAt || new Date();
//       } else {
//         // Reset check-in time on checkout
//         participant.checkedInAt = null;
//       }
//     }

//     await participant.save();

//     res.status(200).json({
//       message: "Participant updated successfully",

//       participant,
//     });
//   } catch (error) {
//     console.error("Update error:", error);

//     res.status(500).json({
//       message: "Server error",
//     });
//   }
// };




// exports.updateParticipant = async (req, res) => {
//   try {
//     const participantId = req.params.participantId;

//     const { name, email, phone, checkedIn } = req.body;

//     // Find participant
//     const participant = await Participant.findById(participantId);

//     if (!participant) {
//       return res.status(404).json({
//         message: "Participant not found",
//       });
//     }

//     // ✅ Update name (only if provided)
//     if (name !== undefined) {
//       participant.name = name;
//     }

//     // ✅ Handle email (optional)
//     if (email !== undefined) {

//       // normalize empty string → null
//       const normalizedEmail = email || null;

//       // check duplicate only if email exists
//       if (normalizedEmail && normalizedEmail !== participant.email) {

//         const emailExists = await Participant.findOne({
//           email: normalizedEmail,
//           _id: { $ne: participantId },
//         });

//         if (emailExists) {
//           return res.status(400).json({
//             message: "Email already exists",
//           });
//         }
//       }

//       participant.email = normalizedEmail;
//     }

//     // ✅ Handle phone (optional)
//     if (phone !== undefined) {
//       participant.phone = phone || null;
//     }

//     // ✅ Handle check-in / check-out
//     if (checkedIn !== undefined) {

//       participant.checkedIn = checkedIn;

//       if (checkedIn === true) {
//         participant.checkedInAt = participant.checkedInAt || new Date();
//       } else {
//         participant.checkedInAt = null;
//       }

//     }

//     await participant.save();

//     res.status(200).json({
//       message: "Participant updated successfully",
//       participant,
//     });

//   } catch (error) {

//     console.error("Update error:", error);

//     res.status(500).json({
//       message: "Server error",
//     });

//   }
// };

exports.updateParticipant = async (req, res) => {
  try {
    const participantId = req.params.participantId;

    const {
      name,
      email,
      phone,
      checkedIn,
      listNumber
    } = req.body;

    // ✅ Find participant
    const participant = await Participant.findById(participantId);

    if (!participant) {
      return res.status(404).json({
        message: "Participant not found",
      });
    }

    // =========================
    // ✅ Update name
    // =========================
    if (name !== undefined) {
      participant.name = name;
    }

    // =========================
    // ✅ Update email (optional, allow null)
    // =========================
    if (email !== undefined) {

      const normalizedEmail = email || null;

      // check duplicate only if not null
      if (
        normalizedEmail &&
        normalizedEmail !== participant.email
      ) {
        const emailExists = await Participant.findOne({
          email: normalizedEmail,
          _id: { $ne: participantId },
        });

        if (emailExists) {
          return res.status(400).json({
            message: "Email already exists",
          });
        }
      }

      participant.email = normalizedEmail;
    }

    // =========================
    // ✅ Update phone (optional)
    // =========================
    if (phone !== undefined) {
      participant.phone = phone || null;
    }

    // =========================
    // ✅ Update listNumber (manual update allowed)
    // =========================
    if (listNumber !== undefined) {

      const normalizedListNumber =
        listNumber === "" || listNumber === null
          ? null
          : Number(listNumber);

      if (
        normalizedListNumber !== null &&
        normalizedListNumber !== participant.listNumber
      ) {
        const listExists = await Participant.findOne({
          listNumber: normalizedListNumber,
          _id: { $ne: participantId },
        });

        if (listExists) {
          return res.status(400).json({
            message: "List number already exists",
          });
        }
      }

      participant.listNumber = normalizedListNumber;
    }

    // =========================
    // ✅ Handle Check-in / Uncheck
    // =========================
    if (checkedIn !== undefined) {

      participant.checkedIn = checkedIn;

      if (checkedIn === true) {

        // set check-in time if not exists
        participant.checkedInAt =
          participant.checkedInAt || new Date();

      } else {

        // ⭐ IMPORTANT: Reset when unchecked
        participant.checkedInAt = null;
        participant.listNumber = null;

      }
    }

    // =========================
    // ✅ Save
    // =========================
    await participant.save();

    res.status(200).json({
      message: "Participant updated successfully",
      participant,
    });

  } catch (error) {

    console.error("Update error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message
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
        message: "Participant not found",
      });
    }

    // Optional safety check (recommended)
    if (participant.checkedIn) {
      return res.status(400).json({
        message: "Cannot delete participant who already checked in",
      });
    }

    // Delete participant
    await Participant.findByIdAndDelete(participantId);

    res.status(200).json({
      message: "Participant deleted successfully",

      deletedParticipantId: participantId,
    });
  } catch (error) {
    console.error("Delete error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// exports.scanParticipant = async (req, res) => {
//   try {
//     const { qrCode } = req.body;

//     if (!qrCode) {
//       return res.status(200).json({
//         success: false,
//         result: "invalid_qrcode",
//         message: "QR code is required",
//       });
//     }

//     const participant = await Participant.findOne({ qrCode });

//     // Invalid QR
//     if (!participant) {
//       return res.status(200).json({
//         success: false,
//         result: "invalid_qrcode",
//         message: "Invalid QR Code",
//       });
//     }

//     // Already checked-in
//     if (participant.checkedIn) {
//       return res.status(200).json({
//         success: false,
//         result: "already_checked_in",
//         message: "Participant already checked in",
//         participant,
//       });
//     }

//     // ⭐ Get last checked-in participant
//     const lastCheckedIn = await Participant.findOne({
//       listNumber: { $ne: null },
//     }).sort({ listNumber: -1 });

//     // ⭐ Assign next list number
//     const nextListNumber = lastCheckedIn ? lastCheckedIn.listNumber + 1 : 1;

//     // ⭐ Update participant
//     participant.checkedIn = true;
//     participant.checkedInAt = new Date();
//     participant.listNumber = nextListNumber;

//     await participant.save();

//     return res.status(200).json({
//       success: true,
//       result: "success",
//       message: "Check-in successful",
//       participant,
//     });
//   } catch (error) {
//     console.error(error);

//     res.status(500).json({
//       success: false,
//       result: "server_error",
//       message: "Server error",
//     });
//   }
// };

// exports.getParticipantsData = async (req, res) => {
//   try {
//     const totalRegistarion = await Participant.countDocuments();
//     const checkedInParticipants = await Participant.countDocuments({
//       checkedIn: true,
//     });
//     const notCheckedInParticipants = totalRegistarion - checkedInParticipants;
//     const participantsList = await Participant.find({ checkedIn: true }).sort({
//       listNumber: 1,
//     });
//     res.status(200).json({
//       totalRegistarion,
//       checkedInParticipants,
//       notCheckedInParticipants,
//       participantsList,
//     });
//   } catch (error) {
//     console.error("Error fetching participants data:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// };
exports.scanParticipant = async (req, res) => {
  try {

    const { qrCode } = req.body;

    if (!qrCode) {
      return res.status(200).json({
        success: false,
        result: "invalid_qrcode",
        message: "QR code is required",
      });
    }

    const participant = await Participant.findOne({ qrCode });

    // Invalid QR
    if (!participant) {
      return res.status(200).json({
        success: false,
        result: "invalid_qrcode",
        message: "Invalid QR Code",
      });
    }

    // Already checked-in
    if (participant.checkedIn) {

      // ✅ Calculate dynamic listNumber based on check-in order
      const queuePosition = await Participant.countDocuments({
        checkedIn: true,
        checkedInAt: { $lte: participant.checkedInAt }
      });

      return res.status(200).json({
        success: false,
        result: "already_checked_in",
        message: "Participant already checked in",
        participant: {
          ...participant.toObject(),
          listNumber: queuePosition
        },
      });

    }

    // ✅ Set check-in
    participant.checkedIn = true;
    participant.checkedInAt = new Date();

    await participant.save();

    // ✅ Calculate dynamic listNumber
    const queuePosition = await Participant.countDocuments({
      checkedIn: true,
      checkedInAt: { $lte: participant.checkedInAt }
    });

    return res.status(200).json({
      success: true,
      result: "success",
      message: "Check-in successful",
      participant: {
        ...participant.toObject(),
        listNumber: queuePosition
      },
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      result: "server_error",
      message: "Server error",
    });

  }
};


exports.getParticipantsData = async (req, res) => {
  try {

    const totalRegistarion = await Participant.countDocuments();

    const checkedInParticipants = await Participant.countDocuments({
      checkedIn: true,
    });

    const notCheckedInParticipants =
      totalRegistarion - checkedInParticipants;

    // ✅ Sort by check-in time (oldest first)
    const participants = await Participant.find({
      checkedIn: true,
    })
      .sort({ checkedInAt: 1 })
      .lean(); // lean for better performance

    // ✅ Generate listNumber dynamically
    const participantsList = participants.map(
      (participant, index) => ({
        ...participant,
        listNumber: index + 1, // dynamic queue number
      })
    );

    res.status(200).json({
      totalRegistarion,
      checkedInParticipants,
      notCheckedInParticipants,
      participantsList,
    });

  } catch (error) {

    console.error("Error fetching participants data:", error);

    res.status(500).json({
      message: "Server error"
    });

  }
};
  // exports.getParticipantsDataForAdmin = async (req, res) => {
  //   try {
  //     const totalRegistarion = await Participant.countDocuments();
  //     const checkedInParticipants = await Participant.countDocuments({
  //       checkedIn: true,
  //     });
  //     const notCheckedInParticipants = totalRegistarion - checkedInParticipants;
  //     const participantsList = await Participant.find().sort({ createdAt: 1 });
  //     res.status(200).json({
  //       totalRegistarion,
  //       checkedInParticipants,
  //       notCheckedInParticipants,
  //       participantsList,
  //     });
  //   } catch (error) {
  //     console.error("Error fetching participants data:", error);
  //     res.status(500).json({ message: "Server error" });
  //   }
  // };

exports.getParticipantsDataForAdmin = async (req, res) => {
  try {

    const totalRegistarion = await Participant.countDocuments();

    const checkedInParticipants = await Participant.countDocuments({
      checkedIn: true,
    });

    const notCheckedInParticipants =
      totalRegistarion - checkedInParticipants;

    // ✅ Fetch ALL participants
    const participants = await Participant.find().lean();

    // ✅ Separate checked-in and not checked-in
    const checkedInList = participants
      .filter(p => p.checkedIn && p.checkedInAt)
      .sort((a, b) => new Date(a.checkedInAt) - new Date(b.checkedInAt));

    const notCheckedInList = participants
      .filter(p => !p.checkedIn);

    // ✅ Assign dynamic listNumber based on check-in order
    const checkedInWithListNumber = checkedInList.map((participant, index) => ({
      ...participant,
      listNumber: index + 1
    }));

    // ✅ Merge lists (checked-in first, then not checked-in)
    const participantsList = [
      ...checkedInWithListNumber,
      ...notCheckedInList
    ];

    res.status(200).json({
      totalRegistarion,
      checkedInParticipants,
      notCheckedInParticipants,
      participantsList,
    });

  } catch (error) {

    console.error("Error fetching participants data:", error);

    res.status(500).json({
      message: "Server error"
    });

  }
};


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
        errorCorrectionLevel: "H",
        margin: 2,
        width: 400,
        color: {
          dark: "#000000", // ✅ BLACK dots
          light: "#FFFFFF", // ✅ WHITE background
        },
      },
    );

    const cleanName = participant.name
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\p{L}\p{N}_]/gu, "");

    const fileName = `${cleanName}_ToyotaEvent2026.pdf`;

    // Get shared browser
    const browser = await getBrowser();

    // Create new page
    page = await browser.newPage();

    // Set viewport to match mobile screen ticket dimensions
    await page.setViewport({
      width: 428,
      height: 926,
      deviceScaleFactor: 2,
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
      waitUntil: "networkidle0", // Waits until all resources are fully loaded
    });

    // Generate PDF with ZERO margins and forced CSS Page Size
    const pdfBuffer = await page.pdf({
      width: "428px",
      height: "926px",
      printBackground: true,
      preferCSSPageSize: true, // IMPORTANT: Forces Puppeteer to respect the CSS @page size
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });

    // Close page only
    await page.close();
    const fallbackFileName = "ticket.pdf";
    const encodedFileName = encodeURIComponent(fileName);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodedFileName}`,
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);

    if (page) await page.close();

    res.status(500).json({
      message: "Error generating PDF",
    });
  }
};




exports.generatePdfEnglish = async (req, res) => {
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
        errorCorrectionLevel: "H",
        margin: 2,
        width: 400,
        color: {
          dark: "#000000", // ✅ BLACK dots
          light: "#FFFFFF", // ✅ WHITE background
        },
      },
    );

    const cleanName = participant.name
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^\p{L}\p{N}_]/gu, "");

    const fileName = `${cleanName}_ToyotaEvent2026.pdf`;

    // Get shared browser
    const browser = await getBrowser();

    // Create new page
    page = await browser.newPage();

    // Set viewport to match mobile screen ticket dimensions
    await page.setViewport({
      width: 428,
      height: 926,
      deviceScaleFactor: 2,
    });

    // Read and replace HTML content dynamically
    let htmlContent = fs.readFileSync(englishTemplatePath, "utf-8");
    htmlContent = htmlContent
      .replace("{{LOGO}}", logoUrl)
      .replace("{{BACKGROUND}}", bgUrl)
      .replace("{{NAME}}", participant.name)
      .replace("{{DESC_IMAGE}}", descriptionTextUrl)
      .replace("{{SCAN_TEXT}}", scanTextUrl)
      .replace("{{FOOTER_SLOGAN}}", footerSlogan)
      .replace("{{QR_CODE}}", qrImage)
      .replace("{{RAV4LOGO}}",rav4Logo);

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0", // Waits until all resources are fully loaded
    });

    // Generate PDF with ZERO margins and forced CSS Page Size
    const pdfBuffer = await page.pdf({
      width: "428px",
      height: "926px",
      printBackground: true,
      preferCSSPageSize: true, // IMPORTANT: Forces Puppeteer to respect the CSS @page size
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });

    // Close page only
    await page.close();
    const fallbackFileName = "ticket.pdf";
    const encodedFileName = encodeURIComponent(fileName);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Length", pdfBuffer.length);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodedFileName}`,
    );

    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);

    if (page) await page.close();

    res.status(500).json({
      message: "Error generating PDF",
    });
  }
};
// ✅ Safe filename generator (NO folders possible)
function getSafeFileName(name) {
  return path.basename(
    name
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[\/\\:*?"<>|]/g, "_"), // remove invalid chars
  );
}

exports.generateBulkPdf = async (req, res) => {
  let browser;
  let archive;

  try {
    console.log("Starting bulk PDF generation...");

    const participants = await Participant.find()
      .sort({ createdAt: 1 }) // oldest first
      .skip(58)
      .limit(21);

    if (!participants.length) {
      return res.status(404).json({
        message: "No participants found",
      });
    }

    browser = await getBrowser();

    // set response headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=ToyotaEventTickets.zip",
    );

    archive = archiver("zip", {
      zlib: { level: 9 },
    });

    archive.on("error", (err) => {
      console.error("Archive error:", err.message);

      archive.destroy();
    });

    archive.pipe(res);

    const templateHtml = fs.readFileSync(templatePath, "utf-8");

    for (const participant of participants) {
      try {
        console.log("Generating:", participant.name);

        const page = await browser.newPage();

        page.setDefaultTimeout(0);
        page.setDefaultNavigationTimeout(0);

        await page.setViewport({
          width: 428,
          height: 926,
          deviceScaleFactor: 2,
        });

        // generate QR
        const qrImage = await QRCode.toDataURL(
          participant.qrCode || participant._id.toString(),
          {
            margin: 2,
            width: 400,
            color: {
              dark: "#000000", // ✅ BLACK dots
              light: "#FFFFFF", // ✅ WHITE background
            },
          },
        );

        // inject template
        let htmlContent = templateHtml
          .replace("{{LOGO}}", logoUrl)
          .replace("{{BACKGROUND}}", bgUrl)
          .replace("{{NAME}}", participant.name)
          .replace("{{DESC_IMAGE}}", descriptionTextUrl)
          .replace("{{SCAN_TEXT}}", scanTextUrl)
          .replace("{{FOOTER_SLOGAN}}", footerSlogan)
          .replace("{{QR_CODE}}", qrImage);

        await page.setContent(htmlContent, {
          waitUntil: "domcontentloaded",
          timeout: 0,
        });

        const pdfUint8 = await page.pdf({
          width: "428px",
          height: "926px",
          printBackground: true,
          preferCSSPageSize: true,
          margin: 0,
        });

        if (!pdfUint8) {
          console.error("PDF failed:", participant.name);

          await page.close();

          continue;
        }

        const pdfBuffer = Buffer.from(pdfUint8);

        if (!Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
          console.error("Invalid PDF:", participant.name);

          await page.close();

          continue;
        }

        await page.close();

        // ✅ SAFE filename (NO folders)
        const fileName = getSafeFileName(
          `${participant.name}_ToyotaEvent2026.pdf`,
        );

        archive.append(pdfBuffer, {
          name: fileName,
        });

        console.log("Added to ZIP:", fileName);
      } catch (err) {
        console.error("Failed participant:", participant.name, err.message);
      }
    }

    await archive.finalize();

    console.log("ZIP completed successfully");
  } catch (error) {
    console.error("Bulk PDF Error:", error.message);

    if (archive) archive.destroy();

    if (!res.headersSent) {
      res.status(500).json({
        message: "Bulk PDF generation failed",
      });
    }
  }
};

exports.resetAllParticipantsCheckIn = async (req, res) => {
  try {
    const result = await Participant.updateMany(
      {}, // update all participants
      {
        $set: {
          checkedIn: false,
          checkedInAt: null,
          listNumber: null,
        },
      },
    );

    res.status(200).json({
      message: "All participants check-in reset successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Reset check-in error:", error);

    res.status(500).json({
      message: "Failed to reset participants",
    });
  }
};
