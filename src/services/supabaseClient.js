/**
 * Supabase Client Configuration
 * Used for production authentication with Supabase Auth
 */
import { createClient } from '@supabase/supabase-js'

// Environment detection
const isProduction = import.meta.env.VITE_ENVIRONMENT === 'production'
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

// Only initialize Supabase client in production
if (isProduction && supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage
    }
  })
}

/**
 * Get Supabase client instance
 * Only available in production mode
 */
export const getSupabaseClient = () => {
  if (!isProduction) {
    console.warn('Supabase client is only available in production mode')
    return null
  }
  
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  }
  
  return supabase
}

/**
 * Check if app is running in production mode with Supabase
 */
export const isSupabaseEnabled = () => {
  return isProduction && supabase !== null
}

/**
 * Get current Supabase session
 */
export const getSupabaseSession = async () => {
  if (!supabase) return null
  
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Get current Supabase user
 */
export const getSupabaseUser = async () => {
  if (!supabase) return null
  
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Sign out from Supabase
 */
export const signOutSupabase = async () => {
  if (!supabase) return
  
  await supabase.auth.signOut()
}

export default supabase
