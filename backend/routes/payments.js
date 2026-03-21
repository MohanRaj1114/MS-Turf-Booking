const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const supabase = require('../config/supabase');
const { scheduleConfirmationCall } = require('../utils/voiceService');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE Razorpay order
router.post('/create-order', async (req, res) => {
  const { amount, currency = 'INR', notes = {} } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  try {
    const options = {
      amount: amount * 100, // Razorpay expects paise (amount * 100)
      currency,
      receipt: `receipt_${Date.now()}`,
      notes,
    };

    const order = await razorpay.orders.create(options);
    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// VERIFY payment signature
router.post('/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;

  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: 'Payment verification failed' });
  }

  // --- Payment is verified. Now save to Supabase ---
  if (supabase && bookingData) {
    try {
      // 1. Save booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert([{
          user_id: bookingData.userId,
          turf_id: bookingData.turfId,
          booking_date: bookingData.date,
          slot: JSON.stringify(bookingData.slot),
          player_name: bookingData.playerName,
          team_name: bookingData.teamName,
          status: 'confirmed',
        }])
        .select()
        .single();

      if (bookingError) console.error('Booking save error:', bookingError);

      // 2. Save payment record
      if (booking) {
        // Schedule voice reminder call (Flipkart style)
        const userPhone = bookingData.phone || "7904095892";
        scheduleConfirmationCall(booking.id, bookingData.playerName, userPhone);

        await supabase.from('payments').insert([{
          booking_id: booking.id,
          amount: bookingData.amount,
          status: 'paid',
          payment_method: 'razorpay',
        }]);
      }
    } catch (dbErr) {
      console.error('DB save after payment failed:', dbErr);
    }
  }

  res.status(200).json({ success: true, paymentId: razorpay_payment_id });
});

// Legacy: simple payment record (kept for fallback)
router.post('/', async (req, res) => {
  const { bookingId, amount, status, paymentMethod } = req.body;

  if (!supabase) {
    return res.status(500).json({ error: 'Database misconfigured' });
  }

  const { data, error } = await supabase
    .from('payments')
    .insert([{ booking_id: bookingId, amount, status, payment_method: paymentMethod }])
    .select();

  if (error) return res.status(400).json({ error: error.message });
  res.status(201).json({ message: 'Payment recorded', payment: data });
});

// GET financial stats for Admin Dashboard
router.get('/stats', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'Database misconfigured' });
  }

  try {
    // 1. Total Collection (Paid payments)
    const { data: totalPaid, error: totalPaidError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid');

    if (totalPaidError) throw totalPaidError;
    const totalAmount = totalPaid.reduce((sum, p) => sum + Number(p.amount), 0);

    // 2. 1-Day Collection (Today's paid payments)
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyPaid, error: dailyPaidError } = await supabase
      .from('payments')
      .select('amount')
      .gte('created_at', today);

    if (dailyPaidError) throw dailyPaidError;
    const dailyCollection = dailyPaid.reduce((sum, p) => sum + Number(p.amount), 0);

    // 3. Refund Amount (Cancelled bookings total amount)
    // We assume for now that cancelled bookings = 100% refund needed conceptually
    const { data: cancelledBookings, error: cancelledError } = await supabase
      .from('bookings')
      .select('id, payments(amount)')
      .eq('status', 'cancelled');

    if (cancelledError) throw cancelledError;
    const refundAmount = cancelledBookings.reduce((sum, b) => {
      const paymentAmount = b.payments ? (Array.isArray(b.payments) ? b.payments[0]?.amount : b.payments.amount) : 0;
      return sum + Number(paymentAmount || 0);
    }, 0);

    // 4. Also get a count of pending refunds (cancelled but not marked as refunded in payments table)
    const { data: realRefunds, error: realRefundsError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'refunded');
    
    if (realRefundsError) throw realRefundsError;
    const totalRefundedSoFar = realRefunds.reduce((sum, p) => sum + Number(p.amount), 0);

    res.status(200).json({
      totalAmount,
      dailyCollection,
      refundAmount: refundAmount, // Total "to be refunded" from cancellations
      totalRefunded: totalRefundedSoFar,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    res.status(500).json({ error: 'Failed to fetch financial stats' });
  }
});


module.exports = router;
