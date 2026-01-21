import express from "express";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

/* =========================
   MAIN AGREEMENT PAGE
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "agreement.html"));
});

/* =========================
   FORM SUBMISSION
========================= */
app.post("/submit", async (req, res) => {
  try {
    const { name, email, signatureData } = req.body;

    if (!name || !email || !signatureData) {
      return res.status(400).send("Missing required fields");
    }

    /* ===== CREATE PDF ===== */
    const pdfPath = `/tmp/agreement-${Date.now()}.pdf`;
    const doc = new PDFDocument({ margin: 50 });

    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    doc.fontSize(18).text("Surplus Funds Recovery Agreement", { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`
Client Name: ${name}
Client Email: ${email}

Services:
Provider agrees to assist Client in identifying and recovering surplus funds.

Fee:
Client agrees to pay a contingency fee equal to 30% of recovered funds.

Payment Authorization:
Client authorizes direct payment from the county or issuing authority.

Electronic Signature:
The signature below constitutes a legally binding agreement.
    `);

    doc.moveDown();

    // Signature Image
    const base64Data = signatureData.replace(/^data:image\/png;base64,/, "");
    const signatureBuffer = Buffer.from(base64Data, "base64");

    doc.text("Signature:");
    doc.image(signatureBuffer, {
      width: 200
    });

    doc.moveDown();
    doc.text(`Signed on: ${new Date().toLocaleString()}`);

    doc.end();

    await new Promise(resolve => writeStream.on("finish", resolve));

    /* ===== EMAIL PDF ===== */
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.EMAIL_TO || email,
      subject: "Signed Service Agreement",
      text: "Attached is the signed service agreement.",
      attachments: [
        {
          filename: "Signed-Agreement.pdf",
          path: pdfPath
        }
      ]
    });

    res.send(`
      <h2>Agreement Signed Successfully</h2>
      <p>A copy has been emailed.</p>
    `);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing agreement");
  }
});

app.listen(PORT, () => {
  console.log("Secure Agreement Service Running on port", PORT);
});
