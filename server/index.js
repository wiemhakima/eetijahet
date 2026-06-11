const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ----- ETA prediction endpoint -----
app.post('/api/eta', (req, res) => {
  const { pickup_lat, pickup_lon, drop_lat, drop_lon, hour_of_day, day_of_week } = req.body;

  if (
    pickup_lat === undefined || pickup_lon === undefined ||
    drop_lat === undefined || drop_lon === undefined ||
    hour_of_day === undefined || day_of_week === undefined
  ) {
    return res.status(400).json({
      error: 'Missing required parameters',
      required: {
        pickup_lat: 'number',
        pickup_lon: 'number',
        drop_lat: 'number',
        drop_lon: 'number',
        hour_of_day: 'number',
        day_of_week: 'string (e.g., "Monday")'
      }
    });
  }

  const scriptPath = path.join(__dirname, 'predict_eta.py');
  const command = `python3 "${scriptPath}" ${pickup_lat} ${pickup_lon} ${drop_lat} ${drop_lon} ${hour_of_day} "${day_of_week}"`;

  console.log(`Executing command: ${command}`);

  exec(command, { timeout: 10000 }, (err, stdout, stderr) => {
    if (err) {
      console.error('Execution error:', err);
      return res.status(500).json({
        error: 'Prediction failed',
        details: err.message,
        stderr: stderr
      });
    }

    if (stderr) console.error('Python stderr:', stderr);
    if (!stdout) return res.status(500).json({ error: 'No prediction result returned' });

    const match = stdout.match(/(\d+\.\d+)/);
    if (!match) return res.status(500).json({ error: 'Invalid prediction result format', raw_output: stdout });

    const eta = parseFloat(match[1]);
    if (isNaN(eta)) return res.status(500).json({ error: 'Invalid prediction result' });

    res.json({
      eta_minutes: eta,
      received: req.body,
      timestamp: new Date()
    });
  });
});

// ----- Route for distance & path -----
app.get('/api/v1/get_route', (req, res) => {
  const { pickup, dropoff } = req.query;

  if (!pickup || !dropoff) {
    return res.status(400).json({ error: 'pickup and dropoff query params required, e.g., ?pickup=lat,lon&dropoff=lat,lon' });
  }

  // Pour l'instant on fait un mock simple
  // Plus tard tu peux lier ça à ton model Python ou un service de routing
  const pickupCoords = pickup.split(',').map(Number);
  const dropoffCoords = dropoff.split(',').map(Number);

  if (pickupCoords.length !== 2 || dropoffCoords.length !== 2) {
    return res.status(400).json({ error: 'Invalid coordinate format. Use lat,lon' });
  }

  const path = [
    pickupCoords,
    [(pickupCoords[0] + dropoffCoords[0]) / 2, (pickupCoords[1] + dropoffCoords[1]) / 2],
    dropoffCoords
  ];

  const distance = Math.sqrt(
    Math.pow(dropoffCoords[0] - pickupCoords[0], 2) +
    Math.pow(dropoffCoords[1] - pickupCoords[1], 2)
  ) * 111000; // approx en mètres

  res.json({
    distance,
    eta: distance / 1000 / 40 * 60, // mock ETA en minutes à 40 km/h
    path
  });
});

// ----- Welcome route -----
app.get('/', (req, res) => {
  res.json({ message: 'API server running', version: '1.0.0' });
});

// ----- Start server -----
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});