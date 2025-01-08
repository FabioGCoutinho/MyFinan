import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
