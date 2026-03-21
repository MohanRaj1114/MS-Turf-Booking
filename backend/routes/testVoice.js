const express = require('express');
const router = express.Router();
const { scheduleConfirmationCall } = require('../utils/voiceService');

// TEST route to trigger a voice call
router.get('/', (req, res) => {
    const { phone, name } = req.query;

    if (!phone) {
        return res.status(400).json({ error: "Phone number is required. Usage: /api/test-voice?phone=7904095892&name=PlayerName" });
    }

    const playerName = name || "Test User";
    
    // Trigger in 6 seconds for testing
    scheduleConfirmationCall("TEST-ID", playerName, phone, 0.1);

    res.json({ 
        message: "Test call scheduled!", 
        details: {
            to: phone,
            name: playerName,
            note: "Call will arrive in approximately 6 seconds."
        }
    });
});

module.exports = router;
