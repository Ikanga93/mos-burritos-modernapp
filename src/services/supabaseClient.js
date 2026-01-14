/**
 * Supabase Client Configuration
 * Used for production authentication with Supabase Auth
 */
import { createClient } from '@supabase/supabase-js'

// Environment detection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null

// Initialize Supabase client if credentials are provided
if (supabaseUrl && supabaseAnonKey) {
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
 */
export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error('Supabase client not initialized. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.')
  }
  
  return supabase
}

/**
 * Check if app is running with Supabase enabled
 */
export const isSupabaseEnabled = () => {
  return supabase !== null
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

/**
 * Sign in with Google OAuth
 * Redirects to Google sign-in page
 */
export const signInWithGoogle = async () => {
  if (!supabase) {
    throw new Error('Supabase not initialized')
  }

  const redirectUrl = `${window.location.origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })

  if (error) throw error
  return data
}

/**
 * Handle OAuth callback - extracts session from URL after OAuth redirect
 */
export const handleOAuthCallback = async () => {
  if (!supabase) return null

  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('OAuth callback error:', error)
    return null
  }

  return session
}

export default supabase
