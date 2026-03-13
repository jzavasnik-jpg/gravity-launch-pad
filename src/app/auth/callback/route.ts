import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  // If "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('=== AUTH CALLBACK START ===')
  console.log('[Auth Callback] URL:', request.url)
  console.log('[Auth Callback] Origin:', origin)
  console.log('[Auth Callback] Processing callback:', { hasCode: !!code, hasError: !!error, next })
  console.log('[Auth Callback] All cookies:', request.cookies.getAll().map(c => c.name))

  // Handle OAuth errors
  if (error) {
    console.error('[Auth Callback] OAuth error:', error, errorDescription)
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(errorDescription || error)}`)
  }

  if (code) {
    const cookieStore = await cookies()

    // Collect cookies to set after exchange
    const cookiesToSet: Array<{ name: string; value: string; options: any }> = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(newCookies) {
            // Collect cookies during exchange
            newCookies.forEach((cookie) => {
              cookiesToSet.push(cookie)
            })
          },
        },
      }
    )

    console.log('[Auth Callback] Exchanging code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('[Auth Callback] Code exchange error:', exchangeError)
      return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(exchangeError.message)}`)
    }

    console.log('[Auth Callback] Session exchange successful, user:', data.user?.email)
    console.log('[Auth Callback] Setting', cookiesToSet.length, 'cookies')

    // Create redirect response AFTER exchange
    const redirectUrl = new URL(`${origin}${next}`)
    const response = NextResponse.redirect(redirectUrl)

    // Set all collected cookies on the response
    cookiesToSet.forEach(({ name, value, options }) => {
      console.log('[Auth Callback] Setting cookie:', name)
      response.cookies.set(name, value, {
        ...options,
        // Ensure cookies work in development (localhost)
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
    })

    return response
  }

  // No code provided
  console.error('[Auth Callback] No code provided')
  return NextResponse.redirect(`${origin}/?error=No%20authentication%20code%20provided`)
}
