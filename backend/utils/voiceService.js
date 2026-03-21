const twilio = require('twilio');

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

const scheduleConfirmationCall = (bookingId, playerName, phone, delayMinutes = 1) => {
    const delayMs = delayMinutes * 60 * 1000;

    console.log(`[VoiceService] Scheduled confirmation call for Booking ID: ${bookingId} to ${playerName} (${phone}) in ${delayMinutes} minutes.`);

    setTimeout(async () => {
        if (!client) {
            const missing = [];
            if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
            if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
            if (!twilioPhone) missing.push('TWILIO_PHONE_NUMBER');

            console.warn(`[VoiceService] Twilio client not fully initialized. Missing: ${missing.join(', ')}. Skipping real call.`);
            console.log(`\n--- MOCK VOICE CALL (PREVIEW) ---`);
            console.log(`To: ${phone}`);
            console.log(`Message: "Hello ${playerName}, your booking with MS Turf Book is confirmed."`);
            console.log(`----------------------------------\n`);
            return;
        }

        try {
            console.log(`[VoiceService] Initiating Twilio call to ${phone}...`);
            const call = await client.calls.create({
                twiml: `<Response><Say voice="alice" language="en-IN">Hello ${playerName}, your booking with MS Turf Book is confirmed. We look forward to seeing you at the turf. Enjoy your game! Thank you for choosing MS Turf Book.</Say></Response>`,
                to: phone.startsWith('+') ? phone : `+91${phone}`, // Defaulting to India if no code
                from: twilioPhone
            });
            console.log(`[VoiceService] Call initiated successfully. Call SID: ${call.sid}`);
        } catch (error) {
            console.error(`[VoiceService] Twilio Call Error:`, error.message);
        }
    }, delayMs);
};

module.exports = {
    scheduleConfirmationCall
};
