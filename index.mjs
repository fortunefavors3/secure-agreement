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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "agreement.html"));
});

app.post("/generate-pdf", async (req, res) => {
  const { name, signature, agreementText } = req.body;

  if (!name || !signature) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const doc = new PDFDocument();
  const filePath = `/tmp/agreement-${Date.now()}.pdf`;
  const stream = fs.createWriteStream(filePath);

  doc.pipe(stream);

  doc.fontSize(16).text("Surplus Funds Recovery Agreement", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Client Name: ${name}`);
  doc.moveDown();
  doc.text(agreementText || "Client agrees to a 30% recovery fee paid directly by the county.");
  doc.moveDown();

  doc.text("Signature:");
  doc.image(signature, { width: 200 });
  doc.moveDown();

  doc.text(`Signed on: ${new Date().toLocaleString()}`);
  doc.text(`IP Address: ${req.ip}`);

  doc.end();

  stream.on("finish", async () => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
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
      text: "Attached is a signed surplus funds recovery agreement.",
      attachments: [
        {
          filename: "agreement.pdf",
          path: filePath
        }
      ]
    });

    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
