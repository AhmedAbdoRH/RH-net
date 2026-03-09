import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ikelmblsikapgbxbpebz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZWxtYmxzaWthcGdieGJwZWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMzQ4ODIsImV4cCI6MjA3ODkxMDg4Mn0.vsolbFTOeV2iq26d3kvib3cBSOKQ6yk1arpmEqBUt90'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
