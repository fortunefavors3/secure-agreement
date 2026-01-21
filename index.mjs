import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import fs from "fs";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Root endpoint
app.get("/", (req, res) => {
  res.send("Secure Agreement Service Running");
});

// Generate PDF endpoint
app.post("/generate-pdf", async (req, res) => {
  try {
    const { name, agreementText } = req.body;

    if (!name || !agreementText) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const pdfPath = path.join(process.cwd(), `${name}-agreement.pdf`);
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream(pdfPath));
    doc.fontSize(20).text(`Agreement for ${name}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(agreementText);
    doc.end();

    // Wait until PDF is written
    doc.on("finish", async () => {
      // Send email
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.EMAIL_TO,
        subject: `Agreement for ${name}`,
        text: `Please find attached the agreement for ${name}.`,
        attachments: [
          {
            filename: `${name}-agreement.pdf`,
            path: pdfPath
          }
        ]
      });

      res.json({ message: "PDF generated and emailed successfully" });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate PDF or send email" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
