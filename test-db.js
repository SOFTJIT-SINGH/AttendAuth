import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Logging in...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'yoxay40195@sskaid.com',
    password: '12345678'
  });

  if (authError) {
    console.error('Login failed:', authError.message);
    return;
  }

  console.log('Login success! User ID:', authData.user.id);

  console.log('Fetching attendance_logs...');
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('student_id', authData.user.id);

  if (error) {
    console.error('Fetch failed:', error);
  } else {
    console.log(`Fetch success! Found ${data.length} records.`);
    console.log(data);
  }
}

test();
