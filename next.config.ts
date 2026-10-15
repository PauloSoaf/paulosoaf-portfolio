import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

/**
 * CSP baseline (RNF-009). Pages are statically generated, so per-request nonces
 * are not possible and Next.js inlines its RSC payload: `'unsafe-inline'` is
 * required for scripts. See ADR-008 for the trade-off and hardening path.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "frame-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  experimental: {
    // Root layout lives under app/[locale]; unmatched URLs need a standalone 404 (ADR-005).
    globalNotFound: true,
  },
  async headers() {
    const lab = isDev || (process.env.PORTFOLIO_CONTENT_PREVIEW === "1" && process.env.EXPERIMENTAL_WORKSTATION === "1");
    return [{ source: "/:path*", headers: securityHeaders }, ...(lab ? [
      { source: "/workstation/embed-fixture", headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-ancestors 'none'", "frame-ancestors 'self'") },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
      ] },
      { source: "/:locale(pt|en|es)/workstation-lab", headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy.replace("frame-src 'self'", "frame-src 'self' https://www.nutriopus.com.br https://www.xn--advogadadborahlima-jwb.com.br") },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ] },
    ] : [])];
  },
};

export default nextConfig;
