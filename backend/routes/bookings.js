const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { scheduleConfirmationCall } = require('../utils/voiceService');

// GET all bookings (Admin)
router.get('/', async (req, res) => {
  if (!supabase) return res.status(500).json({ error: "Database misconfigured" });

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// GET bookings for a specific turf and date (Availability Check)
router.get('/check', async (req, res) => {
  const { turfId, date } = req.query;
  
  if (!supabase) return res.status(500).json({ error: "Database misconfigured" });
  if (!turfId || !date) return res.status(400).json({ error: "turfId and date are required" });

  const { data, error } = await supabase
    .from('bookings')
    .select('slot')
    .eq('turf_id', turfId)
    .eq('booking_date', date)
    .eq('status', 'confirmed');

  if (error) return res.status(400).json({ error: error.message });
  
  // Return just an array of booked slot starts for easy checking
  const bookedSlots = data.map(b => {
    try {
      const slotObj = typeof b.slot === 'string' ? JSON.parse(b.slot) : b.slot;
      return slotObj.start;
    } catch (e) {
      return null;
    }
  }).filter(s => s !== null);

  res.json(bookedSlots);
});

// CREATE a booking
router.post('/', async (req, res) => {
  const { userId, turfId, date, slot, playerName, teamName, phone, amount } = req.body;
  
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
      slot: typeof slot === 'object' ? JSON.stringify(slot) : slot, 
      player_name: playerName, 
      team_name: teamName,
      phone: phone,
      amount: amount,
      status: 'confirmed'
    }])
    .select();

  if (error) return res.status(400).json({ error: error.message });

  // Schedule voice reminder call (Flipkart style)
  const booking = data[0];
  if (booking) {
    scheduleConfirmationCall(booking.id, playerName, phone || "7904095892");
  }

  res.status(201).json({ message: "Booking confirmed", booking: data });
});

module.exports = router;
