const express = require("express");
const router = express.Router();

// Route GET /get_route
router.get("/get_route", (req, res) => {
  const { pickup, dropoff } = req.query;
  if (!pickup || !dropoff)
    return res.status(400).json({ error: "Missing pickup or dropoff" });

  // Simule une route simple
  const pickupCoords = pickup.split(",").map(Number);
  const dropoffCoords = dropoff.split(",").map(Number);

  const path = [
    pickupCoords,
    [(pickupCoords[0] + dropoffCoords[0]) / 2, (pickupCoords[1] + dropoffCoords[1]) / 2],
    dropoffCoords,
  ];

  res.json({
    distance: 5000, // m fictif
    eta: 10,        // min fictif
    path
  });
});

module.exports = router;