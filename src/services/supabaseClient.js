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

/**
 * Sign in with Google OAuth
 * Redirects to Google sign-in page
 */
export const signInWithGoogle = async () => {
  if (!supabase) {
    throw new Error('Supabase not initialized')
  }

  const redirectUrl = `${window.location.origin}/`

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
