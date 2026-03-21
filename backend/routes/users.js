const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');

// CREATE an user entry
router.post('/', async (req, res) => {
  const { name, email, mobile, password } = req.body;
  
  if (!supabase) {
    return res.status(500).json({ error: "Database misconfigured" });
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, mobile, password }])
    .select(); // In a real app, hash password!

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: "User created successfully", user: data[0] });
});

// LOGIN user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!supabase) {
    return res.status(500).json({ error: "Database misconfigured" });
  }

  // Find user by email
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // In production, compare hashed passwords! Using plaintext for MVP.
  if (data.password !== password) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // Remove password from returned data
  delete data.password;

  res.status(200).json({ message: "Login successful", user: data });
});

const { sendOTP } = require('../utils/smsService');

const otpStore = new Map();

// SEND OTP
router.post('/send-otp', async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ error: "Mobile number is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore.set(mobile, { otp, expires });

  const result = await sendOTP(mobile, otp);
  if (result.success) {
    res.status(200).json({ message: "OTP sent successfully" });
  } else {
    res.status(500).json({ error: "Failed to send OTP", details: result.error });
  }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const mobile = req.body.mobile?.toString().trim();
  const otp = req.body.otp?.toString().trim();
  
  console.log(`[Users] Verifying OTP for ${mobile}. Received: ${otp}`);
  
  const stored = otpStore.get(mobile);

  if (!stored) {
    console.warn(`[Users] No OTP found for ${mobile}. Current store keys:`, Array.from(otpStore.keys()));
    return res.status(400).json({ error: "No OTP sent to this number" });
  }
  
  if (Date.now() > stored.expires) {
    otpStore.delete(mobile);
    console.warn(`[Users] OTP expired for ${mobile}`);
    return res.status(400).json({ error: "OTP expired" });
  }

  if (stored.otp === otp) {
    otpStore.delete(mobile);
    console.log(`[Users] OTP verified successfully for ${mobile}`);
    res.status(200).json({ message: "OTP verified successfully" });
  } else {
    console.warn(`[Users] Invalid OTP for ${mobile}. Expected: ${stored.otp}, Got: ${otp}`);
    res.status(400).json({ error: "Invalid OTP" });
  }
});

module.exports = router;
