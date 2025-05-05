import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
 
const protectedPaths = ['/dashboard', '/deposit', '/transaction', '/redeem', '/loan', '/success']
 
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
 
 
  if (protectedPaths.includes(pathname)) {
    const wallet = request.cookies.get('wallet')?.value
 
 
    if (!wallet) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }
 
 
  return NextResponse.next()
}
 
 
export const config = {
  matcher: ['/dashboard', '/deposit', '/transaction', '/redeem', '/loan','/success']
}