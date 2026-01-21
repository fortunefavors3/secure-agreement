// index.mjs
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----- CONFIG -----
const PORT = process.env.PORT || 3000;

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.example.com", // replace with your SMTP server
  port: 587,
  secure: false,
  auth: {
    user: "your_email@example.com", // replace with your email
    pass: "your_email_password",    // replace with your email password
  },
});

// ----- APP SETUP -----
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ----- ROUTES -----

// Test route
app.get("/", (req, res) => {
  res.send("Secure Agreement API is running.");
});

// Generate PDF and send email
app.post("/generate", async (req, res) => {
  try {
    const { name, email, agreementText } = req.body;

    if (!name || !email || !agreementText) {
      return res.status(400).json({ error: "Missing name, email, or agreementText" });
    }

    // Create PDF
    const pdfPath = path.join(__dirname, `${name.replace(/\s+/g, "_")}_agreement.pdf`);
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);
    doc.fontSize(20).text("Secure Agreement", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Name: ${name}`);
    doc.moveDown();
    doc.fontSize(12).text(agreementText);
    doc.end();

    // Wait until PDF is fully written
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Send email with PDF attachment
    const mailOptions = {
      from: "your_email@example.com",
      to: email,
      subject: "Your Secure Agreement",
      text: "Please find your secure agreement attached.",
      attachments: [
        {
          filename: path.basename(pdfPath),
          path: pdfPath,
        },
      ],
    };

    await transporter.sendMail(mailOptions);

    // Delete PDF after sending if you want
    fs.unlinkSync(pdfPath);

    res.json({ message: "Agreement generated and emailed successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate or send agreement." });
  }
});

// ----- START SERVER -----
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
