const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { scheduleConfirmationCall } = require('../utils/voiceService');

// CREATE a booking
router.post('/', async (req, res) => {
  const { userId, turfId, date, slot, playerName, teamName } = req.body;
  
  if (!supabase) {
    return res.status(500).json({ error: "Database misconfigured" });
  }

  // Insert timing/booking data into Supabase
  const { data, error } = await supabase
    .from('bookings')
    .insert([{ 
      user_id: userId, 
      turf_id: turfId, 
      booking_date: date, 
      slot: JSON.stringify(slot), 
      player_name: playerName, 
      team_name: teamName,
      status: 'confirmed'
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });

  // Schedule voice reminder call (Flipkart style)
  const booking = data[0];
  if (booking) {
    scheduleConfirmationCall(booking.id, playerName, req.body.phone || "7904095892");
  }

  res.status(201).json({ message: "Booking confirmed", booking: data });
});

module.exports = router;
