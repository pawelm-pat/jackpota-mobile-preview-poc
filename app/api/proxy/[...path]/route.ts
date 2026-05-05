import { NextRequest, NextResponse } from "next/server";

const ORIGIN = "https://www.jackpota.com";
// Prefix stored under vercel.app domain so they don't collide with our own cookies
const COOKIE_PREFIX = "jk_";

// ─── Cookie relay helpers ────────────────────────────────────────────────────

/** Build a Cookie header for the upstream request using stored jk_* cookies. */
function buildUpstreamCookieHeader(request: NextRequest): string {
  return request.cookies
    .getAll()
    .filter((c) => c.name.startsWith(COOKIE_PREFIX))
    .map((c) => `${c.name.slice(COOKIE_PREFIX.length)}=${c.value}`)
    .join("; ");
}

/**
 * Relay Set-Cookie headers from the upstream response back to the browser,
 * stored under our domain (vercel.app) with the jk_ prefix and SameSite=Lax.
 */
function relaySetCookies(upstream: Response, response: NextResponse) {
  const rawCookies: string[] =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];

  for (const raw of rawCookies) {
    const parts = raw.split(";").map((s) => s.trim());
    const nameValue = parts[0];
    const eqIdx = nameValue.indexOf("=");
    if (eqIdx < 0) continue;

    const name = nameValue.slice(0, eqIdx).trim();
    const value = nameValue.slice(eqIdx + 1).trim();
    const directives = parts.slice(1);

    const isHttpOnly = directives.some(
      (d) => d.toLowerCase() === "httponly"
    );
    const isSecure = directives.some((d) => d.toLowerCase() === "secure");

    const maxAgeDir = directives.find((d) =>
      d.toLowerCase().startsWith("max-age=")
    );
    const maxAge = maxAgeDir
      ? parseInt(maxAgeDir.split("=")[1], 10)
      : undefined;

    const expiresDir = directives.find((d) =>
      d.toLowerCase().startsWith("expires=")
    );
    const expires = expiresDir
      ? new Date(expiresDir.slice("expires=".length))
      : undefined;

    response.cookies.set({
      name: COOKIE_PREFIX + name,
      value,
      path: "/",
      httpOnly: isHttpOnly,
      secure: isSecure,
      sameSite: "lax",
      ...(maxAge !== undefined ? { maxAge } : {}),
      ...(expires !== undefined && !maxAge ? { expires } : {}),
    });
  }
}

// ─── Core proxy logic ────────────────────────────────────────────────────────

async function proxyRequest(
  request: NextRequest,
  path: string[]
): Promise<NextResponse> {
  const pathStr = path.join("/");
  const search = request.nextUrl.search;
  const targetUrl = `${ORIGIN}/${pathStr}${search}`;

  const cookieHeader = buildUpstreamCookieHeader(request);

  const upstreamHeaders: Record<string, string> = {
    accept: request.headers.get("accept") ?? "*/*",
    "accept-language":
      request.headers.get("accept-language") ?? "en-US,en;q=0.9",
    "user-agent":
      request.headers.get("user-agent") ??
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    referer: ORIGIN,
    host: "www.jackpota.com",
    origin: ORIGIN,
  };

  if (cookieHeader) upstreamHeaders["cookie"] = cookieHeader;

  const contentType = request.headers.get("content-type");
  if (contentType) upstreamHeaders["content-type"] = contentType;

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(request.method)) {
    body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body: body ?? undefined,
      redirect: "manual", // handle redirects so we can rewrite Location header
    });
  } catch (err) {
    return new NextResponse(`Proxy connection error: ${err}`, { status: 502 });
  }

  // ── Redirects ──────────────────────────────────────────────────────────────
  if (upstream.status >= 300 && upstream.status < 400) {
    const location = upstream.headers.get("location") ?? "/";
    const rewritten = location.startsWith(ORIGIN)
      ? location.replace(ORIGIN, "/api/proxy")
      : location;
    const redirectResponse = NextResponse.redirect(
      new URL(rewritten, request.url),
      { status: upstream.status }
    );
    relaySetCookies(upstream, redirectResponse);
    return redirectResponse;
  }

  // ── Build safe response headers (no anti-framing headers) ─────────────────
  const outHeaders = new Headers();
  const upstreamContentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";
  outHeaders.set("content-type", upstreamContentType);

  const cacheControl = upstream.headers.get("cache-control");
  if (cacheControl) outHeaders.set("cache-control", cacheControl);
  const etag = upstream.headers.get("etag");
  if (etag) outHeaders.set("etag", etag);

  // Explicitly skip: X-Frame-Options, Content-Security-Policy (frame-ancestors)

  // ── Body ───────────────────────────────────────────────────────────────────
  let responseBody: BodyInit | null;

  if (upstreamContentType.includes("text/html")) {
    let html = await upstream.text();

    // Rewrite absolute jackpota.com references so navigation/redirects stay in-proxy
    html = html.replace(
      new RegExp(ORIGIN.replace(/\./g, "\\."), "g"),
      "/api/proxy"
    );

    // Inject a <base> tag so all relative URLs (/_next/static/*, images, etc.)
    // resolve back to jackpota.com — otherwise they 404 on the Vercel app.
    const baseTag = `<base href="${ORIGIN}/">`;
    if (html.includes("<head>")) {
      html = html.replace("<head>", `<head>${baseTag}`);
    } else if (html.includes("<HEAD>")) {
      html = html.replace("<HEAD>", `<HEAD>${baseTag}`);
    } else {
      html = baseTag + html;
    }

    responseBody = html;
  } else {
    // Stream binary / JSON / JS / CSS unchanged
    responseBody = upstream.body;
  }

  const response = new NextResponse(responseBody, {
    status: upstream.status,
    headers: outHeaders,
  });

  relaySetCookies(upstream, response);
  return response;
}

// ─── Route exports ───────────────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyRequest(request, (await params).path);
}
