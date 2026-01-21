import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { Readable } from "stream";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// Nodemailer transporter — replace with your email service and credentials
const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com", // e.g., smtp.gmail.com
  port: 465,
  secure: true, // true for 465
  auth: {
    user: "agreements@cheqmart.com",
    pass: "Nikekick2"
  }
});

// Endpoint to generate PDF and send via email
app.post("/send-pdf", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }

    // Create PDF in-memory
    const doc = new PDFDocument();
    const chunks = [];
    doc.on("data", chunk => chunks.push(chunk));
    doc.on("end", async () => {
      const pdfBuffer = Buffer.concat(chunks);

      // Send email with PDF attachment
      const info = await transporter.sendMail({
        from: '"Secure Agreement" <your-email@example.com>',
        to: email,
        subject: "Your Secure Agreement PDF",
        text: `Hello ${name},\n\nPlease find your PDF attached.`,
        attachments: [
          {
            filename: "agreement.pdf",
            content: pdfBuffer
          }
        ]
      });

      console.log("Email sent:", info.messageId);
      res.json({ success: true, messageId: info.messageId });
    });

    // Add content to PDF
    doc.fontSize(20).text("Secure Agreement", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`This agreement is generated for: ${name}`);
    doc.moveDown();
    doc.text("Thank you for using our service.", { align: "left" });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Secure Agreement Service is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

