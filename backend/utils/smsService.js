const twilio = require('twilio');
const axios = require('axios');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = (accountSid && authToken) ? twilio(accountSid, authToken) : null;

const sendOTP = async (mobile, otp) => {
    // 1. Try Twilio (Primary Service)
    if (twilioClient && twilioPhone) {
        try {
            const formattedPhone = mobile.startsWith('+') ? mobile : `+91${mobile}`;
            console.log(`[SMSService] Sending Twilio OTP to ${formattedPhone}...`);
            const message = await twilioClient.messages.create({
                body: `Your MS Turf Book verification code is: ${otp}`,
                from: twilioPhone,
                to: formattedPhone
            });
            console.log(`[SMSService] Twilio message sent! SID: ${message.sid}`);
            return { success: true, method: 'twilio' };
        } catch (error) {
            console.error(`[SMSService] Twilio Error: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    // 2. Mock Fallback (For local testing without Twilio)
    console.warn('[SMSService] Twilio not configured. Using simulation.');
    console.log(`\n--- [SIMULATION] OTP DELIVERY ---`);
    console.log(`To: ${mobile}`);
    console.log(`Message: Your MS Turf Book verification code is: ${otp}`);
    console.log(`---------------------------------\n`);
    return { success: true, method: 'mock' };
};

module.exports = { sendOTP };
