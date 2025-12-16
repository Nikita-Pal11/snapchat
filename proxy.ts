import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/LandingPage','/sign-in','/sign-up','/api/webhooks'])

export default clerkMiddleware(async (auth, req) => {
  const { isAuthenticated } = await auth()

  // Allow LandingPage to be public
  if (isPublicRoute(req)) return NextResponse.next()

  // Protect all other routes
  if (!isAuthenticated) {
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
