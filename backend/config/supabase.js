require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl !== "your_supabase_project_url") {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log("Supabase client initialized.");
} else {
  console.warn("⚠️ Supabase credentials are missing or invalid in .env! Database connection will fail.");
}

module.exports = supabase;
