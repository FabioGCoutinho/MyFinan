import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  'https://kzlifujmpgnasvchfpzh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlmdWptcGduYXN2Y2hmcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyMzY0MjAsImV4cCI6MjA0MzgxMjQyMH0.wUzeee7YjhLVRRXdDTwg67Gpi59SmkAfRukbGrae8DU'
)
