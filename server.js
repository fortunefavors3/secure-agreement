const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.static("public"));
app.use('/agreements', express.static(path.join(__dirname, 'agreements')));

// Make agreements folder if it doesn't exist
if(!fs.existsSync('./agreements')) fs.mkdirSync('./agreements');

app.post("/create-agreement", async (req, res) => {
  try {
    const { name, email, signature, timestamp, userAgent } = req.body;

    // --- PDF Generation ---
    const pdfName = `${name.replace(/\s+/g,'_')}_${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, 'agreements', pdfName);

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Header
    doc.fontSize(20).text("Cheqmart Surplus Funds Recovery Agreement", { align: 'center' });
    doc.moveDown(2);

    // Client info
    doc.fontSize(12).text(`Client Name: ${name}`);
    doc.text(`Email: ${email}`);
    doc.text(`Timestamp: ${timestamp}`);
    doc.text(`User Agent: ${userAgent}`);
    doc.moveDown();

    // Agreement Text
    doc.fontSize(11).text("Terms and Agreement:", { underline: true });
    doc.moveDown(0.5);
    doc.text("1. Fee: 30% of recovered surplus funds.");
    doc.text("2. Payment: Direct payment from County; no upfront fees.");
    doc.text("3. Ownership: Client retains full ownership at all times.");
    doc.text("4. Consent: By signing below, client agrees to all terms stated herein.");
    doc.moveDown(2);

    // Signature
    if(signature){
      const base64Data = signature.replace(/^data:image\/png;base64,/, '');
      const imgBuffer = Buffer.from(base64Data, 'base64');
      doc.text("Electronic Signature:");
      doc.image(imgBuffer, { width: 200 });
    }

    doc.end();

    // Wait for PDF to finish writing
    await new Promise(resolve => stream.on('finish', resolve));

    // --- Email PDF ---
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // e.g., smtp.yourdomain.com
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: `"Cheqmart Agreements" <${process.env.SMTP_USER}>`,
      to: email,
      bcc: process.env.BCC_EMAIL || '',
      subject: 'Your Signed Cheqmart Agreement',
      text: 'Attached is a copy of your signed agreement for your records.',
      attachments: [{ filename: pdfName, path: pdfPath }]
    });

    res.json({ success: true, pdf: `/agreements/${pdfName}` });

  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
