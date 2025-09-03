import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://heagzwnxlcvpwglyuoyg.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlYWd6d254bGN2cHdnbHl1b3lnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NTE0MzQsImV4cCI6MjA3MDIyNzQzNH0.VpiIpl8XYSKFelu0EhIb2V8dZD23vQ1jQaurIoe91Ak";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_PHONE_NUMBER = '+15555555555'; // A placeholder phone number

async function runTest() {
  console.log('Starting login test...');

  try {
    // 1. Send OTP
    console.log(`Sending OTP to ${TEST_PHONE_NUMBER}...`);
    const { data: sendOtpData, error: sendOtpError } = await supabase.functions.invoke('simplified-whatsapp-auth-send-otp', {
      body: {
        phone: TEST_PHONE_NUMBER,
        test_mode: true,
        signup_mode: false
      },
    });

    if (sendOtpError) {
      console.error('Failed to send OTP:', sendOtpError);
      return;
    }

    const testCode = sendOtpData?.debug?.testCode;
    if (!testCode) {
      console.error('Could not get test OTP code.');
      return;
    }
    console.log(`Received test OTP: ${testCode}`);

    // 2. Verify OTP
    console.log('Verifying OTP...');
    const { data: verifyOtpData, error: verifyOtpError } = await supabase.functions.invoke('simplified-whatsapp-auth-verify-otp', {
      body: {
        phone: TEST_PHONE_NUMBER,
        code: testCode,
        test_mode: true,
        signup_mode: false
      },
    });

    if (verifyOtpError) {
      console.error('Failed to verify OTP:', verifyOtpError);
      return;
    }

    if (!verifyOtpData.session) {
      console.error('Verification successful, but no session returned.');
      return;
    }

    console.log('OTP verification successful. Session data received.');

    // 3. Set the session
    console.log('Setting session...');
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: verifyOtpData.session.access_token,
      refresh_token: verifyOtpData.session.refresh_token,
    });

    if (sessionError) {
      console.error('Failed to set session:', sessionError);
      return;
    }
    console.log('Session set successfully.');

    // 4. Verify user state
    console.log('Verifying user state...');
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      console.log('✅ Test passed: User is logged in.');
      console.log('User:', user);
    } else {
      console.error('❌ Test failed: User is not logged in.');
    }
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
}

runTest();
