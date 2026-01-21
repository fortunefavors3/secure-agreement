import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/**
 * MAIN AGREEMENT PAGE
 */
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Secure Service Agreement</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>
  body {
    font-family: Arial, sans-serif;
    background: #f5f5f5;
    padding: 20px;
  }
  .container {
    max-width: 900px;
    margin: auto;
    background: #fff;
    padding: 25px;
    border-radius: 8px;
  }
  h1, h2 {
    text-align: center;
  }
  .agreement {
    height: 300px;
    overflow-y: scroll;
    border: 1px solid #ccc;
    padding: 15px;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.6;
  }
  label {
    display: block;
    margin-top: 15px;
    font-weight: bold;
  }
  input[type="text"], input[type="email"] {
    width: 100%;
    padding: 10px;
    margin-top: 5px;
  }
  canvas {
    border: 2px solid #000;
    width: 100%;
    height: 150px;
    margin-top: 10px;
  }
  .checkbox {
    margin-top: 15px;
  }
  button {
    margin-top: 20px;
    width: 100%;
    padding: 15px;
    font-size: 16px;
    background: #000;
    color: #fff;
    border: none;
    cursor: pointer;
  }
</style>
</head>
<body>

<div class="container">
<h1>Service Agreement</h1>

<div class="agreement">
<h2>Surplus Funds Recovery Agreement</h2>

<p>This Agreement is entered into between the undersigned Client and the Service Provider.</p>

<p><strong>Services:</strong> Provider agrees to assist Client in identifying, recovering, and facilitating payment of surplus funds held by a county or governmental entity.</p>

<p><strong>Fee:</strong> Client agrees to pay Provider a contingency fee equal to <strong>30% of all recovered surplus funds</strong>.</p>

<p><strong>Payment Method:</strong> Client authorizes direct payment of the Provider’s fee from the county or entity distributing the funds, where permitted.</p>

<p><strong>No Guarantee:</strong> Provider makes no guarantee regarding the amount or success of recovery.</p>

<p><strong>Authorization:</strong> Client authorizes Provider to communicate with counties, courts, and agencies on Client’s behalf.</p>

<p><strong>Governing Law:</strong> This Agreement shall be governed by the laws of the applicable state.</p>

<p><strong>Electronic Signature:</strong> Client agrees that electronic signature is legally binding.</p>
</div>

<form method="POST" action="/submit">
  <label>Full Legal Name</label>
  <input type="text" name="name" required />

  <label>Email Address</label>
  <input type="email" name="email" required />

  <label>Signature</label>
  <canvas id="signature"></canvas>
  <input type="hidden" name="signatureData" id="signatureData" />

  <div class="checkbox">
    <input type="checkbox" id="agree" required />
    <label for="agree">I agree to the terms above</label>
  </div>

  <button type="submit">Sign & Submit Agreement</button>
</form>
</div>

<script>
  const canvas = document.getElementById("signature");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  canvas.width = canvas.offsetWidth;
  canvas.height = canvas.offsetHeight;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.touches ? e.touches[0].clientX : e.clientX) - rect.left,
      y: (e.touches ? e.touches[0].clientY : e.clientY) - rect.top
    };
  }

  function start(e) {
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!drawing) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function stop() {
    drawing = false;
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stop);

  canvas.addEventListener("touchstart", start);
  canvas.addEventListener("touchmove", draw);
  canvas.addEventListener("touchend", stop);

  document.querySelector("form").addEventListener("submit", () => {
    document.getElementById("signatureData").value =
      canvas.toDataURL("image/png");
  });
</script>

</body>
</html>
`);
});

/**
 * TEMP SUBMIT HANDLER (next step)
 */
app.post("/submit", (req, res) => {
  res.send("<h2>Agreement submitted successfully.</h2>");
});

app.listen(PORT, () => {
  console.log("Secure Agreement Service Running on port", PORT);
});
