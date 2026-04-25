import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'sb_publishable_ACJWlzQHLZjBrEguHvfOxg_3BJgxAaH'; // твой публикуемый ключ

export const supabase = createClient(supabaseUrl, supabaseAnonKey);