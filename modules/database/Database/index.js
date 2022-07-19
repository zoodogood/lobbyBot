import supabase from '@supabase/supabase-js';

const {
  database_host:  HOST,
  database_token: TOKEN,
} = process.env;


const database = supabase.createClient(HOST, TOKEN);

export default database;
