import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE } from "@/i18n/config";
import { resolvePreferredLocale } from "@/i18n/negotiate";

/**
 * Only `/` is negotiated (ADR-005): saved choice → Accept-Language → `pt`. Localized URLs are
 * never touched, so a shared `/es/...` link always opens in Spanish and stays fully static.
 */
export function proxy(request: NextRequest) {
  const locale = resolvePreferredLocale({
    cookieLocale: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });

  const url = request.nextUrl.clone();
  url.pathname = `/${locale}`;
  const response = NextResponse.redirect(url, 307);
  response.headers.set("Vary", "Cookie, Accept-Language");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: "/",
};
