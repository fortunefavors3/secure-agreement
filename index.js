<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cheqmart Surplus Funds Agreement</title>
<style>
  body {
    font-family: Arial, Helvetica, sans-serif;
    background: #eef2f7;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    margin: 0;
  }

  .container {
    background: #fff;
    padding: 30px 40px;
    border-radius: 14px;
    box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    max-width: 650px;
    width: 100%;
  }

  .logo {
    display: block;
    margin: 0 auto 20px auto;
    width: 120px;
  }

  h1 {
    text-align: center;
    color: #2c3e50;
    margin-bottom: 15px;
    font-size: 24px;
  }

  label {
    display: block;
    margin-top: 15px;
    font-weight: bold;
    color: #555;
  }

  input[type="text"], input[type="email"] {
    width: 100%;
    padding: 10px 14px;
    margin-top: 5px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-size: 14px;
  }

  .agreement-box {
    border: 1px solid #ccc;
    border-radius: 8px;
    padding: 10px;
    max-height: 220px;
    overflow-y: auto;
    background: #f9f9f9;
    margin-top: 10px;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
  }

  canvas {
    border: 1px solid #ccc;
    border-radius: 8px;
    width: 100%;
    height: 160px;
    margin-top: 10px;
    cursor: crosshair;
  }

  .buttons {
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
  }

  button {
    padding: 10px 22px;
    font-size: 14px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  button#clear { background: #e74c3c; color: #fff; }
  button#submit { background: #3498db; color: #fff; }
  button:hover { opacity: 0.9; }

  .success {
    text-align: center;
    color: green;
    margin-top: 15px;
    font-weight: bold;
  }

  .signature-preview {
    margin-top: 10px;
    text-align: center;
  }

  .signature-preview img {
    border: 1px solid #ccc;
    border-radius: 6px;
    max-width: 100%;
    height: auto;
  }
</style>
</head>
<body>

<div class="container">
  <img src="logo.png" alt="Company Logo" class="logo">
  <h1>Cheqmart Surplus Funds Recovery Agreement</h1>

  <form id="agreementForm">
    <label for="name">Full Name</label>
    <input type="text" id="name" required>

    <label for="email">Email Address</label>
    <input type="email" id="email" required>

    <label>Service Agreement Details</label>
    <div class="agreement-box" id="agreementText">
      <p><strong>1. Fee:</strong> 30% of recovered surplus funds. This fee is contingent upon successful recovery of surplus funds.</p>
      <p><strong>2. Payment:</strong> Payment will be made directly from the County. No upfront fees are required.</p>
      <p><strong>3. Ownership:</strong> The client retains full ownership of all surplus funds at all times.</p>
      <p><strong>4. Consent:</strong> By signing below, the client agrees to all terms outlined in this agreement, including the fee and payment structure.</p>
      <p><strong>5. Confidentiality:</strong> All information provided will be kept confidential unless required by law.</p>
      <p><strong>6. Limitation of Liability:</strong> Cheqmart is not liable for any delays or issues outside of its control.</p>
      <p><strong>7. Governing Law:</strong> This agreement is governed by the laws of the State of Colorado.</p>
      <p>Please read carefully before signing.</p>
    </div>

    <label for="signature">Draw Your Signature</label>
    <canvas id="signature"></canvas>

    <div class="buttons">
      <button type="button" id="clear">Clear</button>
      <button type="submit" id="submit">Submit</button>
    </div>

    <div class="signature-preview" id="signaturePreview"></div>
    <div class="success" id="successMessage"></div>
  </form>
</div>

<script>
const canvas = document.getElementById('signature');
const ctx = canvas.getContext('2d');
const previewDiv = document.getElementById('signaturePreview');
let drawing = false;

function resizeCanvas() {
  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('mousedown', () => drawing = true);
canvas.addEventListener('mouseup', () => drawing = false);
canvas.addEventListener('mouseout', () => drawing = false);
canvas.addEventListener('mousemove', e => {
  if(!drawing) return;
  ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
  ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke();
  updatePreview();
});
canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing = true; });
canvas.addEventListener('touchend', e => { e.preventDefault(); drawing = false; });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if(!drawing) return;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const x = touch.clientX - rect.left;
  const y = touch.clientY - rect.top;
  ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x,y); ctx.stroke();
  updatePreview();
});

document.getElementById('clear').addEventListener('click', () => {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  previewDiv.innerHTML = '';
});

function updatePreview() {
  const dataUrl = canvas.toDataURL('image/png');
  previewDiv.innerHTML = `<img src="${dataUrl}" alt="Signature Preview">`;
}

document.getElementById('agreementForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const signature = canvas.toDataURL('image/png');
  const timestamp = new Date().toISOString();
  const userAgent = navigator.userAgent;

  try {
    const response = await fetch('/create-agreement', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ name, email, signature, timestamp, userAgent })
    });
    const data = await response.json();
    if(data.success){
      document.getElementById('successMessage').innerText = '✅ Agreement submitted successfully!';
      ctx.clearRect(0,0,canvas.width,canvas.height);
      previewDiv.innerHTML = '';
    } else {
      document.getElementById('successMessage').innerText = '❌ Submission failed!';
    }
  } catch(err){
    document.getElementById('successMessage').innerText = '❌ Error sending form!';
    console.error(err);
  }
});
</script>
</body>
</html>
