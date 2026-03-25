import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",   value: "on" },
  { key: "X-Frame-Options",          value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",   value: "nosniff" },
  { key: "Referrer-Policy",          value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",       value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const config: NextConfig = {
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],
};

export default withSentryConfig(config, {
  org:     "ordo",
  project: "ordo-nextjs",

  // Upload source maps for readable stack traces in production
  silent: true,
  widenClientFileUpload: true,

  // Route Sentry traffic through /monitoring to avoid ad-blockers
  tunnelRoute: "/monitoring",

  // Automatically instrument server components
  webpack: {
    autoInstrumentServerFunctions: true,
    autoInstrumentMiddleware: false,
  },
});
