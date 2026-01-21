import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json({ limit: "10mb" }));

// Serve index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint to receive form data and signature
app.post("/submit", async (req, res) => {
  try {
    const { name, email, signatureDataUrl } = req.body;

    // Create PDF
    const pdfPath = path.join(__dirname, `agreement-${Date.now()}.pdf`);
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    doc.fontSize(20).text("Surplus Funds Recovery Service Agreement", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Client Name: ${name}`);
    doc.text(`Client Email: ${email}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.text("Full agreement terms go here...", { align: "justify" });
    doc.moveDown();

    // Add signature if available
    if (signatureDataUrl) {
      const base64Data = signatureDataUrl.replace(/^data:image\/png;base64,/, "");
      const imgPath = path.join(__dirname, `sig-${Date.now()}.png`);
      fs.writeFileSync(imgPath, base64Data, "base64");
      doc.image(imgPath, { width: 200 });
    }

    doc.end();

    writeStream.on("finish", async () => {
      // Send email with PDF attached
      const transporter = nodemailer.createTransport({
        host: "smtp.example.com", // replace with your SMTP
        port: 587,
        secure: false,
        auth: {
          user: "your-email@example.com",
          pass: "your-password",
        },
      });

      await transporter.sendMail({
        from: '"Surplus Funds Service" <your-email@example.com>',
        to: email,
        subject: "Your Service Agreement",
        text: "Please find attached your service agreement.",
        attachments: [{ filename: "agreement.pdf", path: pdfPath }],
      });

      res.json({ success: true, message: "PDF generated and emailed successfully." });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
