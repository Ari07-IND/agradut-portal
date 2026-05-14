import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pnsecneevymyszhuyhpp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuc2VjbmVldnlteXN6aHV5aHBwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTMwMTksImV4cCI6MjA5MzAyOTAxOX0.TabQkaui2ZzDWaONaTPEmZi2I9qPUG72CWKlfmkR45U';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testOtp() {
  console.log("Sending OTP to agradutkolkata@gmail.com...");
  const { data, error } = await supabase.auth.signInWithOtp({
    email: 'agradutkolkata@gmail.com',
    options: {
      shouldCreateUser: true,
    }
  });
  
  if (error) {
    console.error("Full Error Object:", JSON.stringify(error, null, 2));
    console.error("Error Message:", error.message);
  } else {
    console.log("Success! OTP sent.", data);
  }
}

testOtp();
