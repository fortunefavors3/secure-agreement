require("dotenv").config();
const express = require("express");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json({ limit: "10mb" }));

app.post("/sign", async (req, res) => {
  try {
    const { name, email, signature } = req.body;
    const timestamp = new Date().toISOString();
    const userAgent = req.headers["user-agent"];
    const ip = req.ip;

    const hash = crypto
      .createHash("sha256")
      .update(name + email + timestamp + ip)
      .digest("hex");

    const pdfPath = path.join("agreements", `agreement_${hash}.pdf`);

    const doc = new PDFDocument();
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    doc.fontSize(18).text("Surplus Funds Recovery Agreement", { align: "center" });
    doc.moveDown();
    doc.text(`Name: ${name}`);
    doc.text(`Email: ${email}`);
    doc.text(`IP: ${ip}`);
    doc.text(`Timestamp: ${timestamp}`);
    doc.text(`Hash: ${hash}`);
    doc.moveDown();
    doc.text("Signature:");

    if (signature) {
      const img = Buffer.from(signature.split(",")[1], "base64");
      doc.image(img, { width: 200 });
    }

    doc.end();

    stream.on("finish", async () => {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: "Agreements <agreements@example.com>",
        to: email,
        subject: "Your Signed Agreement",
        text: "Attached is your signed agreement.",
        attachments: [{ filename: "Agreement.pdf", path: pdfPath }]
      });

      res.json({ success: true, hash });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something broke" });
  }
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
