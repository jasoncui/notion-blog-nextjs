// Test Supabase connection
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('draft_shares').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('Connection error:', error.message);
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('Draft shares table exists and is accessible');
    }
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

testConnection();
