import express from 'express';
import bodyParser from 'body-parser';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

app.post('/create-agreement', async (req, res) => {
  try {
    const { name, email, signature, timestamp, userAgent } = req.body;

    const pdfPath = path.join(__dirname, 'agreements', `${Date.now()}-${name}.pdf`);
    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    doc.fontSize(18).text('Cheqmart Surplus Funds Recovery Agreement', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Client Name: ${name}`);
    doc.text(`Email: ${email}`);
    doc.text(`Timestamp: ${timestamp}`);
    doc.text(`User Agent: ${userAgent}`);
    doc.moveDown();

    doc.text(
      '1. Fee: 30% of recovered surplus funds. Contingent upon successful recovery.\n' +
      '2. Payment: Direct from County. No upfront fees.\n' +
      '3. Ownership: Client retains full ownership.\n' +
      '4. Consent: Client agrees to terms, fee, and payment.\n' +
      '5. Confidentiality: All info kept private unless required by law.\n' +
      '6. Limitation of Liability: Cheqmart not liable for external delays.\n' +
      '7. Governing Law: State of Colorado.\n'
    );
    doc.moveDown();
    doc.text('Electronic Signature:');
    
    if (signature) {
      const base64Data = signature.replace(/^data:image\/png;base64,/, '');
      const sigBuffer = Buffer.from(base64Data, 'base64');
      doc.image(sigBuffer, { width: 200 });
    }

    doc.end();

    writeStream.on('finish', async () => {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"Cheqmart" <${process.env.EMAIL_USER}>`,
        to: email,
        bcc: process.env.EMAIL_BCC || process.env.EMAIL_USER,
        subject: 'Your Signed Cheqmart Agreement',
        text: 'Attached is your signed agreement for your records.',
        attachments: [{ filename: 'Cheqmart-Agreement.pdf', path: pdfPath }]
      });

      res.json({ success: true });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
