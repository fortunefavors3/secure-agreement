import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

/// 🔑 HEALTH-SAFE ROOT ROUTE
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "agreement.html"));
});

/// 🔑 AGREEMENT + PDF ENDPOINT
app.post("/generate-pdf", async (req, res) => {
  try {
    const { name, signature } = req.body;

    if (!name || !signature) {
      return res.status(400).json({ error: "Missing name or signature" });
    }

    const filePath = `/tmp/agreement-${Date.now()}.pdf`;
    const doc = new PDFDocument();
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    doc.fontSize(16).text("Surplus Funds Recovery Agreement", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Client Name: ${name}`);
    doc.moveDown();
    doc.text("Client agrees to a 30% contingency fee paid directly by the county.");
    doc.moveDown();

    doc.text("Signature:");
    doc.image(signature, { fit: [250, 100] });
    doc.moveDown();

    doc.text(`Signed: ${new Date().toLocaleString()}`);
    doc.text(`IP Address: ${req.ip}`);

    doc.end();

    stream.on("finish", async () => {

      // ✅ EMAIL ONLY RUNS IF SMTP IS CONFIGURED
      if (
        process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASS
      ) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: process.env.EMAIL_TO,
          subject: "New Signed Agreement",
          text: "Attached is the signed agreement.",
          attachments: [{ filename: "agreement.pdf", path: filePath }]
        });
      }

      res.json({ success: true });
    });

  } catch (err) {
    console.error("PDF ERROR:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Secure Agreement Service running on port ${PORT}`);
});
