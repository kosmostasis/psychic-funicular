import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  // Only run middleware on page routes; skip _next/static and static assets so they cannot 404 due to middleware.
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|ico|css|js)$).*)"],
};

export function middleware(_request: NextRequest) {
  return NextResponse.next();
}
