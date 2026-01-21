// server.js
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

// Create agreement route
app.post('/create-agreement', async (req, res) => {
  try {
    const { name, email, signature, feeAmount } = req.body;

    const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
    const chunks = [];
    doc.on('data', chunk => chunks.push(chunk));

    doc.fontSize(18).text('Surplus Funds Recovery Agreement', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Client Name: ${name}`);
    doc.text(`Email: ${email}`);
    doc.text(`Fee Amount: $${feeAmount}`);
    doc.moveDown();
    doc.text(
      'This agreement confirms your engagement with our service. ' +
      'You retain full ownership of any recovered funds. ' +
      'Payment is contingent on successful recovery and will be paid directly.'
    );
    doc.moveDown();
    doc.text('Electronic Signature:');
    if (signature) {
      const sigBuffer = Buffer.from(signature.replace(/^data:image\/png;base64,/, ''), 'base64');
      doc.image(sigBuffer, { width: 200 });
    }
    doc.end();

    const pdfBuffer = await new Promise(resolve => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    // Send email
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
      from: `"Your Company" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Signed Surplus Funds Agreement',
      text: 'Attached is your signed agreement.',
      attachments: [{ filename: 'Agreement.pdf', content: pdfBuffer }]
    });

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

