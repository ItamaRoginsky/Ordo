import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 0.2,

  // Attach local variables to stack frames for better debugging
  integrations: [Sentry.localVariablesIntegration()],

  enabled: process.env.NODE_ENV === "production",
});
