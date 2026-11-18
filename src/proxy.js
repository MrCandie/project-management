import { NextResponse } from "next/server";
import * as jose from "jose";

const rateLimitStore = new Map();

const rateLimits = [
  {
    pattern: /^\/api\/v1\/valentine\/ai$/,
    max: 5,
    windowMs: 60 * 1000,
  },
  {
    pattern: /^\/api\/v1\/auth\/.*$/,
    max: 5,
    windowMs: 60 * 1000,
  },
  {
    pattern: /^\/api\/v1\/order\/.*$/,
    max: 20,
    windowMs: 60 * 1000,
  },
  {
    pattern: /^\/api\/v1\/ai\/.*$/,
    max: 5,
    windowMs: 60 * 1000,
  },
  {
    pattern: /^\/api\/v1\/.*$/,
    max: 100,
    windowMs: 60 * 1000,
  },
];

const allowedOrigins = ["http://localhost:3000"];

export const config = {
  matcher: [
    "/api/v1/auth/change-password",
    "/api/v1/project/:path*",
    "/api/v1/task/:path*",
  ],
};

function getClientIp(req) {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function checkRateLimit(ip, pathname) {
  const limitConfig = rateLimits.find((limit) => limit.pattern.test(pathname));

  if (!limitConfig) return true;

  const key = `${ip}:${pathname}`;
  const now = Date.now();

  const record = rateLimitStore.get(key) || {
    count: 0,
    resetAt: now + limitConfig.windowMs,
  };

  if (now >= record.resetAt) {
    record.count = 0;
    record.resetAt = now + limitConfig.windowMs;
  }

  record.count += 1;
  rateLimitStore.set(key, record);

  return record.count <= limitConfig.max;
}

export async function proxy(req) {
  const ip = getClientIp(req);
  const pathname = req.nextUrl.pathname;

  if (!checkRateLimit(ip, pathname)) {
    return NextResponse.json(
      { message: "Too many requests. Try again later." },
      { status: 429 },
    );
  }

  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");

    if (!allowedOrigins.includes(origin)) {
      return new Response("Forbidden", { status: 403 });
    }

    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const token = authHeader.slice(7).trim();

  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const { payload } = await jose.jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );

    if (!payload.id) {
      return NextResponse.json(
        { message: "Invalid auth token" },
        { status: 401 },
      );
    }

    const requestHeaders = new Headers(req.headers);

    requestHeaders.set("user", String(payload.id));
    requestHeaders.set("token", token);
    requestHeaders.set("usertype", String(payload.usertype || ""));

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );

    return response;
  } catch (error) {
    console.error("JWT verification error:", error);

    return NextResponse.json(
      { message: "Authentication failed" },
      { status: 401 },
    );
  }
}
