import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './database.types'

export function createClient() {
  return createBrowserClient<Database>(
    'https://kzlifujmpgnasvchfpzh.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bGlmdWptcGduYXN2Y2hmcHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgyMzY0MjAsImV4cCI6MjA0MzgxMjQyMH0.wUzeee7YjhLVRRXdDTwg67Gpi59SmkAfRukbGrae8DU'
  )
}
