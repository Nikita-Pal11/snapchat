import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/LandingPage','/sign-in','/sign-up','/api/webhooks'])

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated } = await auth()

  // Allow LandingPage, sign-in, sign-up, and webhooks to be public
  if (isPublicRoute(req)) return NextResponse.next()

  // Also check if they have a guest cookie session
  const isGuest = req.cookies.has('snapchat_guest_clerk_id')

  // Protect all other routes if they are neither authenticated nor a guest
  if (!isAuthenticated && !isGuest) {
    const url = new URL('/LandingPage', req.url) // MUST be absolute
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
