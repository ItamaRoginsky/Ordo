import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Reuse the same Ratelimit instance across requests (module-level singleton)
let ratelimit: Ratelimit | null = null;

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null; // Rate limiting disabled when Upstash is not configured
  }
  if (!ratelimit) {
    ratelimit = new Ratelimit({
      redis: new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(30, "60 s"), // 30 requests per minute per IP
      analytics: true,
    });
  }
  return ratelimit;
}

// Strict limiter for sensitive auth/admin endpoints — 10 requests per minute
let strictRatelimit: Ratelimit | null = null;

function getStrictRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!strictRatelimit) {
    strictRatelimit = new Ratelimit({
      redis: new Redis({
        url:   process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      }),
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
    });
  }
  return strictRatelimit;
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function rateLimit(req: NextRequest, strict = false) {
  const limiter = strict ? getStrictRatelimit() : getRatelimit();
  if (!limiter) return null; // Not configured — allow all

  const ip = getIp(req);
  const { success, limit, remaining, reset } = await limiter.limit(ip);

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit":     String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset":     String(reset),
          "Retry-After":           String(Math.ceil((reset - Date.now()) / 1000)),
        },
      }
    );
  }
  return null;
}
