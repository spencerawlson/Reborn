/**
 * Locale routing: every public page lives under /en, /fr, or /ht.
 * A path without a locale is redirected to the visitor's saved or browser
 * language. The locale is passed to the root layout in x-locale so <html
 * lang> is right. /admin and API routes are not localized.
 */
import { NextResponse, type NextRequest } from "next/server";
import { detectLocale, isLocale } from "@/lib/i18n/index";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (isLocale(first)) {
    const headers = new Headers(request.headers);
    headers.set("x-locale", first);
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set("locale", first, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return response;
  }

  const locale = detectLocale(request.headers.get("accept-language"), request.cookies.get("locale")?.value);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except Next internals, admin, API routes, and files with an extension.
  matcher: ["/((?!_next|admin|api|.*\\..*).*)"],
};
